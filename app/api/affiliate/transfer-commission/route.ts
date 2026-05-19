import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MIN_TRANSFER_AMOUNT = 10;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function toNumber(value: unknown) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid session. Please login again.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const amount = toNumber(body.amount);

    if (amount < MIN_TRANSFER_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum transfer amount is ₱${MIN_TRANSFER_AMOUNT.toFixed(
            2,
          )}.`,
        },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Profile not found.",
        },
        { status: 404 },
      );
    }

    const { data: commissions, error: commissionError } = await supabaseAdmin
      .from("affiliate_commissions")
      .select("*")
      .eq("referrer_id", user.id)
      .eq("status", "available")
      .order("created_at", { ascending: true });

    if (commissionError) {
      return NextResponse.json(
        {
          success: false,
          message: commissionError.message,
        },
        { status: 500 },
      );
    }

    const availableRows = (commissions || []).map((commission) => {
      const commissionAmount = toNumber(commission.commission_amount);
      const usedAmount = toNumber(commission.used_amount);
      const availableAmount = Math.max(0, commissionAmount - usedAmount);

      return {
        commission,
        commissionAmount,
        usedAmount,
        availableAmount,
      };
    });

    const freshAvailableCommission = availableRows.reduce(
      (sum, item) => sum + item.availableAmount,
      0,
    );

    if (amount > freshAvailableCommission) {
      return NextResponse.json(
        {
          success: false,
          message: "Transfer amount is higher than your available commission.",
        },
        { status: 400 },
      );
    }

    let remainingAmount = amount;

    for (const item of availableRows) {
      if (remainingAmount <= 0) break;
      if (item.availableAmount <= 0) continue;

      const useFromThis = Math.min(item.availableAmount, remainingAmount);
      const newUsedAmount = item.usedAmount + useFromThis;
      const newStatus =
        newUsedAmount >= item.commissionAmount ? "used" : "available";

      const { error: updateCommissionError } = await supabaseAdmin
        .from("affiliate_commissions")
        .update({
          used_amount: newUsedAmount,
          status: newStatus,
        })
        .eq("id", item.commission.id);

      if (updateCommissionError) {
        return NextResponse.json(
          {
            success: false,
            message: updateCommissionError.message,
          },
          { status: 500 },
        );
      }

      remainingAmount -= useFromThis;
    }

    if (remainingAmount > 0.009) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Transfer failed because available commission changed. Please try again.",
        },
        { status: 409 },
      );
    }

    const currentBalance = toNumber(profile.balance);
    const newBalance = currentBalance + amount;

    const { error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
      })
      .eq("id", user.id);

    if (balanceError) {
      return NextResponse.json(
        {
          success: false,
          message: balanceError.message,
        },
        { status: 500 },
      );
    }

    const { data: transferRecord, error: transferError } = await supabaseAdmin
      .from("affiliate_commission_transfers")
      .insert({
        user_id: user.id,
        amount,
        status: "completed",
      })
      .select("id")
      .single();

    if (transferError) {
      return NextResponse.json(
        {
          success: false,
          message: transferError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "affiliate_commission_transfer",
      amount,
      status: "completed",
      description: "Affiliate commission transferred to wallet balance",
      reference_type: "affiliate_commission_transfer",
      reference_id: transferRecord.id,
    });

    await supabaseAdmin.from("cash_movements").insert({
      cash_account_id: null,
      type: "affiliate_commission_transfer",
      amount: -amount,
      description: "Affiliate commission transferred to user wallet",
      reference_type: "affiliate_commission_transfer",
      reference_id: transferRecord.id,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Affiliate Commission Transferred",
      message: `₱${amount.toFixed(
        2,
      )} affiliate commission was transferred to your wallet balance.`,
      type: "affiliate_commission_transfer",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      amount,
      newBalance,
      transferId: transferRecord.id,
      message: `₱${amount.toFixed(
        2,
      )} commission transferred to your balance.`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to transfer affiliate commission.",
      },
      { status: 500 },
    );
  }
}
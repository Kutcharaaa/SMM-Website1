import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) return "";

  return authHeader.replace("Bearer ", "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

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
    const depositId = cleanText(body.depositId);
    const action = cleanText(body.action).toLowerCase();
    const rejectReason = cleanText(body.rejectReason);

    if (!depositId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing deposit ID.",
        },
        { status: 400 },
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid deposit action.",
        },
        { status: 400 },
      );
    }

    if (action === "reject" && !rejectReason) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a reject reason.",
        },
        { status: 400 },
      );
    }

    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("child_panel_deposits")
      .select("*")
      .eq("id", depositId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (depositError || !deposit) {
      return NextResponse.json(
        {
          success: false,
          message: "Deposit request not found.",
        },
        { status: 404 },
      );
    }

    const currentStatus = String(deposit.status || "pending").toLowerCase();

    if (currentStatus !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Only pending deposits can be updated.",
        },
        { status: 400 },
      );
    }

    if (action === "approve") {
      const { data: customer, error: customerError } = await supabaseAdmin
        .from("child_panel_customers")
        .select("id, balance, email, username, firstname, lastname")
        .eq("id", deposit.customer_id)
        .eq("child_panel_id", deposit.child_panel_id)
        .maybeSingle();

      if (customerError || !customer) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer account not found.",
          },
          { status: 404 },
        );
      }

      const currentBalance = Number(customer.balance || 0);
      const amount = Number(deposit.amount || 0);
      const nextBalance = Number((currentBalance + amount).toFixed(6));
      const now = new Date().toISOString();

      const { error: customerUpdateError } = await supabaseAdmin
        .from("child_panel_customers")
        .update({
          balance: nextBalance,
          updated_at: now,
        })
        .eq("id", customer.id);

      if (customerUpdateError) {
        return NextResponse.json(
          {
            success: false,
            message: customerUpdateError.message,
          },
          { status: 500 },
        );
      }

      const { error: depositUpdateError } = await supabaseAdmin
        .from("child_panel_deposits")
        .update({
          status: "approved",
          approved_at: now,
          updated_at: now,
        })
        .eq("id", deposit.id);

      if (depositUpdateError) {
        await supabaseAdmin
          .from("child_panel_customers")
          .update({ balance: currentBalance, updated_at: new Date().toISOString() })
          .eq("id", customer.id);

        return NextResponse.json(
          {
            success: false,
            message: depositUpdateError.message,
          },
          { status: 500 },
        );
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        title: "Child Panel Deposit Approved",
        message: `Approved ₱${amount.toFixed(2)} add funds request for ${
          customer.firstname || customer.username || customer.email
        }.` ,
        type: "child_panel_deposit_approved",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Deposit approved and customer balance updated.",
        newBalance: nextBalance,
      });
    }

    const now = new Date().toISOString();

    const { error: rejectError } = await supabaseAdmin
      .from("child_panel_deposits")
      .update({
        status: "rejected",
        reject_reason: rejectReason,
        rejected_at: now,
        updated_at: now,
      })
      .eq("id", deposit.id);

    if (rejectError) {
      return NextResponse.json(
        {
          success: false,
          message: rejectError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Child Panel Deposit Rejected",
      message: `Rejected child panel add funds request: ${rejectReason}`,
      type: "child_panel_deposit_rejected",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Deposit rejected successfully.",
    });
  } catch (error) {
    console.error("CHILD_PANEL_OWNER_DEPOSIT_UPDATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update deposit request.",
      },
      { status: 500 },
    );
  }
}

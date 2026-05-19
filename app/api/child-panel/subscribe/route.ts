import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_CHILD_PANEL_PRICE = 349;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

async function getChildPanelPrice() {
  const { data, error } = await supabaseAdmin
    .from("platform_settings")
    .select("value")
    .eq("key", "child_panel_price")
    .maybeSingle();

  if (error) {
    console.warn("CHILD_PANEL_PRICE_SETTING_ERROR:", error.message);
    return DEFAULT_CHILD_PANEL_PRICE;
  }

  const price = toNumber(data?.value, DEFAULT_CHILD_PANEL_PRICE);

  return price > 0 ? price : DEFAULT_CHILD_PANEL_PRICE;
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

    const childPanelPrice = await getChildPanelPrice();

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, balance, reseller_level, child_panel_subscription_expires_at")
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

    const resellerLevel = Number(profile.reseller_level || 1);

    if (resellerLevel >= 3) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          child_panel_access: true,
          child_panel_access_type: "level_perk",
          child_panel_subscription_status: "inactive",
          child_panel_subscription_expires_at: null,
        })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json(
          {
            success: false,
            message: updateError.message,
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        accessType: "level_perk",
        message:
          "Child Panel is already unlocked free lifetime for your reseller level.",
      });
    }

    const currentBalance = Number(profile.balance || 0);

    if (currentBalance < childPanelPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. You need ₱${childPanelPrice.toFixed(
            2,
          )} to subscribe.`,
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const expiresAt = addOneMonth(now);
    const newBalance = currentBalance - childPanelPrice;

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("child_panel_subscriptions")
        .insert({
          user_id: user.id,
          price: childPanelPrice,
          status: "active",
          auto_renew: true,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          last_renewed_at: now.toISOString(),
        })
        .select("id")
        .single();

    if (subscriptionError) {
      return NextResponse.json(
        {
          success: false,
          message: subscriptionError.message,
        },
        { status: 500 },
      );
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
        child_panel_access: true,
        child_panel_access_type: "paid",
        child_panel_subscription_status: "active",
        child_panel_subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", user.id);

    if (updateProfileError) {
      return NextResponse.json(
        {
          success: false,
          message: updateProfileError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("cash_movements").insert({
      cash_account_id: null,
      type: "child_panel_subscription",
      amount: childPanelPrice,
      description: "Child Panel monthly subscription revenue",
      reference_type: "child_panel_subscription",
      reference_id: subscription.id,
    });

    await supabaseAdmin.from("wallet_transactions").insert({
      user_id: user.id,
      type: "child_panel_subscription",
      amount: -childPanelPrice,
      status: "completed",
      description: "Child Panel monthly subscription",
      reference_type: "child_panel_subscription",
      reference_id: subscription.id,
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Child Panel Subscription Activated",
      message: `Your Child Panel subscription is now active until ${expiresAt.toLocaleDateString()}. ₱${childPanelPrice.toFixed(
        2,
      )} was deducted from your wallet.`,
      type: "child_panel_subscription",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      price: childPanelPrice,
      newBalance,
      expiresAt: expiresAt.toISOString(),
      message: "Child Panel subscription activated successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe to Child Panel.",
      },
      { status: 500 },
    );
  }
}

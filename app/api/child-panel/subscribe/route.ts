import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DEFAULT_CHILD_PANEL_PRICE = 349;

function addOneMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getResellerRank(level: unknown) {
  const clean = String(level || "").toLowerCase().trim();

  if (clean.includes("ascend partner")) return 6;
  if (clean.includes("elite partner")) return 5;
  if (clean.includes("premium partner")) return 5;
  if (clean.includes("master reseller")) return 4;
  if (clean.includes("pro reseller")) return 3;
  if (clean.includes("power reseller")) return 2;
  if (clean.includes("new reseller")) return 1;

  const numericLevel = Number(level);
  if (Number.isFinite(numericLevel)) return numericLevel;

  return 1;
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
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

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
      .select(
        "id, balance, reseller_level, child_panel_access, child_panel_subscription_status, child_panel_subscription_expires_at",
      )
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

    const resellerRank = getResellerRank(profile.reseller_level);

    if (resellerRank >= 3) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          child_panel_access: true,
          child_panel_access_type: "level_perk",
          child_panel_subscription_status: "free_lifetime",
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

      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        title: "Child Panel Unlocked",
        message:
          "Your reseller level includes free lifetime Child Panel access.",
        type: "child_panel_unlocked",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        accessType: "level_perk",
        message:
          "Child Panel is already unlocked free lifetime for your reseller level.",
      });
    }

    const existingExpiresAt = profile.child_panel_subscription_expires_at
      ? new Date(profile.child_panel_subscription_expires_at)
      : null;

    const hasActiveSubscription =
      profile.child_panel_access === true &&
      profile.child_panel_subscription_status === "active" &&
      existingExpiresAt &&
      existingExpiresAt.getTime() > Date.now();

    if (hasActiveSubscription) {
      return NextResponse.json({
        success: true,
        accessType: "paid",
        message: "You already have an active Child Panel subscription.",
        expiresAt: existingExpiresAt.toISOString(),
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
    const newBalance = Number((currentBalance - childPanelPrice).toFixed(6));

    const { error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
        child_panel_access: true,
        child_panel_access_type: "paid",
        child_panel_subscription_status: "active",
        child_panel_subscription_expires_at: expiresAt.toISOString(),
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
        })
        .select("id")
        .single();

    if (subscriptionError) {
      await supabaseAdmin
        .from("profiles")
        .update({
          balance: currentBalance,
          child_panel_access: false,
          child_panel_access_type: null,
          child_panel_subscription_status: "inactive",
          child_panel_subscription_expires_at: null,
        })
        .eq("id", user.id);

      return NextResponse.json(
        {
          success: false,
          message: subscriptionError.message,
        },
        { status: 500 },
      );
    }

    try {
      await supabaseAdmin.from("cash_movements").insert({
        cash_account_id: null,
        type: "child_panel_subscription",
        amount: childPanelPrice,
        description: "Child Panel monthly subscription revenue",
        reference_type: "child_panel_subscription",
        reference_id: subscription.id,
      });
    } catch (error) {
      console.warn("CHILD_PANEL_CASH_MOVEMENT_WARNING:", error);
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Child Panel Subscription Activated",
      message: `Your Child Panel subscription is active until ${expiresAt.toLocaleDateString(
        "en-PH",
      )}.`,
      type: "child_panel_subscription",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      accessType: "paid",
      message: "Child Panel subscription activated successfully.",
      expiresAt: expiresAt.toISOString(),
      newBalance,
    });
  } catch (error) {
    console.error("CHILD_PANEL_SUBSCRIBE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe to Child Panel.",
      },
      { status: 500 },
    );
  }
}
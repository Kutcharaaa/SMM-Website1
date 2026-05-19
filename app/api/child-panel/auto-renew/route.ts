import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const now = new Date();
    const childPanelPrice = await getChildPanelPrice();

    const { data: subscriptions, error: subscriptionsError } =
      await supabaseAdmin
        .from("child_panel_subscriptions")
        .select("*")
        .eq("status", "active")
        .eq("auto_renew", true)
        .lte("expires_at", now.toISOString());

    if (subscriptionsError) {
      return NextResponse.json(
        {
          success: false,
          message: subscriptionsError.message,
        },
        { status: 500 },
      );
    }

    let renewedCount = 0;
    let expiredCount = 0;
    let skippedCount = 0;

    for (const subscription of subscriptions || []) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, balance, reseller_level")
        .eq("id", subscription.user_id)
        .single();

      if (profileError || !profile) {
        skippedCount += 1;
        continue;
      }

      const resellerLevel = Number(profile.reseller_level || 1);

      if (resellerLevel >= 3) {
        await supabaseAdmin
          .from("profiles")
          .update({
            child_panel_access: true,
            child_panel_access_type: "level_perk",
            child_panel_subscription_status: "inactive",
            child_panel_subscription_expires_at: null,
          })
          .eq("id", profile.id);

        await supabaseAdmin
          .from("child_panel_subscriptions")
          .update({
            status: "completed",
            auto_renew: false,
          })
          .eq("id", subscription.id);

        skippedCount += 1;
        continue;
      }

      const currentBalance = Number(profile.balance || 0);

      if (currentBalance >= childPanelPrice) {
        const newBalance = currentBalance - childPanelPrice;
        const newExpiresAt = addOneMonth(now);

        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({
            balance: newBalance,
            child_panel_access: true,
            child_panel_access_type: "paid",
            child_panel_subscription_status: "active",
            child_panel_subscription_expires_at: newExpiresAt.toISOString(),
          })
          .eq("id", profile.id);

        if (profileUpdateError) {
          skippedCount += 1;
          continue;
        }

        await supabaseAdmin
          .from("child_panel_subscriptions")
          .update({
            expires_at: newExpiresAt.toISOString(),
            last_renewed_at: now.toISOString(),
            price: childPanelPrice,
            status: "active",
          })
          .eq("id", subscription.id);

        await supabaseAdmin.from("cash_movements").insert({
          cash_account_id: null,
          type: "child_panel_auto_renew",
          amount: childPanelPrice,
          description: "Child Panel monthly auto-renewal revenue",
          reference_type: "child_panel_subscription",
          reference_id: subscription.id,
        });

        await supabaseAdmin.from("wallet_transactions").insert({
          user_id: profile.id,
          type: "child_panel_auto_renew",
          amount: -childPanelPrice,
          status: "completed",
          description: "Child Panel monthly auto-renewal",
          reference_type: "child_panel_subscription",
          reference_id: subscription.id,
        });

        await supabaseAdmin.from("notifications").insert({
          user_id: profile.id,
          title: "Child Panel Subscription Renewed",
          message: `Your Child Panel subscription has been renewed for ₱${childPanelPrice.toFixed(
            2,
          )}.`,
          type: "child_panel_auto_renew",
          is_read: false,
        });

        renewedCount += 1;
      } else {
        await supabaseAdmin
          .from("profiles")
          .update({
            child_panel_access: false,
            child_panel_access_type: "locked",
            child_panel_subscription_status: "expired",
          })
          .eq("id", profile.id);

        await supabaseAdmin
          .from("child_panel_subscriptions")
          .update({
            status: "expired",
            auto_renew: false,
          })
          .eq("id", subscription.id);

        await supabaseAdmin.from("notifications").insert({
          user_id: profile.id,
          title: "Child Panel Subscription Expired",
          message: `Your Child Panel subscription expired because your wallet balance was not enough for the ₱${childPanelPrice.toFixed(
            2,
          )} renewal.`,
          type: "child_panel_subscription_expired",
          is_read: false,
        });

        expiredCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Child Panel auto-renew check completed.",
      renewedCount,
      expiredCount,
      skippedCount,
      checkedCount: subscriptions?.length || 0,
      price: childPanelPrice,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process child panel auto-renew.",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return GET();
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("child_panel_subscriptions")
        .select("id, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        {
          success: false,
          message: subscriptionError.message,
        },
        { status: 500 },
      );
    }

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          message: "No active Child Panel subscription found.",
        },
        { status: 404 },
      );
    }

    const expiresAt = subscription.expires_at
      ? new Date(subscription.expires_at)
      : null;

    if (!expiresAt || expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your subscription is already expired. Please renew your Child Panel subscription.",
        },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("child_panel_subscriptions")
      .update({
        auto_renew: true,
      })
      .eq("id", subscription.id);

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
      title: "Child Panel Auto-Renew Enabled",
      message:
        "Your Child Panel auto-renew has been enabled. It will renew automatically if your wallet balance is enough.",
      type: "child_panel_auto_renew_enabled",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      expiresAt: subscription.expires_at,
      message: "Auto-renew enabled successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to enable auto-renew.",
      },
      { status: 500 },
    );
  }
}
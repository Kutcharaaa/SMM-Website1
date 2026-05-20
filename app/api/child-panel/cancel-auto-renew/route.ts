import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    const { data: subscription, error: subscriptionError } =
      await supabaseAdmin
        .from("child_panel_subscriptions")
        .select("id, expires_at, auto_renew")
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

    if (subscription.auto_renew === false) {
      return NextResponse.json({
        success: true,
        expiresAt: subscription.expires_at,
        message:
          "Auto-renew is already cancelled. Your Child Panel access will remain active until the current expiry date.",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("child_panel_subscriptions")
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
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

    await supabaseAdmin
      .from("profiles")
      .update({
        child_panel_auto_renew: false,
      })
      .eq("id", user.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: user.id,
      title: "Child Panel Auto-Renew Cancelled",
      message:
        "Your Child Panel auto-renew has been cancelled. Your access will remain active until your current subscription expires.",
      type: "child_panel_auto_renew_cancelled",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      expiresAt: subscription.expires_at,
      message:
        "Auto-renew cancelled successfully. Your Child Panel access will remain active until the current expiry date.",
    });
  } catch (error) {
    console.error("CHILD_PANEL_CANCEL_AUTO_RENEW_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to cancel auto-renew.",
      },
      { status: 500 },
    );
  }
}
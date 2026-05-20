import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = cleanText(body.slug);
    const token = cleanText(body.token);

    if (!slug || !token) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing session details.",
        },
        { status: 400 },
      );
    }

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select(
        "id, owner_user_id, panel_name, panel_slug, support_email, logo_url, primary_color, status",
      )
      .eq("panel_slug", slug)
      .maybeSingle();

    if (panelError || !panel) {
      return NextResponse.json(
        {
          success: false,
          message: "Child panel not found.",
        },
        { status: 404 },
      );
    }

    if (String(panel.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "This child panel is not active.",
        },
        { status: 403 },
      );
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("child_panel_customer_sessions")
      .select(
        "id, customer_id, child_panel_id, owner_user_id, token, expires_at, created_at",
      )
      .eq("token", token)
      .eq("child_panel_id", panel.id)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 },
      );
    }

    const expiresAt = new Date(session.expires_at);

    if (expiresAt.getTime() <= Date.now()) {
      await supabaseAdmin
        .from("child_panel_customer_sessions")
        .delete()
        .eq("id", session.id);

      return NextResponse.json(
        {
          success: false,
          message: "Session expired. Please login again.",
        },
        { status: 401 },
      );
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("child_panel_customers")
      .select(
        "id, child_panel_id, owner_user_id, email, username, firstname, lastname, balance, status, last_login_at, created_at",
      )
      .eq("id", session.customer_id)
      .eq("child_panel_id", panel.id)
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

    if (String(customer.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active. Please contact support.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      panel,
      customer,
      session: {
        expiresAt: session.expires_at,
      },
    });
  } catch (error) {
    console.error("CHILD_PANEL_CUSTOMER_ME_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify session.",
      },
      { status: 500 },
    );
  }
}
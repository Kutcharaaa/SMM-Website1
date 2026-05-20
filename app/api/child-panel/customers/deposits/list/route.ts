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
      .select("id, owner_user_id, panel_name, panel_slug, status")
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
      .select("id, customer_id, child_panel_id, expires_at")
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
      .select("id, status")
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
          message: "Your account is not active.",
        },
        { status: 403 },
      );
    }

    const { data: deposits, error: depositsError } = await supabaseAdmin
      .from("child_panel_deposits")
      .select(
        "id, amount, method, reference_number, proof_url, status, reject_reason, approved_at, rejected_at, created_at",
      )
      .eq("child_panel_id", panel.id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (depositsError) {
      return NextResponse.json(
        {
          success: false,
          message: depositsError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      deposits: deposits || [],
    });
  } catch (error) {
    console.error("CHILD_PANEL_DEPOSITS_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load deposit history.",
      },
      { status: 500 },
    );
  }
}

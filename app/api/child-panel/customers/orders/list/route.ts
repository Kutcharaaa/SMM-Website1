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
        { success: false, message: "Missing session details." },
        { status: 400 },
      );
    }

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select("id, panel_slug, status")
      .eq("panel_slug", slug)
      .maybeSingle();

    if (panelError || !panel) {
      return NextResponse.json(
        { success: false, message: "Child panel not found." },
        { status: 404 },
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
        { success: false, message: "Invalid or expired session." },
        { status: 401 },
      );
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await supabaseAdmin
        .from("child_panel_customer_sessions")
        .delete()
        .eq("id", session.id);

      return NextResponse.json(
        { success: false, message: "Session expired. Please login again." },
        { status: 401 },
      );
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("child_panel_orders")
      .select("*")
      .eq("child_panel_id", panel.id)
      .eq("customer_id", session.customer_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (ordersError) {
      return NextResponse.json(
        { success: false, message: ordersError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (error) {
    console.error("CHILD_PANEL_ORDERS_LIST_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load orders." },
      { status: 500 },
    );
  }
}
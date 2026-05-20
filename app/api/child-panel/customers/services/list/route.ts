import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function calculateMarkedUpPrice(basePrice: number, markupPercent: number) {
  const markupAmount = basePrice * (markupPercent / 100);
  return Number((basePrice + markupAmount).toFixed(6));
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
        "id, owner_user_id, panel_name, panel_slug, status, markup_percent",
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

    const { data: services, error: servicesError } = await supabaseAdmin
      .from("services")
      .select(
        "id, name, category, platform, description, price_per_1000, min_quantity, max_quantity, status",
      )
      .eq("status", "active")
      .order("platform", { ascending: true })
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .limit(1000);

    if (servicesError) {
      return NextResponse.json(
        {
          success: false,
          message: servicesError.message,
        },
        { status: 500 },
      );
    }

    const markupPercent = Number(panel.markup_percent || 0);

    const markedUpServices = (services || []).map((service) => {
      const basePrice = Number(service.price_per_1000 || 0);
      const customerPrice = calculateMarkedUpPrice(basePrice, markupPercent);
      const ownerProfitPer1000 = Number((customerPrice - basePrice).toFixed(6));

      return {
        ...service,
        base_price_per_1000: basePrice,
        customer_price_per_1000: customerPrice,
        markup_percent: markupPercent,
        owner_profit_per_1000: ownerProfitPer1000,
      };
    });

    return NextResponse.json({
      success: true,
      panel: {
        id: panel.id,
        panel_name: panel.panel_name,
        panel_slug: panel.panel_slug,
        markup_percent: markupPercent,
      },
      services: markedUpServices,
    });
  } catch (error) {
    console.error("CHILD_PANEL_SERVICES_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load services.",
      },
      { status: 500 },
    );
  }
}
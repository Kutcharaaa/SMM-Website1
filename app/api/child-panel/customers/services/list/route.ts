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

function detectPlatform(serviceName?: string | null, category?: string | null) {
  const text = `${serviceName || ""} ${category || ""}`.toLowerCase();

  if (text.includes("instagram") || text.includes(" ig ")) return "Instagram";
  if (text.includes("tiktok") || text.includes("tik tok")) return "TikTok";
  if (text.includes("youtube") || text.includes("yt ")) return "YouTube";
  if (text.includes("facebook") || text.includes("fb ")) return "Facebook";
  if (text.includes("telegram")) return "Telegram";
  if (text.includes("spotify")) return "Spotify";
  if (text.includes("twitter") || text.includes(" x ")) return "Twitter";
  if (text.includes("twitch")) return "Twitch";
  if (text.includes("discord")) return "Discord";
  if (text.includes("website") || text.includes("review")) return "Website";

  return "Other";
}

function detectOrderType(serviceName?: string | null, category?: string | null, description?: string | null) {
  const text = `${serviceName || ""} ${category || ""} ${description || ""}`.toLowerCase();

  if (
    text.includes("custom comment") ||
    text.includes("comments custom") ||
    text.includes("comment custom") ||
    text.includes("custom comments") ||
    text.includes("comment per line") ||
    text.includes("comments per line") ||
    text.includes("1 per line") ||
    text.includes("1per line") ||
    text.includes("own comments") ||
    text.includes("user comments")
  ) {
    return "custom_comments";
  }

  return "default";
}

async function getAllActiveServices() {
  const pageSize = 1000;
  let from = 0;
  const allServices: any[] = [];

  while (true) {
    const to = from + pageSize - 1;

    const { data, error } = await supabaseAdmin
      .from("services")
      .select(
        "id, name, category, platform, description, price_per_1000, min_quantity, max_quantity, status",
      )
      .eq("status", "active")
      .order("category", { ascending: true })
      .order("name", { ascending: true })
      .range(from, to);

    if (error) throw error;

    const rows = data || [];
    allServices.push(...rows);

    if (rows.length < pageSize) break;

    from += pageSize;

    if (from >= 50000) break;
  }

  return allServices;
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

    const services = await getAllActiveServices();
    const markupPercent = Number(panel.markup_percent || 0);

    const markedUpServices = services.map((service) => {
      const basePrice = Number(service.price_per_1000 || 0);
      const customerPrice = calculateMarkedUpPrice(basePrice, markupPercent);
      const ownerProfitPer1000 = Number((customerPrice - basePrice).toFixed(6));
      const platform = service.platform || detectPlatform(service.name, service.category);
      const orderType = detectOrderType(service.name, service.category, service.description);

      return {
        ...service,
        platform,
        order_type: orderType,
        requires_custom_comments: orderType === "custom_comments",
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
      total: markedUpServices.length,
      services: markedUpServices,
    });
  } catch (error: any) {
    console.error("CHILD_PANEL_SERVICES_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to load services.",
      },
      { status: 500 },
    );
  }
}

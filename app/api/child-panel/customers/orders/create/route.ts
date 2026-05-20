import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number)) return 0;

  return number;
}

function calculateCharge(pricePer1000: number, quantity: number) {
  if (!Number.isFinite(pricePer1000) || !Number.isFinite(quantity)) return 0;

  return Number(((quantity / 1000) * pricePer1000).toFixed(6));
}

function calculateMarkedUpPrice(basePrice: number, markupPercent: number) {
  const markupAmount = basePrice * (markupPercent / 100);

  return Number((basePrice + markupAmount).toFixed(6));
}

function getCommentLines(value: unknown) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isCustomCommentsService(
  serviceName?: string | null,
  category?: string | null,
) {
  const text = `${serviceName || ""} ${category || ""}`.toLowerCase();

  return (
    text.includes("custom comments") ||
    text.includes("comments custom") ||
    text.includes("custom comment") ||
    text.includes("comment custom")
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = cleanText(body.slug);
    const token = cleanText(body.token);
    const serviceId = cleanText(body.serviceId);
    const link = cleanText(body.link);
    const comments = cleanText(body.comments);
    const requestedQuantity = Math.floor(cleanNumber(body.quantity));

    if (!slug || !token) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing session details.",
        },
        { status: 400 },
      );
    }

    if (!serviceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a service.",
        },
        { status: 400 },
      );
    }

    if (!link) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your link.",
        },
        { status: 400 },
      );
    }

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select("id, owner_user_id, panel_name, panel_slug, status, markup_percent")
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
      .select("id, email, username, firstname, lastname, balance, status")
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

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select(
        "id, name, category, description, price_per_1000, min_quantity, max_quantity, status",
      )
      .eq("id", serviceId)
      .eq("status", "active")
      .maybeSingle();

    if (serviceError || !service) {
      return NextResponse.json(
        {
          success: false,
          message: "Service not found or inactive.",
        },
        { status: 404 },
      );
    }

    const customComments = isCustomCommentsService(
      service.name,
      service.category,
    );
    const commentLines = getCommentLines(comments);
    const quantity = customComments ? commentLines.length : requestedQuantity;

    if (customComments && commentLines.length <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your comments, one comment per line.",
        },
        { status: 400 },
      );
    }

    if (!customComments && quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid quantity.",
        },
        { status: 400 },
      );
    }

    const minQuantity = Number(service.min_quantity || 1);
    const maxQuantity = Number(service.max_quantity || 1000000);

    if (quantity < minQuantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum quantity is ${minQuantity.toLocaleString("en-PH")}.`,
        },
        { status: 400 },
      );
    }

    if (quantity > maxQuantity) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum quantity is ${maxQuantity.toLocaleString("en-PH")}.`,
        },
        { status: 400 },
      );
    }

    const basePricePer1000 = Number(service.price_per_1000 || 0);
    const markupPercent = Number(panel.markup_percent || 0);
    const customerPricePer1000 = calculateMarkedUpPrice(
      basePricePer1000,
      markupPercent,
    );

    const basePrice = calculateCharge(basePricePer1000, quantity);
    const customerPrice = calculateCharge(customerPricePer1000, quantity);
    const ownerProfit = Number((customerPrice - basePrice).toFixed(6));

    if (customerPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid service price.",
        },
        { status: 400 },
      );
    }

    const currentBalance = Number(customer.balance || 0);

    if (currentBalance < customerPrice) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient balance. Required: ₱${customerPrice.toFixed(
            2,
          )}, Available: ₱${currentBalance.toFixed(2)}.`,
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const newBalance = Number((currentBalance - customerPrice).toFixed(6));
    const savedComments = customComments ? commentLines.join("\n") : null;
    const orderType = customComments ? "custom_comments" : "default";

    const { error: balanceError } = await supabaseAdmin
      .from("child_panel_customers")
      .update({
        balance: newBalance,
        updated_at: now,
      })
      .eq("id", customer.id)
      .eq("child_panel_id", panel.id);

    if (balanceError) {
      return NextResponse.json(
        {
          success: false,
          message: balanceError.message,
        },
        { status: 500 },
      );
    }

    const { data: childOrder, error: childOrderError } = await supabaseAdmin
      .from("child_panel_orders")
      .insert({
        child_panel_id: panel.id,
        owner_user_id: panel.owner_user_id,
        customer_id: customer.id,

        main_order_id: null,
        service_id: service.id,
        service_name: service.name,
        link,
        quantity,

        base_price: basePrice,
        customer_price: customerPrice,
        markup_percent: markupPercent,
        owner_profit: ownerProfit,

        start_count: 0,
        current_count: 0,
        status: "pending",

        provider_order_id: null,
        provider_name: null,
        provider_response: null,
        synced_at: null,

        comments: savedComments,
        order_type: orderType,
        updated_at: now,
      })
      .select("*")
      .single();

    if (childOrderError) {
      await supabaseAdmin
        .from("child_panel_customers")
        .update({
          balance: currentBalance,
          updated_at: now,
        })
        .eq("id", customer.id)
        .eq("child_panel_id", panel.id);

      return NextResponse.json(
        {
          success: false,
          message: childOrderError.message,
        },
        { status: 500 },
      );
    }

    const { data: mainOrder, error: mainOrderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: panel.owner_user_id,

        service_name: service.name,
        link,
        quantity,
        price: basePrice,

        start_count: 0,
        current_count: 0,
        status: "pending",

        provider_order_id: null,
        provider_name: "Child Panel",

        source: "child_panel",
        child_panel_order_id: childOrder.id,
        child_panel_id: panel.id,
        child_panel_customer_id: customer.id,

        base_price: basePrice,
        customer_price: customerPrice,
        markup_percent: markupPercent,
        owner_profit: ownerProfit,

        comments: savedComments,
        order_type: orderType,
      })
      .select("id")
      .single();

    if (mainOrderError) {
      await supabaseAdmin
        .from("child_panel_customers")
        .update({
          balance: currentBalance,
          updated_at: now,
        })
        .eq("id", customer.id)
        .eq("child_panel_id", panel.id);

      await supabaseAdmin
        .from("child_panel_orders")
        .delete()
        .eq("id", childOrder.id);

      return NextResponse.json(
        {
          success: false,
          message: mainOrderError.message,
        },
        { status: 500 },
      );
    }

    const { error: linkError } = await supabaseAdmin
      .from("child_panel_orders")
      .update({
        main_order_id: mainOrder.id,
        updated_at: now,
      })
      .eq("id", childOrder.id);

    if (linkError) {
      await supabaseAdmin
        .from("child_panel_customers")
        .update({
          balance: currentBalance,
          updated_at: now,
        })
        .eq("id", customer.id)
        .eq("child_panel_id", panel.id);

      await supabaseAdmin.from("orders").delete().eq("id", mainOrder.id);

      await supabaseAdmin
        .from("child_panel_orders")
        .delete()
        .eq("id", childOrder.id);

      return NextResponse.json(
        {
          success: false,
          message: linkError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: panel.owner_user_id,
      title: "New Child Panel Order",
      message: `${
        customer.firstname || customer.username || customer.email
      } placed an order for ${service.name} on ${panel.panel_name}.`,
      type: "child_panel_order_created",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Order placed successfully.",
      order: {
        ...childOrder,
        main_order_id: mainOrder.id,
      },
      mainOrderId: mainOrder.id,
      balance: newBalance,
      pricing: {
        basePrice,
        customerPrice,
        ownerProfit,
        markupPercent,
      },
    });
  } catch (error) {
    console.error("CHILD_PANEL_ORDER_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order.",
      },
      { status: 500 },
    );
  }
}
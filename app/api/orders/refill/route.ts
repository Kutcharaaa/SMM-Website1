import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) return "";

  return authHeader.replace("Bearer ", "").trim();
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function isRefillAllowed(status: string | null | undefined) {
  const clean = String(status || "").toLowerCase();

  return ["completed", "partial"].includes(clean);
}

async function findProviderForOrder(order: any) {
  if (order.provider_id) {
    const { data } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("id", order.provider_id)
      .maybeSingle();

    if (data) return data;
  }

  if (order.provider_name) {
    const { data } = await supabaseAdmin
      .from("providers")
      .select("*")
      .ilike("name", order.provider_name)
      .maybeSingle();

    if (data) return data;
  }

  if (order.service_id) {
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("provider_id, provider_name")
      .eq("id", order.service_id)
      .maybeSingle();

    if (service?.provider_id) {
      const { data } = await supabaseAdmin
        .from("providers")
        .select("*")
        .eq("id", service.provider_id)
        .maybeSingle();

      if (data) return data;
    }

    if (service?.provider_name) {
      const { data } = await supabaseAdmin
        .from("providers")
        .select("*")
        .ilike("name", service.provider_name)
        .maybeSingle();

      if (data) return data;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

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

    const body = await request.json();
    const orderId = cleanText(body.orderId);

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing order ID.",
        },
        { status: 400 },
      );
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found.",
        },
        { status: 404 },
      );
    }

    if (!isRefillAllowed(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only completed or partial orders can request refill.",
        },
        { status: 400 },
      );
    }

    if (!order.provider_order_id) {
      return NextResponse.json(
        {
          success: false,
          message: "This order has no provider order ID, so refill cannot be requested.",
        },
        { status: 400 },
      );
    }

    if (String(order.refill_status || "").toLowerCase() === "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "A refill request is already pending for this order.",
        },
        { status: 400 },
      );
    }

    const provider = await findProviderForOrder(order);

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          message: "Provider not found for this order.",
        },
        { status: 404 },
      );
    }

    const formData = new FormData();
    formData.append("key", provider.api_key);
    formData.append("action", "refill");
    formData.append("order", String(order.provider_order_id));

    const providerResponse = await fetch(provider.api_url, {
      method: "POST",
      body: formData,
    });

    let result: any = null;

    try {
      result = await providerResponse.json();
    } catch {
      result = {
        error: "Invalid provider response.",
      };
    }

    if (!providerResponse.ok || result?.error) {
      await supabaseAdmin
        .from("orders")
        .update({
          refill_status: "failed",
          refill_provider_response: result,
          refill_requested_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      return NextResponse.json(
        {
          success: false,
          message: result?.error || "Provider rejected the refill request.",
          providerResponse: result,
        },
        { status: 400 },
      );
    }

    const refillId =
      result.refill ||
      result.refill_id ||
      result.id ||
      result.order ||
      null;

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        refill_status: "pending",
        refill_id: refillId ? String(refillId) : null,
        refill_provider_response: result,
        refill_requested_at: new Date().toISOString(),
      })
      .eq("id", order.id);

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          message: updateError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Refill request submitted successfully.",
      refillId,
      providerResponse: result,
    });
  } catch (error) {
    console.error("ORDER_REFILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to request refill.",
      },
      { status: 500 },
    );
  }
}
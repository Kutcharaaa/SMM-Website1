import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { orderId, action } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({
        success: false,
        message: "Missing order action details.",
      });
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({
        success: false,
        message: "Order not found.",
      });
    }

    if (!order.provider_order_id || !order.provider_name) {
      return NextResponse.json({
        success: false,
        message: "This order has no provider order ID.",
      });
    }

    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("name", order.provider_name)
      .single();

    if (!provider) {
      return NextResponse.json({
        success: false,
        message: "Provider not found.",
      });
    }

    const providerAction =
      action === "cancel"
        ? "cancel"
        : action === "refill"
        ? "refill"
        : action === "sync"
        ? "status"
        : "";

    if (!providerAction) {
      return NextResponse.json({
        success: false,
        message: "Invalid action.",
      });
    }

    const formData = new FormData();
    formData.append("key", provider.api_key);
    formData.append("action", providerAction);
    formData.append("order", String(order.provider_order_id));

    const response = await fetch(provider.api_url, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return NextResponse.json({
        success: false,
        message: result.error || "Provider action failed.",
      });
    }

    if (action === "sync") {
      const status = String(result.status || order.status).toLowerCase();

      let nextStatus = order.status;

      if (status.includes("complete")) nextStatus = "completed";
      else if (status.includes("progress")) nextStatus = "processing";
      else if (status.includes("process")) nextStatus = "processing";
      else if (status.includes("pending")) nextStatus = "pending";
      else if (status.includes("partial")) nextStatus = "partial";
      else if (status.includes("cancel")) nextStatus = "canceled";

      await supabaseAdmin
        .from("orders")
        .update({
          status: nextStatus,
          start_count: Number(result.start_count || order.start_count || 0),
          current_count: Number(result.remains || order.current_count || 0),
        })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        message: "Order synced successfully.",
      });
    }

    if (action === "cancel") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "cancel_requested",
        })
        .eq("id", order.id);

      return NextResponse.json({
        success: true,
        message: "Cancel request sent to provider.",
      });
    }

    if (action === "refill") {
      await supabaseAdmin.from("notifications").insert({
        user_id: order.user_id,
        title: "Refill Requested",
        message: `A refill request was submitted for your order: ${order.service_name}.`,
        type: "order_refill",
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: "Refill request sent to provider.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Action completed.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to process order action.",
    });
  }
}
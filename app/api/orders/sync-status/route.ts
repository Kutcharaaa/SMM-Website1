import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeStatus(providerStatus: string) {
  const status = providerStatus.toLowerCase();

  if (status.includes("complete")) return "completed";
  if (status.includes("progress")) return "processing";
  if (status.includes("process")) return "processing";
  if (status.includes("pending")) return "pending";
  if (status.includes("partial")) return "partial";
  if (status.includes("cancel")) return "canceled";
  if (status.includes("fail")) return "failed";
  if (status.includes("reject")) return "rejected";

  return status || "pending";
}

function calculateCurrentCount({
  nextStatus,
  quantity,
  remains,
  fallback,
}: {
  nextStatus: string;
  quantity: number;
  remains: number;
  fallback: number;
}) {
  if (nextStatus === "completed") return quantity;

  if (
    nextStatus === "canceled" ||
    nextStatus === "failed" ||
    nextStatus === "rejected"
  ) {
    return fallback;
  }

  return Math.max(0, quantity - remains);
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("authorization");
    const internalRequest = req.headers.get("x-internal-sync") === "true";

    if (
      secret !== `Bearer ${process.env.CRON_SECRET}` &&
      !internalRequest
    ) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not("provider_order_id", "is", null)
      .in("status", ["pending", "processing", "partial"])
      .limit(100);

    if (ordersError) {
      return NextResponse.json({
        success: false,
        message: ordersError.message,
      });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orders to sync.",
        synced: 0,
      });
    }

    let synced = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        let provider = null;

        if (order.provider_id) {
          const { data } = await supabaseAdmin
            .from("providers")
            .select("*")
            .eq("id", order.provider_id)
            .single();

          provider = data;
        }

        if (!provider && order.provider_name) {
          const { data } = await supabaseAdmin
            .from("providers")
            .select("*")
            .eq("name", order.provider_name)
            .single();

          provider = data;
        }

        if (!provider) {
          failed++;
          continue;
        }

        const formData = new FormData();
        formData.append("key", provider.api_key);
        formData.append("action", "status");
        formData.append("order", String(order.provider_order_id));

        const response = await fetch(provider.api_url, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          await supabaseAdmin
            .from("orders")
            .update({
              provider_response: result,
              provider_status: "sync_failed",
              synced_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          failed++;
          continue;
        }

        const nextStatus = normalizeStatus(String(result.status || order.status));
        const quantity = Number(order.quantity || 0);
        const remains = Number(result.remains || 0);
        const fallback = Number(order.current_count || 0);

        const nextCurrentCount = calculateCurrentCount({
          nextStatus,
          quantity,
          remains,
          fallback,
        });

        await supabaseAdmin
          .from("orders")
          .update({
            status: nextStatus,
            provider_status: String(result.status || nextStatus),
            provider_response: result,
            start_count: Number(result.start_count || order.start_count || 0),
            current_count: nextCurrentCount,
            synced_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        synced++;
      } catch (error) {
        console.error("ORDER_SYNC_ITEM_ERROR:", error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${synced} orders synced. ${failed} failed.`,
      synced,
      failed,
    });
  } catch (error) {
    console.error("ORDER_SYNC_ERROR:", error);

    return NextResponse.json({
      success: false,
      message: "Failed to sync order statuses.",
    });
  }
}
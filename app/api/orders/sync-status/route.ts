import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function normalizeStatus(providerStatus: string) {
  const status = String(providerStatus || "").toLowerCase().trim();

  if (status.includes("complete")) return "completed";
  if (status.includes("in progress")) return "processing";
  if (status.includes("progress")) return "processing";
  if (status.includes("process")) return "processing";
  if (status.includes("pending")) return "pending";
  if (status.includes("partial")) return "partial";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("canceled")) return "cancelled";
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
    nextStatus === "cancelled" ||
    nextStatus === "failed" ||
    nextStatus === "rejected"
  ) {
    return fallback;
  }

  return Math.max(0, quantity - remains);
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

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("authorization");
    const internalRequest = req.headers.get("x-internal-sync") === "true";

    if (secret !== `Bearer ${process.env.CRON_SECRET}` && !internalRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not("provider_order_id", "is", null)
      .in("status", [
        "pending",
        "processing",
        "partial",
        "Pending",
        "Processing",
        "Partial",
      ])
      .order("created_at", { ascending: false })
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
        failed: 0,
      });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        const provider = await findProviderForOrder(order);

        if (!provider) {
          failed++;

          errors.push(
            `No provider found for order ${order.id} / provider_order_id ${order.provider_order_id}`,
          );

          await supabaseAdmin
            .from("orders")
            .update({
              provider_status: "provider_not_found",
              synced_at: new Date().toISOString(),
            })
            .eq("id", order.id);

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

        let result: any = null;

        try {
          result = await response.json();
        } catch {
          result = {
            error: "Invalid provider JSON response.",
          };
        }

        if (!response.ok || result?.error) {
          failed++;

          errors.push(
            `Provider sync failed for order ${order.id}: ${
              result?.error || "Unknown provider error"
            }`,
          );

          await supabaseAdmin
            .from("orders")
            .update({
              provider_response: result,
              provider_status: "sync_failed",
              synced_at: new Date().toISOString(),
            })
            .eq("id", order.id);

          continue;
        }

        const rawProviderStatus = String(result.status || order.status || "");
        const nextStatus = normalizeStatus(rawProviderStatus);

        const quantity = Number(order.quantity || 0);
        const remains = Number(result.remains || 0);
        const fallback = Number(order.current_count || 0);

        const nextCurrentCount = calculateCurrentCount({
          nextStatus,
          quantity,
          remains,
          fallback,
        });

        const nextStartCount = Number(
          result.start_count || result.start || order.start_count || 0,
        );

        const { error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            status: nextStatus,
            provider_status: rawProviderStatus || nextStatus,
            provider_response: result,
            start_count: nextStartCount,
            current_count: nextCurrentCount,
            synced_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateError) {
          failed++;
          errors.push(`Update failed for order ${order.id}: ${updateError.message}`);
          continue;
        }

        synced++;
      } catch (error) {
        console.error("ORDER_SYNC_ITEM_ERROR:", error);
        failed++;
        errors.push(`Unexpected sync error for order ${order.id}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${synced} orders synced. ${failed} failed.`,
      synced,
      failed,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error("ORDER_SYNC_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to sync order statuses.",
      },
      { status: 500 },
    );
  }
}
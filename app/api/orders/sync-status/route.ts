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

  return status;
}

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("authorization");

    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
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
      .limit(50);

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

    for (const order of orders) {
      const { data: provider } = await supabaseAdmin
        .from("providers")
        .select("*")
        .eq("name", order.provider_name)
        .single();

      if (!provider) continue;

      const formData = new FormData();
      formData.append("key", provider.api_key);
      formData.append("action", "status");
      formData.append("order", String(order.provider_order_id));

      const response = await fetch(provider.api_url, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) continue;

      const nextStatus = normalizeStatus(String(result.status || order.status));

      await supabaseAdmin
        .from("orders")
        .update({
          status: nextStatus,
          start_count: Number(result.start_count || order.start_count || 0),
          current_count: Number(result.remains || order.current_count || 0),
        })
        .eq("id", order.id);

      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `${synced} orders synced successfully.`,
      synced,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to sync order statuses.",
    });
  }
}
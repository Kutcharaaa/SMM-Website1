import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type OrderRow = {
  id: string;
  service_name: string | null;
  created_at: string | null;
  synced_at: string | null;
  status: string | null;
  provider_status: string | null;
};

function normalizeStatus(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function isCompletedOrder(order: OrderRow) {
  const status = normalizeStatus(order.status);
  const providerStatus = normalizeStatus(order.provider_status);

  return (
    status === "completed" ||
    providerStatus === "completed" ||
    providerStatus.includes("complete")
  );
}

function secondsBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) return 0;
  if (endTime <= startTime) return 0;

  return Math.floor((endTime - startTime) / 1000);
}

async function loadAllOrders() {
  const allOrders: OrderRow[] = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("id, service_name, created_at, synced_at, status, provider_status")
      .not("created_at", "is", null)
      .not("synced_at", "is", null)
      .range(from, from + size - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data || []) as OrderRow[];
    allOrders.push(...rows);

    if (rows.length < size) break;
    from += size;
  }

  return allOrders;
}

export async function GET() {
  try {
    const orders = await loadAllOrders();

    const serviceMap = new Map<
      string,
      {
        service_name: string;
        fastest_seconds: number;
        total_seconds: number;
        completed_orders: number;
      }
    >();

    for (const order of orders) {
      if (!isCompletedOrder(order)) continue;

      const serviceName = String(order.service_name || "").trim();
      if (!serviceName) continue;

      const deliverySeconds = secondsBetween(order.created_at, order.synced_at);
      if (deliverySeconds <= 0) continue;

      const current =
        serviceMap.get(serviceName) ||
        {
          service_name: serviceName,
          fastest_seconds: deliverySeconds,
          total_seconds: 0,
          completed_orders: 0,
        };

      current.fastest_seconds = Math.min(
        current.fastest_seconds,
        deliverySeconds,
      );
      current.total_seconds += deliverySeconds;
      current.completed_orders += 1;

      serviceMap.set(serviceName, current);
    }

    const deliveryTimes = Array.from(serviceMap.values()).map((item) => ({
      service_name: item.service_name,
      fastest_seconds: item.fastest_seconds,
      average_seconds:
        item.completed_orders > 0
          ? Math.round(item.total_seconds / item.completed_orders)
          : 0,
      completed_orders: item.completed_orders,
    }));

    return NextResponse.json({
      success: true,
      deliveryTimes,
    });
  } catch (error) {
    console.error("SERVICE_DELIVERY_TIMES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to calculate service delivery times",
        deliveryTimes: [],
      },
      { status: 500 },
    );
  }
}

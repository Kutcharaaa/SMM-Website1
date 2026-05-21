import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type OrderRow = {
  id: string;
  user_id: string | null;
  status?: string | null;
  charge?: number | string | null;
  price?: number | string | null;
  amount?: number | string | null;
  customer_price?: number | string | null;
  total_price?: number | string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  reseller_level: string | null;
  total_spent: number | string | null;
};

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getOrderAmount(order: OrderRow) {
  return (
    toNumber(order.charge) ||
    toNumber(order.price) ||
    toNumber(order.customer_price) ||
    toNumber(order.total_price) ||
    toNumber(order.amount)
  );
}

function isCountableOrder(status: unknown) {
  const clean = String(status || "pending").toLowerCase();

  return ![
    "failed",
    "cancelled",
    "canceled",
    "rejected",
    "refunded",
    "refund",
  ].includes(clean);
}

async function loadAllOrders() {
  const allOrders: OrderRow[] = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
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

async function loadAllProfiles() {
  const allProfiles: ProfileRow[] = [];
  let from = 0;
  const size = 1000;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, reseller_level, total_spent")
      .range(from, from + size - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data || []) as ProfileRow[];
    allProfiles.push(...rows);

    if (rows.length < size) break;

    from += size;
  }

  return allProfiles;
}

export async function GET() {
  try {
    const [orders, profiles] = await Promise.all([
      loadAllOrders(),
      loadAllProfiles(),
    ]);

    const profileMap = new Map<string, ProfileRow>();

    for (const profile of profiles) {
      profileMap.set(profile.id, profile);
    }

    const spentMap = new Map<
      string,
      {
        total_spent: number;
        total_orders: number;
      }
    >();

    for (const order of orders) {
      if (!order.user_id) continue;
      if (!isCountableOrder(order.status)) continue;

      const amount = getOrderAmount(order);

      if (amount <= 0) continue;

      const current = spentMap.get(order.user_id) || {
        total_spent: 0,
        total_orders: 0,
      };

      current.total_spent += amount;
      current.total_orders += 1;

      spentMap.set(order.user_id, current);
    }

    // Also include users whose profiles.total_spent was manually updated,
    // even if no order rows were found.
    for (const profile of profiles) {
      const profileSpent = toNumber(profile.total_spent);

      if (profileSpent <= 0) continue;

      const current = spentMap.get(profile.id) || {
        total_spent: 0,
        total_orders: 0,
      };

      current.total_spent = Math.max(current.total_spent, profileSpent);

      spentMap.set(profile.id, current);
    }

    const rankings = Array.from(spentMap.entries())
      .map(([userId, stats]) => {
        const profile = profileMap.get(userId);

        return {
          id: userId,
          username: profile?.username || "User",
          reseller_level: profile?.reseller_level || "Reseller",
          total_spent: Number(stats.total_spent.toFixed(2)),
          total_orders: stats.total_orders,
        };
      })
      .filter((item) => item.total_spent > 0)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 50);

    return NextResponse.json({
      success: true,
      rankings,
    });
  } catch (error) {
    console.error("TOP_RESELLERS_API_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load top resellers.",
        rankings: [],
      },
      { status: 500 },
    );
  }
}
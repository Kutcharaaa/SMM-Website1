"use client";

import { supabase } from "@/lib/supabase";
import { Trophy, Crown, Gem, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  username: string | null;
  reseller_level: string | null;
  total_spent: number | null;
  total_orders: number;
};

function maskName(name: string) {
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 2) return part[0] + "***";
      return part.slice(0, 2) + "*".repeat(part.length - 2);
    })
    .join(" ");
}

function getLevelConfig(level: string) {
  if (level === "Elite Partner" || level === "Ascend Partner") {
    return {
      icon: Trophy,
      color: "from-[#0038ff] to-[#00c6ff]",
    };
  }

  if (level === "Premium Partner") {
    return {
      icon: Gem,
      color: "from-emerald-500 to-green-400",
    };
  }

  if (level === "Master Reseller") {
    return {
      icon: Crown,
      color: "from-amber-500 to-yellow-400",
    };
  }

  return {
    icon: ShieldCheck,
    color: "from-violet-500 to-purple-400",
  };
}

export default function TopResellers() {
  const [topResellers, setTopResellers] = useState<Reseller[]>([]);
  const [allRankings, setAllRankings] = useState<Reseller[]>([]);
  const [open, setOpen] = useState(false);

  async function getOrderCount(userId: string) {
    const { count, error } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (error) {
      console.log("Order count error:", error.message);
      return 0;
    }

    return count || 0;
  }

  async function loadTopResellers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, reseller_level, total_spent")
      .gt("total_spent", 0)
      .order("total_spent", { ascending: false })
      .limit(50);

    if (error) {
      console.log("Top resellers error:", error.message);
      setTopResellers([]);
      setAllRankings([]);
      return;
    }

    const rows = data || [];

    const rowsWithOrders: Reseller[] = await Promise.all(
      rows.map(async (reseller) => {
        const totalOrders = await getOrderCount(reseller.id);

        return {
          id: reseller.id,
          username: reseller.username,
          reseller_level: reseller.reseller_level,
          total_spent: reseller.total_spent,
          total_orders: totalOrders,
        };
      }),
    );

    setAllRankings(rowsWithOrders);
    setTopResellers(rowsWithOrders.slice(0, 3));
  }

  useEffect(() => {
    loadTopResellers();

    const interval = setInterval(() => {
      loadTopResellers();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  function ResellerRow({
    reseller,
    index,
    compact = false,
  }: {
    reseller: Reseller;
    index: number;
    compact?: boolean;
  }) {
    const level = reseller.reseller_level || "New Reseller";
    const config = getLevelConfig(level);
    const Icon = config.icon;

    return (
      <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className={`flex ${
              compact ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14"
            } shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r ${
              config.color
            } text-white shadow-lg`}
          >
            <Icon size={compact ? 21 : 26} />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xs font-black text-slate-400">
                #{index + 1}
              </span>

              <h4 className="min-w-0 truncate text-sm font-black text-slate-950">
                {maskName(reseller.username || "User")}
              </h4>
            </div>

            <p className="mt-1 truncate text-xs font-semibold text-slate-500">
              {level}
            </p>
          </div>
        </div>

        <div className="min-w-0 text-left sm:text-right">
          <h5 className="truncate text-sm font-black text-slate-950">
            ₱{Number(reseller.total_spent || 0).toLocaleString()}
          </h5>

          <p className="mt-1 truncate text-xs font-semibold text-slate-400">
            {Number(reseller.total_orders || 0).toLocaleString()}{" "}
            {Number(reseller.total_orders || 0) === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-[17px] font-black text-slate-950">
            Top Resellers
          </h3>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-xs font-black text-blue-600 hover:text-blue-700"
          >
            View Rankings
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {topResellers.length <= 0 ? (
            <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
              No reseller rankings yet.
            </div>
          ) : (
            topResellers.map((reseller, index) => (
              <ResellerRow
                key={reseller.id}
                reseller={reseller}
                index={index}
              />
            ))
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:items-center sm:p-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Top Reseller Rankings
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Top 50 resellers ranked by total spent.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
              {allRankings.length <= 0 ? (
                <div className="rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-500">
                  No reseller rankings yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {allRankings.map((reseller, index) => (
                    <ResellerRow
                      key={reseller.id}
                      reseller={reseller}
                      index={index}
                      compact
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
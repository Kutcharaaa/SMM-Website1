"use client";

import { supabase } from "@/lib/supabase";
import { Crown, Gem, ShieldCheck, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  username: string | null;
  reseller_level: string | null;
  total_spent: number | null;
  total_orders: number;
};

function maskName(name: string) {
  const cleanName = String(name || "User").trim();

  if (!cleanName) return "Us******";

  return cleanName
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      if (part.length === 1) return `${part[0]}*******`;
      return `${part.slice(0, 2)}******`;
    })
    .join(" ");
}

function formatPeso(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatOrders(value: number | string | null | undefined) {
  const count = Number(value || 0);

  return `${count.toLocaleString("en-PH")} ${count === 1 ? "order" : "orders"}`;
}

function getLevelConfig(level: string) {
  if (level === "Elite Partner" || level === "Ascend Partner") {
    return {
      icon: Trophy,
      color: "from-[#0038ff] to-[#00c6ff]",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    };
  }

  if (level === "Premium Partner") {
    return {
      icon: Gem,
      color: "from-emerald-500 to-green-400",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
    };
  }

  if (level === "Master Reseller") {
    return {
      icon: Crown,
      color: "from-amber-500 to-yellow-400",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50",
    };
  }

  return {
    icon: ShieldCheck,
    color: "from-violet-500 to-purple-400",
    textColor: "text-violet-600",
    bgColor: "bg-violet-50",
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
      <div
        className={`rounded-2xl border border-slate-100 bg-white transition hover:border-slate-200 hover:bg-slate-50 ${
          compact ? "p-4" : "p-4"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex ${
                compact ? "h-11 w-11" : "h-12 w-12"
              } shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r ${
                config.color
              } text-white shadow-lg`}
            >
              <Icon size={compact ? 20 : 22} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black text-slate-400">
                Top {index + 1}
              </p>

              <h4 className="mt-1 truncate text-sm font-black text-slate-950">
                {maskName(reseller.username || "User")}
              </h4>

              {compact && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${config.bgColor} ${config.textColor}`}
                >
                  {level}
                </span>
              )}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <h5 className="text-sm font-black text-slate-950">
              {formatPeso(reseller.total_spent)}
            </h5>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              {formatOrders(reseller.total_orders)}
            </p>
          </div>
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
            className="shrink-0 text-xs font-black text-blue-600 transition hover:text-blue-700"
          >
            View Rankings
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {topResellers.length <= 0 ? (
            <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm font-semibold text-slate-500">
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

                <p className="mt-1 text-sm font-semibold text-slate-500">
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
                <div className="rounded-2xl border border-slate-100 p-10 text-center text-sm font-semibold text-slate-500">
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

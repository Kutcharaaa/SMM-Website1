"use client";

import { supabase } from "@/lib/supabase";
import { Trophy, Crown, Gem, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  username: string | null;
  reseller_level: string | null;
  total_spent: number | null;
  total_orders?: number | null;
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

  async function loadTopResellers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, reseller_level, total_spent, total_orders")
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

    setAllRankings(rows);
    setTopResellers(rows.slice(0, 3));
  }

  useEffect(() => {
    loadTopResellers();
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
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50">
        <div className="flex items-center gap-4">
          <div
            className={`flex ${
              compact ? "h-11 w-11" : "h-14 w-14"
            } items-center justify-center rounded-2xl bg-gradient-to-r ${
              config.color
            } text-white shadow-lg`}
          >
            <Icon size={compact ? 21 : 26} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-400">
                #{index + 1}
              </span>

              <h4 className="text-sm font-black text-slate-950">
                {maskName(reseller.username || "User")}
              </h4>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              {level}
            </p>
          </div>
        </div>

        <div className="text-right">
          <h5 className="text-sm font-black text-slate-950">
            ₱{Number(reseller.total_spent || 0).toLocaleString()}
          </h5>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {Number(reseller.total_orders || 0).toLocaleString()} orders
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-black text-slate-950">
            Top Resellers
          </h3>

          <button
            onClick={() => setOpen(true)}
            className="text-xs font-black text-blue-600 hover:text-blue-700"
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
              <ResellerRow key={reseller.id} reseller={reseller} index={index} />
            ))
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Top Reseller Rankings
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Top 50 resellers ranked by total spent.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
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
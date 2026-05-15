"use client";

import { supabase } from "@/lib/supabase";
import {
  Trophy,
  Crown,
  Gem,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  username: string;
  reseller_level: string;
  total_spent: number;
  total_orders: number;
};

function maskName(name: string) {
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 2) {
        return part[0] + "***";
      }

      return (
        part.slice(0, 2) +
        "*".repeat(part.length - 2)
      );
    })
    .join(" ");
}

function getLevelConfig(level: string) {
  if (level === "Elite Partner") {
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
  const [topResellers, setTopResellers] = useState<
    Reseller[]
  >([]);

  async function loadTopResellers() {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, reseller_level, total_spent, total_orders"
      )
      .order("total_spent", {
        ascending: false,
      })
      .limit(3);

    setTopResellers(data || []);
  }

  useEffect(() => {
    loadTopResellers();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-black text-slate-950">
          Top Resellers
        </h3>

        <a
          href="/dashboard/reseller"
          className="text-xs font-black text-blue-600 hover:text-blue-700"
        >
          View Rankings
        </a>
      </div>

      <div className="mt-5 space-y-4">
        {topResellers.length <= 0 ? (
          <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
            No reseller rankings yet.
          </div>
        ) : (
          topResellers.map((reseller) => {
            const config = getLevelConfig(
              reseller.reseller_level
            );

            const Icon = config.icon;

            return (
              <div
                key={reseller.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${config.color} text-white shadow-lg`}
                  >
                    <Icon size={26} />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-950">
                      {maskName(
                        reseller.username || "User"
                      )}
                    </h4>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {reseller.reseller_level ||
                        "New Reseller"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <h5 className="text-sm font-black text-slate-950">
                    ₱
                    {Number(
                      reseller.total_spent || 0
                    ).toLocaleString()}
                  </h5>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {Number(
                      reseller.total_orders || 0
                    ).toLocaleString()}{" "}
                    orders
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
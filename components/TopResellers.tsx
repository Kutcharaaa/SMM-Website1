"use client";

import { ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

type Reseller = {
  id: string;
  username: string | null;
  reseller_level: string | null;
  avatar_url?: string | null;
  total_spent: number | null;
  total_orders: number;
};

function maskName(name: string) {
  const cleanName = String(name || "User").trim();

  if (cleanName.length <= 2) {
    return `${cleanName.charAt(0) || "U"}***`;
  }

  return `${cleanName.slice(0, 2)}${"*".repeat(
    Math.min(cleanName.length - 2, 6),
  )}`;
}

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ResellerAvatar({
  reseller,
  index,
}: {
  reseller: Reseller;
  index: number;
}) {
  const fallback = maskName(reseller.username || "User")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 text-white">
      {reseller.avatar_url ? (
        <img
          src={reseller.avatar_url}
          alt={reseller.username || "User"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-black">
          {fallback || <ShieldCheck size={16} />}
        </div>
      )}

      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[9px] font-black text-white ring-2 ring-white">
        {index + 1}
      </div>
    </div>
  );
}

function ResellerRow({
  reseller,
  index,
  compact,
}: {
  reseller: Reseller;
  index: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white ${
        compact ? "px-3 py-2.5" : "px-3 py-2"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ResellerAvatar reseller={reseller} index={index} />

        <div className="min-w-0">
          <p className="text-[11px] font-black text-slate-400">
            Top {index + 1}
          </p>

          <p className="mt-0.5 truncate text-sm font-black text-slate-950">
            {maskName(reseller.username || "User")}
          </p>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-black text-slate-950">
          {formatMoney(reseller.total_spent)}
        </p>

        <p className="mt-0.5 text-[11px] font-bold text-slate-400">
          {Number(reseller.total_orders || 0).toLocaleString("en-PH")}{" "}
          {Number(reseller.total_orders || 0) === 1 ? "order" : "orders"}
        </p>
      </div>
    </div>
  );
}

export default function TopResellers() {
  const [topResellers, setTopResellers] = useState<Reseller[]>([]);
  const [allRankings, setAllRankings] = useState<Reseller[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadTopResellers() {
    try {
      const response = await fetch("/api/dashboard/top-resellers", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setTopResellers([]);
        setAllRankings([]);
        setLoading(false);
        return;
      }

      const rows = (result.rankings || []) as Reseller[];

      setAllRankings(rows);
      setTopResellers(rows.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error("TOP_RESELLERS_LOAD_ERROR:", error);
      setTopResellers([]);
      setAllRankings([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopResellers();

    const interval = setInterval(() => {
      loadTopResellers();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

        <div className="mt-3 space-y-2">
          {loading ? (
            <div className="rounded-xl border border-slate-100 p-5 text-center text-sm font-semibold text-slate-500">
              Loading top resellers...
            </div>
          ) : topResellers.length <= 0 ? (
            <div className="rounded-xl border border-slate-100 p-5 text-center text-sm text-slate-500">
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
                  Top 50 resellers ranked by real order spending.
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
                <div className="space-y-2">
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
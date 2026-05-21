"use client";

import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type HighlightedService = {
  id: string;
  name: string;
  price_per_1000: number;
  provider_service_id?: string | null;
  highlight_badge?: string | null;
  highlight_sort?: number | null;
};

function formatAmount(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getServiceId(service: HighlightedService) {
  return service.provider_service_id || service.id.slice(0, 8);
}

function getBadgeClass(badge?: string | null) {
  const clean = String(badge || "").toLowerCase();

  if (clean.includes("cheap")) return "bg-green-600 text-white";
  if (clean.includes("fast")) return "bg-blue-600 text-white";
  if (clean.includes("refill")) return "bg-purple-600 text-white";
  if (clean.includes("quality")) return "bg-orange-500 text-white";
  if (clean.includes("hot")) return "bg-red-500 text-white";

  return "bg-slate-900 text-white";
}

export default function HighlightedServicesTicker() {
  const [services, setServices] = useState<HighlightedService[]>([]);
  const [visible, setVisible] = useState(true);

  async function loadHighlightedServices() {
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, name, price_per_1000, provider_service_id, highlight_badge, highlight_sort",
      )
      .eq("is_highlighted", true)
      .order("highlight_sort", { ascending: true })
      .limit(20);

    if (error) {
      console.error("Highlighted services error:", error.message);
      setServices([]);
      return;
    }

    setServices((data || []) as HighlightedService[]);
  }

  useEffect(() => {
    loadHighlightedServices();

    const interval = setInterval(() => {
      loadHighlightedServices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let showTimer: ReturnType<typeof setTimeout>;

    function startCycle() {
      setVisible(true);

      hideTimer = setTimeout(() => {
        setVisible(false);

        showTimer = setTimeout(() => {
          startCycle();
        }, 3 * 60 * 1000); // hidden for 3 minutes
      }, 2 * 60 * 1000); // visible for 2 minutes
    }

    startCycle();

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }, []);

  if (!visible || services.length <= 0) return null;

  const tickerItems = [...services, ...services];

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-purple-50 shadow-sm">
      <div className="flex items-center gap-3 border-b border-blue-100/70 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Sparkles size={18} />
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-950">
            Highlight Services
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Recommended services selected by admin
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden py-3">
        <div className="highlight-ticker-track flex w-max items-center gap-3">
          {tickerItems.map((service, index) => (
            <div
              key={`${service.id}-${index}`}
              className="flex min-w-max items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                ID {getServiceId(service)}
              </span>

              <span className="max-w-[420px] truncate text-sm font-black text-slate-950">
                {service.name}
              </span>

              <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-black text-green-600">
                {formatAmount(service.price_per_1000)} / 1K
              </span>

              {service.highlight_badge && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getBadgeClass(
                    service.highlight_badge,
                  )}`}
                >
                  {service.highlight_badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .highlight-ticker-track {
          animation: highlight-scroll 45s linear infinite;
        }

        .highlight-ticker-track:hover {
          animation-play-state: paused;
        }

        @keyframes highlight-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
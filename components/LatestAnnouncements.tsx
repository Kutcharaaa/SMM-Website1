"use client";

import { supabase } from "@/lib/supabase";
import {
  Bell,
  Gift,
  Info,
  Percent,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PromoConfig = {
  minAmount?: number;
  bonusPercent?: number;
  discountPercent?: number;
  platform?: string;
  serviceId?: string;
  minQuantity?: number;
  minSpend?: number;
  target?: "first_order" | "first_add_funds";
  requiredLevel?: string;
  code?: string;
  usageLimit?: number;
};

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
  image_url?: string | null;
  show_popup?: boolean | null;
  promo_enabled?: boolean | null;
  promo_type?: string | null;
  promo_config?: PromoConfig | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

function getAnnouncementStyle(type: string) {
  if (type === "maintenance") {
    return {
      icon: Settings,
      color: "bg-orange-50 text-orange-500",
    };
  }

  if (type === "feature") {
    return {
      icon: Sparkles,
      color: "bg-purple-50 text-purple-600",
    };
  }

  if (type === "promotion") {
    return {
      icon: Percent,
      color: "bg-green-50 text-green-600",
    };
  }

  if (type === "info") {
    return {
      icon: Info,
      color: "bg-blue-50 text-blue-600",
    };
  }

  return {
    icon: Bell,
    color: "bg-green-50 text-green-600",
  };
}

function isAnnouncementActive(announcement: Announcement) {
  if (announcement.status !== "published") return false;

  const now = Date.now();

  if (announcement.starts_at) {
    const startTime = new Date(announcement.starts_at).getTime();

    if (Number.isFinite(startTime) && now < startTime) {
      return false;
    }
  }

  if (announcement.ends_at) {
    const endTime = new Date(announcement.ends_at).getTime();

    if (Number.isFinite(endTime) && now > endTime) {
      return false;
    }
  }

  return true;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getPromoSummary(announcement: Announcement) {
  if (!announcement.promo_enabled || !announcement.promo_type) return "";

  const config = announcement.promo_config || {};

  if (announcement.promo_type === "add_funds_bonus") {
    return `+${toNumber(config.bonusPercent)}% bonus on every ${formatMoney(
      config.minAmount || 0,
    )} Add Funds`;
  }

  if (announcement.promo_type === "platform_discount") {
    return `${toNumber(config.discountPercent)}% off all ${
      config.platform || "selected"
    } services`;
  }

  if (announcement.promo_type === "service_discount") {
    return `${toNumber(config.discountPercent)}% off Service ID ${
      config.serviceId || "—"
    }`;
  }

  if (announcement.promo_type === "bulk_quantity_discount") {
    const platform =
      config.platform && config.platform !== "all"
        ? ` on ${config.platform} services`
        : "";

    return `${toNumber(config.discountPercent)}% off ${toNumber(
      config.minQuantity,
    ).toLocaleString("en-PH")}+ quantity orders${platform}`;
  }

  if (announcement.promo_type === "minimum_spend_discount") {
    return `${toNumber(config.discountPercent)}% off orders worth at least ${formatMoney(
      config.minSpend || 0,
    )}`;
  }

  if (announcement.promo_type === "new_user_promo") {
    return `${toNumber(config.discountPercent)}% off ${
      config.target === "first_add_funds" ? "first Add Funds" : "first order"
    }`;
  }

  if (announcement.promo_type === "reseller_only_promo") {
    return `${toNumber(config.discountPercent)}% off for ${
      config.requiredLevel || "selected reseller level"
    }`;
  }

  if (announcement.promo_type === "promo_code") {
    return `Use code ${String(config.code || "PROMO").toUpperCase()} for ${toNumber(
      config.discountPercent,
    )}% off`;
  }

  return "Promo active";
}

export default function LatestAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [popupAnnouncement, setPopupAnnouncement] =
    useState<Announcement | null>(null);

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("LATEST_ANNOUNCEMENTS_ERROR:", error.message);
      setAllAnnouncements([]);
      setAnnouncements([]);
      return;
    }

    const activeItems = ((data || []) as Announcement[]).filter(
      isAnnouncementActive,
    );

    setAllAnnouncements(activeItems);
    setAnnouncements(activeItems.slice(0, 3));

    const nextPopup = activeItems.find(
      (item) => item.show_popup && item.image_url,
    );

    if (!nextPopup) return;

    const seenKey = `seen_announcement_popup_${nextPopup.id}`;

    try {
      const alreadySeen = window.localStorage.getItem(seenKey);

      if (!alreadySeen) {
        setPopupAnnouncement(nextPopup);
      }
    } catch {
      setPopupAnnouncement(nextPopup);
    }
  }

  useEffect(() => {
    loadAnnouncements();

    const interval = setInterval(loadAnnouncements, 10000);

    return () => clearInterval(interval);
  }, []);

  function closePopup() {
    if (popupAnnouncement) {
      try {
        window.localStorage.setItem(
          `seen_announcement_popup_${popupAnnouncement.id}`,
          "true",
        );
      } catch {
        // localStorage can fail in private mode. Closing should still work.
      }
    }

    setPopupAnnouncement(null);
  }

  function AnnouncementItem({
    announcement,
  }: {
    announcement: Announcement;
  }) {
    const config = getAnnouncementStyle(announcement.type);
    const Icon = config.icon;
    const promoSummary = getPromoSummary(announcement);

    return (
      <div className="flex min-w-0 gap-3 rounded-2xl p-2 transition hover:bg-slate-50 sm:gap-4">
        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="mt-1 h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
          />
        ) : (
          <div
            className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
          >
            <Icon size={18} strokeWidth={2.4} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-black text-slate-900">
            {announcement.title}
          </h4>

          {announcement.description && (
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">
              {announcement.description}
            </p>
          )}

          {promoSummary && (
            <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-black text-green-700 ring-1 ring-green-100">
              <Gift size={12} />
              <span className="truncate">{promoSummary}</span>
            </div>
          )}

          <p className="mt-1 text-xs font-medium text-slate-400">
            {new Date(announcement.created_at).toLocaleDateString("en-PH")}
          </p>
        </div>
      </div>
    );
  }

  const popupPromoSummary = useMemo(() => {
    if (!popupAnnouncement) return "";
    return getPromoSummary(popupAnnouncement);
  }, [popupAnnouncement]);

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate text-[17px] font-black text-slate-950">
            Latest Announcements
          </h3>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-xs font-black text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {announcements.length <= 0 ? (
            <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
              No announcements yet.
            </div>
          ) : (
            announcements.map((announcement) => (
              <AnnouncementItem
                key={announcement.id}
                announcement={announcement}
              />
            ))
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:items-center sm:p-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                  All Announcements
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest platform updates and important notices.
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

            <div className="min-h-0 overflow-y-auto p-5">
              {allAnnouncements.length <= 0 ? (
                <div className="rounded-2xl border border-slate-100 p-10 text-center text-sm text-slate-500">
                  No announcements found.
                </div>
              ) : (
                <div className="space-y-3">
                  {allAnnouncements.map((announcement) => (
                    <AnnouncementItem
                      key={announcement.id}
                      announcement={announcement}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {popupAnnouncement && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4">
          <div className="my-4 w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="relative">
              {popupAnnouncement.image_url && (
                <img
                  src={popupAnnouncement.image_url}
                  alt={popupAnnouncement.title}
                  className="max-h-[70vh] w-full object-cover"
                />
              )}

              <button
                type="button"
                onClick={closePopup}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                  <MegaphoneIcon announcementType={popupAnnouncement.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-xl font-black text-slate-950 sm:text-2xl">
                    {popupAnnouncement.title}
                  </h3>

                  {popupAnnouncement.description && (
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {popupAnnouncement.description}
                    </p>
                  )}
                </div>
              </div>

              {popupPromoSummary && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-green-700">
                    <Gift size={17} />
                    Active Promo
                  </div>

                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {popupPromoSummary}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={closePopup}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MegaphoneIcon({ announcementType }: { announcementType: string }) {
  const config = getAnnouncementStyle(announcementType);
  const Icon = config.icon;

  return <Icon size={20} strokeWidth={2.4} />;
}

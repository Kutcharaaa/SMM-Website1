"use client";

import { supabase } from "@/lib/supabase";

import { Bell, Info, Percent, Settings, Sparkles, X } from "lucide-react";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
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

export default function LatestAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "published")
      .order("created_at", {
        ascending: false,
      });

    const items = data || [];

    setAllAnnouncements(items);
    setAnnouncements(items.slice(0, 3));
  }

  useEffect(() => {
    loadAnnouncements();

    const interval = setInterval(loadAnnouncements, 10000);

    return () => clearInterval(interval);
  }, []);

  function AnnouncementItem({
    announcement,
  }: {
    announcement: Announcement;
  }) {
    const config = getAnnouncementStyle(announcement.type);
    const Icon = config.icon;

    return (
      <div className="flex min-w-0 gap-3 rounded-2xl p-2 transition hover:bg-slate-50 sm:gap-4">
        <div
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
        >
          <Icon size={18} strokeWidth={2.4} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-black text-slate-900">
            {announcement.title}
          </h4>

          {announcement.description && (
            <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-500">
              {announcement.description}
            </p>
          )}

          <p className="mt-1 text-xs font-medium text-slate-400">
            {new Date(announcement.created_at).toLocaleDateString()}
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
                  No announcements yet.
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
    </>
  );
}
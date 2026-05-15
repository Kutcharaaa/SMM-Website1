"use client";

import { supabase } from "@/lib/supabase";

import {
  Bell,
  Info,
  Percent,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

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
      <div className="flex gap-4 rounded-2xl p-2 transition hover:bg-slate-50">
        <div
          className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
        >
          <Icon size={18} strokeWidth={2.4} />
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-900">
            {announcement.title}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            {announcement.description}
          </p>

          <p className="mt-1 text-xs font-medium text-slate-400">
            {new Date(announcement.created_at).toLocaleDateString()}
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
            Latest Announcements
          </h3>

          <button
            onClick={() => setOpen(true)}
            className="text-xs font-black text-blue-600 hover:text-blue-700"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  All Announcements
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Latest platform updates and important notices.
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
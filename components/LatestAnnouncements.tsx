"use client";

import { supabase } from "@/lib/supabase";

import {
  Bell,
  Settings,
  Sparkles,
} from "lucide-react";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  description: string;
  type: string;
  created_at: string;
};

function getAnnouncementStyle(type: string) {
  if (type === "update") {
    return {
      icon: Settings,
      color: "bg-slate-100 text-slate-700",
    };
  }

  if (type === "feature") {
    return {
      icon: Sparkles,
      color: "bg-purple-50 text-purple-600",
    };
  }

  return {
    icon: Bell,
    color: "bg-blue-50 text-blue-600",
  };
}

export default function LatestAnnouncements() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", {
        ascending: false,
      })
      .limit(3);

    setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-black text-slate-950">
          Latest Announcements
        </h3>

        <a
          href="/dashboard/announcements"
          className="text-xs font-black text-blue-600 hover:text-blue-700"
        >
          View All
        </a>
      </div>

      <div className="mt-5 space-y-5">
        {announcements.length <= 0 ? (
          <div className="rounded-2xl border border-slate-100 p-6 text-center text-sm text-slate-500">
            No announcements yet.
          </div>
        ) : (
          announcements.map((announcement) => {
            const config =
              getAnnouncementStyle(
                announcement.type
              );

            const Icon = config.icon;

            return (
              <div
                key={announcement.id}
                className="flex gap-4"
              >
                <div
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
                >
                  <Icon
                    size={18}
                    strokeWidth={2.4}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {announcement.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    {announcement.description}
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {new Date(
                      announcement.created_at
                    ).toLocaleDateString()}
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
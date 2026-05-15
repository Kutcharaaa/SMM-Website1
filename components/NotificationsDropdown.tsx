"use client";

import { supabase } from "@/lib/supabase";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadNotifications() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setNotifications(data || []);
  }

  async function markAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadIds.length <= 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) return;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
      }))
    );
  }

  async function toggleDropdown() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await markAsRead();
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
      >
        <Bell size={22} strokeWidth={2} />

        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-4 w-[22rem] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-black text-slate-900">
              Notifications
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Latest account updates
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-b border-slate-100 p-5 transition hover:bg-slate-50"
                >
                  <p className="font-bold text-slate-900">
                    {notification.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function AdminNotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function loadNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or("user_id.is.null,type.in.(new_deposit,deposit_followup,new_order,new_ticket,provider_low_balance)")
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

    const interval = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative text-xl hover:text-zinc-400 transition"
      >
        🔔

        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-4 w-96 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="font-bold text-white">Admin Notifications</h3>
            <p className="text-xs text-zinc-500">
              Deposits, orders, tickets, follow-ups, and provider alerts
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-zinc-500">
                No admin notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-zinc-900 hover:bg-zinc-900/70"
                >
                  <p className="font-semibold text-white">
                    {notification.title}
                  </p>

                  <p className="text-sm text-zinc-400 mt-1">
                    {notification.message}
                  </p>

                  <p className="text-xs text-zinc-600 mt-2">
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
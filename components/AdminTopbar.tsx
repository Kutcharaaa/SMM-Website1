"use client";

import UserProfile from "@/components/UserProfile";
import AdminNotificationsDropdown from "@/components/AdminNotificationsDropdown";

export default function AdminTopbar() {
  return (
    <header className="min-h-24 border-b border-zinc-900 bg-black/40 backdrop-blur-2xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 lg:px-8 py-5">
      <div>
        <h1 className="text-2xl lg:text-3xl font-black text-white">
          Admin Panel
        </h1>

        <p className="text-sm text-zinc-500 mt-1 max-w-xl">
          Manage users, providers, services, payments, orders, and platform
          activity.
        </p>
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-6 text-white">
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500 hover:text-blue-400 transition">
            📊
          </button>

          <button className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500 hover:text-blue-400 transition">
            ⚡
          </button>

          <AdminNotificationsDropdown />
        </div>

        <UserProfile />
      </div>
    </header>
  );
}
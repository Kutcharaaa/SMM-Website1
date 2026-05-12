"use client";

import UserProfile from "@/components/UserProfile";
import AdminNotificationsDropdown from "@/components/AdminNotificationsDropdown";

export default function AdminTopbar() {
  return (
    <header className="h-24 border-b border-zinc-900 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          Admin Panel
        </h1>

        <p className="text-sm text-zinc-500 mt-1">
          Manage users, providers, services and platform activity
        </p>
      </div>

      <div className="flex items-center gap-6 text-white">
        <AdminNotificationsDropdown />

        <UserProfile />
      </div>
    </header>
  );
}
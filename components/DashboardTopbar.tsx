"use client";

import UserProfile from "@/components/UserProfile";
import NotificationsDropdown from "@/components/NotificationsDropdown";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header className="min-h-24 border-b border-zinc-900 bg-black/40 backdrop-blur-2xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-4 lg:px-8 py-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden h-11 w-11 rounded-xl border border-zinc-800 bg-zinc-950 text-white hover:border-blue-500 hover:text-blue-400 transition"
        >
          ☰
        </button>

        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white">
            Dashboard
          </h1>

          <p className="text-sm text-zinc-500 mt-1">
            Welcome back to Ascend Service
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-6 text-white">
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500 hover:text-blue-400 transition">
            🌐
          </button>

          <button className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500 hover:text-blue-400 transition">
            $
          </button>

          <button className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-blue-500 hover:text-blue-400 transition">
            ☾
          </button>

          <NotificationsDropdown />
        </div>

        <UserProfile />
      </div>
    </header>
  );
}
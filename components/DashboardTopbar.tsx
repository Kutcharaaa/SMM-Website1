"use client";

import UserProfile from "@/components/UserProfile";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { Menu, Search, Globe, DollarSign, Moon } from "lucide-react";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header className="min-h-24 border-b border-slate-200 bg-white/80 backdrop-blur-2xl flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between px-4 lg:px-8 py-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-950">
            Dashboard
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Welcome back to Ascend Service
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:justify-end">
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            placeholder="Search orders, services..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-between gap-3 text-slate-700">
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-400 hover:text-blue-600">
            <Globe size={18} />
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-400 hover:text-blue-600">
            <DollarSign size={18} />
          </button>

          <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-400 hover:text-blue-600">
            <Moon size={18} />
          </button>

          <NotificationsDropdown />

          <UserProfile />
        </div>
      </div>
    </header>
  );
}
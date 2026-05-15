"use client";

import UserProfile from "@/components/UserProfile";
import NotificationsDropdown from "@/components/NotificationsDropdown";

import {
  Menu,
  Search,
  Globe,
  DollarSign,
  Moon,
} from "lucide-react";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-4 py-5 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div>
            <h1 className="text-[30px] font-black leading-none text-slate-950">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Welcome back to Ascend Service
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:w-[340px]">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search orders, services..."
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600">
              <Globe size={18} />
            </button>

            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600">
              <DollarSign size={18} />
            </button>

            <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600">
              <Moon size={18} />
            </button>

            <div className="h-11 w-px bg-slate-200" />

            <NotificationsDropdown />

            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
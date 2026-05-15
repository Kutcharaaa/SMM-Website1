"use client";

import UserProfile from "@/components/UserProfile";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { Menu, Sun, Moon } from "lucide-react";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header className="border-b border-slate-200/70 bg-[#f8fbff]">
      <div className="flex min-h-24 items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
          >
            <Menu size={22} />
          </button>

          <button className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:flex">
            <Menu size={22} />
          </button>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Welcome back,
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-lg font-black text-slate-950">
                Juan Dela Cruz
              </h1>

              <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                Pro Reseller
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-500">
              Wallet Balance
            </p>

            <p className="mt-1 text-xl font-black text-blue-600">
              ₱2,450.00
            </p>
          </div>

          <NotificationsDropdown />

          <UserProfile />

          <div className="hidden items-center gap-1 rounded-full bg-blue-50 p-1 md:flex">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-amber-500 shadow-sm">
              <Sun size={16} />
            </button>

            <button className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
              <Moon size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
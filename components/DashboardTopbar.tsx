"use client";

import NotificationsDropdown from "@/components/NotificationsDropdown";
import UserProfile from "@/components/UserProfile";
import { Menu } from "lucide-react";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  return (
    <header className="h-24 border-b border-slate-200 bg-[#f8fbff]">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-5">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Menu size={24} strokeWidth={2} />
          </button>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Welcome back,
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-950">
                Juan Dela Cruz
              </h1>

              <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                Pro Reseller
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-500">
              Wallet Balance
            </p>

            <p className="mt-1 text-2xl font-black text-blue-600">
              ₱2,450.00
            </p>
          </div>

          <NotificationsDropdown />

          <UserProfile />
        </div>
      </div>
    </header>
  );
}
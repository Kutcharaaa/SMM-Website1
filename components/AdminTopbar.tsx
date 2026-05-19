"use client";

import { supabase } from "@/lib/supabase";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

type AdminProfile = {
  id: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
  role?: string | null;
  avatar_url?: string | null;
};

type AdminTopbarProps = {
  onMenuClick?: () => void;
};

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    loadAdminTopbarData();
  }, []);

  async function loadAdminTopbarData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username, firstname, lastname, email, role, avatar_url")
      .eq("id", user.id)
      .single();

    setProfile((profileData || null) as AdminProfile | null);

    const { count: pendingPayments } = await supabase
      .from("deposits")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: activeOrders } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "processing", "partial"]);

    const { count: openTickets } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    setNotificationCount(
      Number(pendingPayments || 0) +
        Number(activeOrders || 0) +
        Number(openTickets || 0),
    );
  }

  function getDisplayName() {
    if (profile?.username) return profile.username;

    const fullName = `${profile?.firstname || ""} ${
      profile?.lastname || ""
    }`.trim();

    return fullName || "Admin User";
  }

  function getRoleLabel() {
    if (profile?.role === "super_admin") return "Super Admin";
    if (profile?.role === "head_admin") return "Head Admin";
    return "Admin";
  }

  function getInitial() {
    return getDisplayName().charAt(0).toUpperCase();
  }

  const today = new Date().toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center justify-between gap-3 px-4 py-3 sm:min-h-[88px] sm:gap-5 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open admin sidebar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-green-300 hover:text-green-700 lg:hidden"
          >
            <Menu size={21} />
          </button>

          <button
            type="button"
            aria-label="Admin menu"
            className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:flex"
          >
            <Menu size={21} />
          </button>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 truncate text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
                Admin Dashboard
              </h1>

              <span className="hidden shrink-0 items-center rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 sm:inline-flex">
                <ShieldCheck size={13} />
                <span className="ml-1">{getRoleLabel()}</span>
              </span>
            </div>

            <p className="mt-1 max-w-[190px] truncate text-xs font-semibold text-slate-500 sm:max-w-none sm:text-sm">
              Welcome back, {getDisplayName()} 👋
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-8 xl:flex">
          <div className="flex h-12 w-full max-w-[460px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-green-300 focus-within:ring-4 focus-within:ring-green-50">
            <Search size={20} className="shrink-0 text-slate-400" />

            <input
              placeholder="Search anything..."
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />

            <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-400">
              Ctrl /
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-green-300 hover:text-green-700 sm:h-12 sm:w-12"
          >
            <Bell size={21} />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-green-600 px-1 text-[11px] font-black text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={getDisplayName()}
                className="h-10 w-10 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-sm font-black text-green-700">
                {getInitial()}
              </div>
            )}

            <div className="min-w-0">
              <p className="max-w-[130px] truncate text-sm font-black text-slate-950">
                {getDisplayName()}
              </p>

              <p className="text-xs font-semibold text-slate-500">
                {getRoleLabel()}
              </p>
            </div>

            <ChevronDown size={16} className="shrink-0 text-slate-400" />
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm lg:flex">
            <CalendarDays size={17} className="shrink-0 text-slate-400" />
            {today}
          </div>
        </div>
      </div>
    </header>
  );
}
"use client";

import AdminSidebar from "@/components/AdminSidebar";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    loadAdminTopbarData();

    const syncSidebarState = () => {
      setSidebarMinimized(
        localStorage.getItem("admin_sidebar_minimized") === "true",
      );
    };

    syncSidebarState();

    const interval = setInterval(() => {
      syncSidebarState();
    }, 300);

    return () => clearInterval(interval);
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
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <AdminSidebar />

      <section
        className={`min-h-screen transition-all duration-300 ${
          sidebarMinimized ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[88px] items-center justify-between gap-5 px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm lg:flex">
                <Menu size={21} />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-950">
                    Admin Dashboard
                  </h1>

                  <span className="hidden rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 sm:inline-flex">
                    <ShieldCheck size={13} />
                    <span className="ml-1">{getRoleLabel()}</span>
                  </span>
                </div>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Welcome back, {getDisplayName()} 👋
                </p>
              </div>
            </div>

            <div className="hidden flex-1 justify-center px-8 xl:flex">
              <div className="flex h-12 w-full max-w-[460px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-green-300 focus-within:ring-4 focus-within:ring-green-50">
                <Search size={20} className="text-slate-400" />

                <input
                  placeholder="Search anything..."
                  className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />

                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-400">
                  Ctrl /
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-green-300 hover:text-green-700">
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
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-sm font-black text-green-700">
                    {getInitial()}
                  </div>
                )}

                <div className="min-w-[120px]">
                  <p className="truncate text-sm font-black text-slate-950">
                    {getDisplayName()}
                  </p>

                  <p className="text-xs font-semibold text-slate-400">
                    {getRoleLabel()}
                  </p>
                </div>

                <ChevronDown size={17} className="text-slate-400" />
              </div>

              <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm 2xl:flex">
                <span>{today}</span>
                <CalendarDays size={18} className="text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </section>
    </main>
  );
}
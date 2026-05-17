"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import UserProfile from "@/components/UserProfile";
import AdminNotificationsDropdown from "@/components/AdminNotificationsDropdown";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Admin Dashboard",
    subtitle: "Welcome back, Kutchara 👋",
  },
  "/admin/dashboard": {
    title: "Admin Dashboard",
    subtitle: "Welcome back, Kutchara 👋",
  },
  "/admin/analytics": {
    title: "Analytics / Reports",
    subtitle: "Accounting overview for revenue, profit, expenses, and reports.",
  },
  "/admin/orders": {
    title: "Orders",
    subtitle: "Manage and monitor customer orders.",
  },
  "/admin/new-order-monitor": {
    title: "New Order Monitor",
    subtitle: "Track new and active order activity.",
  },
  "/admin/order-refunds": {
    title: "Order Refunds",
    subtitle: "Review and manage order refund requests.",
  },
  "/admin/payment-methods": {
    title: "Payment Methods",
    subtitle: "Manage available add fund payment methods.",
  },
  "/admin/cash-accounts": {
    title: "Cash Accounts",
    subtitle: "Track business cash accounts and balances.",
  },
  "/admin/services": {
    title: "Services",
    subtitle: "Manage panel services and provider pricing.",
  },
  "/admin/users": {
    title: "Users",
    subtitle: "Manage users, roles, and account details.",
  },
  "/admin/tickets": {
    title: "Tickets",
    subtitle: "Manage customer support tickets.",
  },
  "/admin/settings": {
    title: "Settings",
    subtitle: "Manage platform configuration and system options.",
  },
};

export default function AdminTopbar() {
  const pathname = usePathname();

  const page = useMemo(() => {
    return (
      pageTitles[pathname] || {
        title: "Admin Dashboard",
        subtitle:
          "Manage users, providers, services, payments, orders, and platform activity.",
      }
    );
  }, [pathname]);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="flex min-h-[78px] items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-950 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                {page.title}
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck size={13} />
                Super Admin
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
              {page.subtitle}
            </p>
          </div>
        </div>

        <div className="hidden flex-1 justify-center px-6 xl:flex">
          <div className="flex h-11 w-full max-w-[560px] items-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full w-12 items-center justify-center text-slate-400">
              <Search size={18} />
            </div>

            <input
              type="text"
              placeholder="Search anything..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />

            <div className="mr-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-400">
              Ctrl /
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block">
            <AdminNotificationsDropdown />
          </div>

          <div className="hidden min-w-[210px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm lg:flex">
            <UserProfile />

            <ChevronDown size={16} className="text-slate-400" />
          </div>

          <div className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-800 shadow-sm lg:flex">
            <span>{today}</span>
            <CalendarDays size={17} className="text-slate-400" />
          </div>

          <div className="lg:hidden">
            <UserProfile />
          </div>
        </div>
      </div>
    </header>
  );
}
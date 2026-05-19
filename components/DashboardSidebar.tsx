"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import WalletBalance from "@/components/WalletBalance";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  PlusCircle,
  ShoppingCart,
  Layers3,
  Wallet,
  Ticket,
  Star,
  Users,
  Code2,
  Settings,
  LogOut,
  X,
  AlertTriangle,
  Receipt,
} from "lucide-react";

import { useEffect, useState } from "react";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Services",
    href: "/dashboard/services",
    icon: Layers3,
  },
  {
    name: "Add Funds",
    href: "/dashboard/add-funds",
    icon: Wallet,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: Receipt,
  },
  {
    name: "Tickets",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
  {
    name: "Reseller",
    href: "/dashboard/reseller",
    icon: Star,
    badge: "",
  },
  {
    name: "Affiliates",
    href: "/dashboard/affiliates",
    icon: Users,
  },
  {
    name: "API",
    href: "/dashboard/api",
    icon: Code2,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

type DashboardSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function DashboardSidebar({
  mobileOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    await supabase.auth.signOut();

    setLogoutModalOpen(false);
    setLoggingOut(false);

    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-dvh w-[260px] max-w-[85vw] flex-col border-r border-blue-200 bg-gradient-to-b from-[#0d3d9b] via-[#0a2d75] to-[#071a45] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ease-in-out lg:h-screen lg:max-w-none lg:shadow-none ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 pb-5 pt-7">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" onClick={onClose} className="min-w-0">
              <img
                src="/logo.png"
                alt="Ascend Service"
                className="h-12 w-auto max-w-[180px]"
              />
            </Link>

            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-white/10 p-2 transition hover:bg-white/20 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav
          className="
            flex-1 overflow-y-auto px-4 pb-2
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-white/20
          "
        >
          <div className="space-y-1">
            {menu.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-[#1f6bff] text-white shadow-lg shadow-blue-900/30"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon size={18} strokeWidth={2.2} className="shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="ml-2 shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setLogoutModalOpen(true);
                onClose?.();
              }}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <div className="flex min-w-0 items-center gap-3">
                <LogOut size={18} strokeWidth={2.2} className="shrink-0" />
                <span className="truncate">Logout</span>
              </div>
            </button>
          </div>
        </nav>

        <div className="p-4">
          <div className="rounded-3xl bg-white/10 p-5 shadow-lg shadow-blue-950/20 backdrop-blur-xl">
            <p className="text-xs font-medium text-blue-100/80">
              Available Balance
            </p>

            <div className="mt-3">
              <WalletBalance compact />
            </div>

            <Link
              href="/dashboard/add-funds"
              onClick={onClose}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[#1f6bff] py-3 text-sm font-bold transition hover:bg-blue-500"
            >
              Add Funds
            </Link>
          </div>
        </div>
      </aside>

      {logoutModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={24} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950">
                    Confirm Logout
                  </h3>

                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    Are you sure you want to logout from your Ascend Service
                    account?
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(false)}
                  disabled={loggingOut}
                  className="w-full rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loggingOut ? "Logging out..." : "Yes, Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
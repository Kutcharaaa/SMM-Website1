"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletBalance from "@/components/WalletBalance";

import {
  LayoutDashboard,
  PlusCircle,
  ShoppingCart,
  Layers3,
  Wallet,
  Receipt,
  Ticket,
  Star,
  Users,
  Code2,
  Settings,
  LogOut,
  X,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "New Order",
    href: "/dashboard/new-order",
    icon: PlusCircle,
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
    badge: "NEW",
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
  {
    name: "Logout",
    href: "/logout",
    icon: LogOut,
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

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-blue-200 bg-gradient-to-b from-[#0d3d9b] via-[#0a2d75] to-[#071a45] text-white transition-transform duration-300 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-6 pb-5 pt-7">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" onClick={onClose}>
              <img
                src="/logo.png"
                alt="Ascend Service"
                className="h-12 w-auto"
              />
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <nav
          className="
            flex-1 overflow-y-auto px-4
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
                  <div className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={2.2} />

                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-4">
          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-xl shadow-lg shadow-blue-950/20">
            <p className="text-xs font-medium text-blue-100/80">
              Available Balance
            </p>

            <div className="mt-3">
              <WalletBalance />
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
    </>
  );
}
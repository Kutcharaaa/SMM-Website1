"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletBalance from "@/components/WalletBalance";
import {
  LayoutDashboard,
  PlusCircle,
  ShoppingBag,
  Wallet,
  ListChecks,
  LifeBuoy,
  Star,
  Code2,
  Settings,
  ArrowLeft,
  X,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Order", href: "/dashboard/new-order", icon: PlusCircle },
  { name: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
  { name: "Add Funds", href: "/dashboard/add-funds", icon: Wallet },
  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Services", href: "/dashboard/services", icon: ListChecks },
  { name: "Tickets", href: "/dashboard/tickets", icon: LifeBuoy },
  {
    name: "Reseller",
    href: "/dashboard/reseller",
    icon: Star,
    badge: "NEW",
  },
  { name: "API Access", href: "/dashboard/api", icon: Code2 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
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
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-blue-500/10 bg-[#060914] text-white shadow-2xl shadow-blue-950/20 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="relative overflow-hidden border-b border-white/5 px-5 py-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <Link href="/dashboard" onClick={onClose}>
              <img
                src="/logo.png"
                alt="Ascend Service"
                className="h-14 w-auto"
              />
            </Link>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-400 transition hover:border-blue-500/40 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/15 to-cyan-500/5 p-1 shadow-lg shadow-blue-950/20">
            <WalletBalance />
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
          {menu.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-cyan-300" />
                )}

                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white/[0.03] text-zinc-500 group-hover:text-blue-400"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2.2} />
                  </span>

                  {item.name}
                </span>

                {item.badge && (
                  <span className="rounded-full border border-blue-400/20 bg-blue-500/15 px-2 py-0.5 text-[10px] font-black text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03]">
              <ArrowLeft size={18} />
            </span>
            Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}
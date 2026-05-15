"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WalletBalance from "@/components/WalletBalance";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    name: "New Order",
    href: "/dashboard/new-order",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2h12l2 7H4l2-7z" />
        <path d="M4 9v11h16V9" />
      </svg>
    ),
  },
  {
    name: "Add Funds",
    href: "/dashboard/add-funds",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M12 10v4" />
        <path d="M10 12h4" />
      </svg>
    ),
  },
  {
    name: "Wallet",
    href: "/dashboard/wallet",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16v12H4z" />
        <path d="M16 12h4" />
      </svg>
    ),
  },
  {
    name: "Services",
    href: "/dashboard/services",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    name: "Tickets",
    href: "/dashboard/tickets",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16v10H4z" />
        <path d="M8 7v10" />
      </svg>
    ),
  },
  {
    name: "Reseller",
    href: "/dashboard/reseller",
    badge: "NEW",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l3 6 6 .8-4.5 4.4 1 6.3L12 17l-5.5 3.5 1-6.3L3 9.8 9 9l3-6z" />
      </svg>
    ),
  },
  {
    name: "API Access",
    href: "/dashboard/api",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 9l-4 3 4 3" />
        <path d="M16 9l4 3-4 3" />
        <path d="M14 4l-4 16" />
      </svg>
    ),
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a8 8 0 0 0 .1-6" />
        <path d="M4.5 9a8 8 0 0 0 .1 6" />
      </svg>
    ),
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
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 flex-col border-r border-blue-500/10 bg-zinc-950 text-white transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex`}
      >
        <div className="px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard" onClick={onClose}>
            <img src="/logo.png" alt="Ascend Service" className="h-14 w-auto" />
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden rounded-xl border border-zinc-800 px-3 py-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <WalletBalance />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {menu.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className={active ? "text-white" : "text-zinc-500"}>
                    {item.icon}
                  </span>
                  {item.name}
                </span>

                {item.badge && (
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to Website
          </Link>
        </div>
      </aside>
    </>
  );
}
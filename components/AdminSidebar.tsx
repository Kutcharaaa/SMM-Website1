"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type MenuItem = {
  name: string;
  href: string;
  icon: string;
  roles?: string[];
};

type MenuGroup = {
  title: string;
  icon: string;
  items: MenuItem[];
};

export default function AdminSidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState("admin");

  const [pendingPayments, setPendingPayments] = useState(0);
  const [hasNewPayments, setHasNewPayments] = useState(false);

  const [pendingOrders, setPendingOrders] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  const [openTickets, setOpenTickets] = useState(0);
  const [hasNewTickets, setHasNewTickets] = useState(false);

  const [minimized, setMinimized] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  async function loadAdminData() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role) setRole(profile.role);

    const { data: pendingData, count } = await supabase
      .from("deposits")
      .select("created_at", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    setPendingPayments(count || 0);

    const latestPendingCreatedAt = pendingData?.[0]?.created_at;
    const lastOpenedAt = localStorage.getItem("payments_last_opened_at");

    if (!latestPendingCreatedAt) {
      setHasNewPayments(false);
    } else if (!lastOpenedAt) {
      setHasNewPayments(true);
    } else {
      setHasNewPayments(
        new Date(latestPendingCreatedAt).getTime() >
          new Date(lastOpenedAt).getTime()
      );
    }

    const { data: pendingOrderData, count: orderCount } = await supabase
      .from("orders")
      .select("created_at", { count: "exact" })
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    setPendingOrders(orderCount || 0);

    const latestOrderCreatedAt = pendingOrderData?.[0]?.created_at;
    const lastOrdersOpenedAt = localStorage.getItem("orders_last_opened_at");

    if (!latestOrderCreatedAt) {
      setHasNewOrders(false);
    } else if (!lastOrdersOpenedAt) {
      setHasNewOrders(true);
    } else {
      setHasNewOrders(
        new Date(latestOrderCreatedAt).getTime() >
          new Date(lastOrdersOpenedAt).getTime()
      );
    }

    const { data: openTicketData, count: ticketCount } = await supabase
      .from("tickets")
      .select("created_at", { count: "exact" })
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);

    setOpenTickets(ticketCount || 0);

    const latestTicketCreatedAt = openTicketData?.[0]?.created_at;
    const lastTicketsOpenedAt = localStorage.getItem("tickets_last_opened_at");

    if (!latestTicketCreatedAt) {
      setHasNewTickets(false);
    } else if (!lastTicketsOpenedAt) {
      setHasNewTickets(true);
    } else {
      setHasNewTickets(
        new Date(latestTicketCreatedAt).getTime() >
          new Date(lastTicketsOpenedAt).getTime()
      );
    }
  }

  useEffect(() => {
    setMinimized(localStorage.getItem("admin_sidebar_minimized") === "true");

    const savedGroups = localStorage.getItem("admin_sidebar_open_groups");

    setOpenGroups(
      savedGroups
        ? JSON.parse(savedGroups)
        : {
            Main: true,
            Management: true,
            Catalog: true,
            Finance: true,
            System: true,
          }
    );

    loadAdminData();

    const interval = setInterval(loadAdminData, 3000);

    return () => clearInterval(interval);
  }, []);

  function toggleSidebar() {
    const next = !minimized;
    setMinimized(next);
    localStorage.setItem("admin_sidebar_minimized", String(next));
  }

  function toggleGroup(title: string) {
    const next = {
      ...openGroups,
      [title]: !openGroups[title],
    };

    setOpenGroups(next);
    localStorage.setItem("admin_sidebar_open_groups", JSON.stringify(next));
  }

  function handlePaymentsClick() {
    localStorage.setItem("payments_last_opened_at", new Date().toISOString());
    setHasNewPayments(false);
    setMobileOpen(false);
  }

  function handleOrdersClick() {
    localStorage.setItem("orders_last_opened_at", new Date().toISOString());
    setHasNewOrders(false);
    setMobileOpen(false);
  }

  function handleTicketsClick() {
    localStorage.setItem("tickets_last_opened_at", new Date().toISOString());
    setHasNewTickets(false);
    setMobileOpen(false);
  }

  function handleNormalClick() {
    setMobileOpen(false);
  }

  const groups: MenuGroup[] = [
    {
      title: "Main",
      icon: "🏠",
      items: [{ name: "Overview", href: "/admin", icon: "🏠" }],
    },
    {
      title: "Management",
      icon: "📁",
      items: [
        {
          name: "Users",
          href: "/admin/users",
          icon: "👥",
          roles: ["admin", "head_admin", "super_admin"],
        },
        {
          name: "Orders",
          href: "/admin/orders",
          icon: "📦",
          roles: ["admin", "head_admin", "super_admin"],
        },
        {
          name: "Payments",
          href: "/admin/payments",
          icon: "💳",
          roles: ["admin", "head_admin", "super_admin"],
        },
        {
          name: "Tickets",
          href: "/admin/tickets",
          icon: "🎫",
          roles: ["admin", "head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Catalog",
      icon: "🛒",
      items: [
        {
          name: "Services",
          href: "/admin/services",
          icon: "🛒",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Providers",
          href: "/admin/providers",
          icon: "🔌",
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Finance",
      icon: "💰",
      items: [
        {
          name: "Analytics",
          href: "/admin/analytics",
          icon: "📊",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Cash Accounts",
          href: "/admin/cash-accounts",
          icon: "👛",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Cash Transfers",
          href: "/admin/cash-transfers",
          icon: "🔁",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Cash Movements",
          href: "/admin/cash-movements",
          icon: "🧾",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Expenses",
          href: "/admin/expenses",
          icon: "💸",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Withdrawals",
          href: "/admin/withdrawals",
          icon: "🏧",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Reports",
          href: "/admin/reports",
          icon: "📈",
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Payment Methods",
          href: "/admin/payment-methods",
          icon: "🏦",
          roles: ["super_admin"],
        },
        {
          name: "Currencies",
          href: "/admin/currencies",
          icon: "💱",
          roles: ["super_admin"],
        },
      ],
    },
    {
      title: "System",
      icon: "⚙️",
      items: [
        {
          name: "Settings",
          href: "/admin/settings",
          icon: "⚙️",
          roles: ["super_admin"],
        },
        {
          name: "Roles",
          href: "/admin/roles",
          icon: "🛡️",
          roles: ["super_admin"],
        },
      ],
    },
  ];

  function getRoleLabel() {
    if (role === "super_admin") return "Super Administrator";
    if (role === "head_admin") return "Head Administrator";
    return "Administrator";
  }

  function getRoleColor() {
    if (role === "super_admin") return "text-red-400";
    if (role === "head_admin") return "text-purple-400";
    return "text-blue-400";
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[60] rounded-2xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-xl px-4 py-3 text-white shadow-2xl"
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col border-r border-zinc-800/80 bg-zinc-950 text-white transition-all duration-300 ${
          minimized ? "w-24" : "w-72"
        } ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-4 py-5 border-b border-zinc-800/80 flex items-center justify-between">
          {!minimized ? (
            <img src="/logo.png" alt="Ascend Service" className="h-14 w-auto" />
          ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-2xl font-black text-blue-400">
              A
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSidebar}
              className="hidden lg:block rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-400 hover:text-white hover:border-blue-500 transition"
              title={minimized ? "Maximize sidebar" : "Minimize sidebar"}
            >
              {minimized ? "»" : "«"}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {!minimized && (
          <div className="px-5 py-5">
            <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 to-zinc-900 p-5 shadow-lg shadow-black/30">
              <p className="text-sm text-zinc-400">Admin Access</p>
              <h2 className="text-3xl font-black mt-2 tracking-tight">
                CONTROL
              </h2>
              <p className={`text-xs mt-2 font-semibold ${getRoleColor()}`}>
                {getRoleLabel()}
              </p>
            </div>
          </div>
        )}

        <nav
          className="
            flex-1 px-3 pb-4 overflow-y-auto space-y-3
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-zinc-800
            hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700
          "
        >
          {groups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(role)
            );

            if (visibleItems.length <= 0) return null;

            const isOpen = minimized ? true : openGroups[group.title];

            return (
              <div key={group.title} className="rounded-3xl">
                {!minimized && (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-zinc-900 transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>{group.icon}</span>
                      {group.title}
                    </span>

                    <span
                      className={`text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                    >
                      ›
                    </span>
                  </button>
                )}

                {isOpen && (
                  <div className={`${minimized ? "space-y-2" : "mt-2 space-y-1"}`}>
                    {visibleItems.map((item) => {
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={
                            item.name === "Payments"
                              ? handlePaymentsClick
                              : item.name === "Orders"
                              ? handleOrdersClick
                              : item.name === "Tickets"
                              ? handleTicketsClick
                              : handleNormalClick
                          }
                          title={minimized ? item.name : undefined}
                          className={`relative flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            minimized ? "justify-center px-2" : ""
                          } ${
                            active
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            {!minimized && <span>{item.name}</span>}
                          </div>

                          {!minimized &&
                            item.name === "Payments" &&
                            pendingPayments > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="min-w-5 h-5 rounded-full bg-red-500/15 border border-red-500/20 px-1.5 text-[10px] font-bold text-red-400 flex items-center justify-center">
                                  {pendingPayments}
                                </span>
                                {hasNewPayments && (
                                  <span className="rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                                    NEW
                                  </span>
                                )}
                              </div>
                            )}

                          {!minimized &&
                            item.name === "Orders" &&
                            pendingOrders > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="min-w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/20 px-1.5 text-[10px] font-bold text-blue-400 flex items-center justify-center">
                                  {pendingOrders}
                                </span>
                                {hasNewOrders && (
                                  <span className="rounded-full bg-blue-500/15 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                                    NEW
                                  </span>
                                )}
                              </div>
                            )}

                          {!minimized &&
                            item.name === "Tickets" &&
                            openTickets > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="min-w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/20 px-1.5 text-[10px] font-bold text-purple-400 flex items-center justify-center">
                                  {openTickets}
                                </span>
                                {hasNewTickets && (
                                  <span className="rounded-full bg-purple-500/15 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold text-purple-400">
                                    NEW
                                  </span>
                                )}
                              </div>
                            )}

                          {minimized &&
                            item.name === "Payments" &&
                            pendingPayments > 0 && (
                              <span className="absolute right-2 top-1 min-w-5 h-5 rounded-full bg-red-500 border border-red-400 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                                {pendingPayments}
                              </span>
                            )}

                          {minimized &&
                            item.name === "Orders" &&
                            pendingOrders > 0 && (
                              <span className="absolute right-2 top-1 min-w-5 h-5 rounded-full bg-blue-500 border border-blue-400 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                                {pendingOrders}
                              </span>
                            )}

                          {minimized &&
                            item.name === "Tickets" &&
                            openTickets > 0 && (
                              <span className="absolute right-2 top-1 min-w-5 h-5 rounded-full bg-purple-500 border border-purple-400 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                                {openTickets}
                              </span>
                            )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/80">
          <Link
            href="/dashboard"
            onClick={handleNormalClick}
            title={minimized ? "User Dashboard" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white transition ${
              minimized ? "justify-center px-2" : ""
            }`}
          >
            <span className="text-lg">👤</span>
            {!minimized && <span>User Dashboard</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
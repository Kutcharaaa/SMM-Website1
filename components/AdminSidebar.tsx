"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  ChevronRight,
  Coins,
  CreditCard,
  FileClock,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageCircle,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  ReceiptText,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Ticket,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Role = "admin" | "head_admin" | "super_admin" | string;

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  roles?: Role[];
  badgeType?: "payments" | "orders" | "tickets";
  onClickType?: "payments" | "orders" | "tickets" | "logout";
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const adminRoles = ["admin", "head_admin", "super_admin"];

export default function AdminSidebar() {
  const pathname = usePathname();

  const [role, setRole] = useState<Role>("admin");

  const [pendingPayments, setPendingPayments] = useState(0);
  const [hasNewPayments, setHasNewPayments] = useState(false);

  const [pendingOrders, setPendingOrders] = useState(0);
  const [hasNewOrders, setHasNewOrders] = useState(false);

  const [openTickets, setOpenTickets] = useState(0);
  const [hasNewTickets, setHasNewTickets] = useState(false);

  const [systemBalance, setSystemBalance] = useState(0);

  const [minimized, setMinimized] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups: MenuGroup[] = [
    {
      title: "Main",
      items: [
        {
          name: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          roles: adminRoles,
        },
        {
          name: "Analytics / Reports",
          href: "/admin/reports",
          icon: BarChart3,
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Orders",
      items: [
        {
          name: "Orders",
          href: "/admin/orders",
          icon: ShoppingCart,
          roles: adminRoles,
          badgeType: "orders",
          onClickType: "orders",
        },
        {
          name: "New Order Monitor",
          href: "/admin/order-monitor",
          icon: Activity,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Order Refunds",
          href: "/admin/refunds",
          icon: RotateCcw,
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          name: "Deposits / Payments",
          href: "/admin/payments",
          icon: CreditCard,
          roles: adminRoles,
          badgeType: "payments",
          onClickType: "payments",
        },
        {
          name: "Payment Methods",
          href: "/admin/payment-methods",
          icon: Landmark,
          roles: ["super_admin"],
        },
        {
          name: "Cash Accounts",
          href: "/admin/cash-accounts",
          icon: Wallet,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Transactions",
          href: "/admin/transactions",
          icon: ReceiptText,
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          name: "Services",
          href: "/admin/services",
          icon: Package,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Providers",
          href: "/admin/providers",
          icon: PlugZap,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Categories",
          href: "/admin/categories",
          icon: Tags,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Currencies",
          href: "/admin/currencies",
          icon: Coins,
          roles: ["super_admin"],
        },
      ],
    },
    {
      title: "Users",
      items: [
        {
          name: "Users",
          href: "/admin/users",
          icon: Users,
          roles: adminRoles,
        },
        {
          name: "Reseller Requests",
          href: "/admin/reseller-requests",
          icon: HandCoins,
          roles: ["head_admin", "super_admin"],
        },
        {
          name: "Affiliates",
          href: "/admin/affiliates",
          icon: Users,
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          name: "Tickets",
          href: "/admin/tickets",
          icon: Ticket,
          roles: adminRoles,
          badgeType: "tickets",
          onClickType: "tickets",
        },
        {
          name: "Live Chat",
          href: "/admin/live-chat",
          icon: MessageCircle,
          roles: adminRoles,
        },
        {
          name: "Announcements",
          href: "/admin/announcements",
          icon: Megaphone,
          roles: ["head_admin", "super_admin"],
        },
      ],
    },
    {
      title: "System",
      items: [
        {
          name: "Settings",
          href: "/admin/settings",
          icon: Settings,
          roles: ["super_admin"],
        },
        {
          name: "Admin Roles",
          href: "/admin/admin-roles",
          icon: ShieldCheck,
          roles: ["super_admin"],
        },
        {
          name: "Activity Logs",
          href: "/admin/logs",
          icon: FileClock,
          roles: ["super_admin"],
        },
        {
          name: "Logout",
          href: "#logout",
          icon: LogOut,
          roles: adminRoles,
          onClickType: "logout",
        },
      ],
    },
  ];

  async function loadAdminData() {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role) setRole(profile.role);

    const { data: pendingData, count: paymentCount } = await supabase
      .from("deposits")
      .select("created_at", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    setPendingPayments(paymentCount || 0);

    const latestPendingCreatedAt = pendingData?.[0]?.created_at;
    const lastOpenedAt = localStorage.getItem("payments_last_opened_at");

    if (!latestPendingCreatedAt) {
      setHasNewPayments(false);
    } else if (!lastOpenedAt) {
      setHasNewPayments(true);
    } else {
      setHasNewPayments(
        new Date(latestPendingCreatedAt).getTime() >
          new Date(lastOpenedAt).getTime(),
      );
    }

    const { data: pendingOrderData, count: orderCount } = await supabase
      .from("orders")
      .select("created_at", { count: "exact" })
      .in("status", ["pending", "processing", "partial"])
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
          new Date(lastOrdersOpenedAt).getTime(),
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
          new Date(lastTicketsOpenedAt).getTime(),
      );
    }

    const { data: cashAccounts, error: cashError } = await supabase
      .from("cash_accounts")
      .select("balance");

    if (!cashError) {
      setSystemBalance(
        cashAccounts?.reduce(
          (sum, item) => sum + Number(item.balance || 0),
          0,
        ) || 0,
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
            Orders: true,
            Payments: true,
            Services: true,
            Users: true,
            Support: true,
            System: true,
          },
    );

    loadAdminData();

    const interval = setInterval(loadAdminData, 5000);

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

  function closeMobile() {
    setMobileOpen(false);
  }

  function handlePaymentsClick() {
    localStorage.setItem("payments_last_opened_at", new Date().toISOString());
    setHasNewPayments(false);
    closeMobile();
  }

  function handleOrdersClick() {
    localStorage.setItem("orders_last_opened_at", new Date().toISOString());
    setHasNewOrders(false);
    closeMobile();
  }

  function handleTicketsClick() {
    localStorage.setItem("tickets_last_opened_at", new Date().toISOString());
    setHasNewTickets(false);
    closeMobile();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function handleItemClick(item: MenuItem, event: React.MouseEvent) {
    if (item.onClickType === "payments") handlePaymentsClick();
    else if (item.onClickType === "orders") handleOrdersClick();
    else if (item.onClickType === "tickets") handleTicketsClick();
    else if (item.onClickType === "logout") {
      event.preventDefault();
      handleLogout();
    } else {
      closeMobile();
    }
  }

  function getRoleLabel() {
    if (role === "super_admin") return "Super Admin";
    if (role === "head_admin") return "Head Admin";
    return "Admin";
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    if (href === "#logout") return false;
    return pathname.startsWith(href);
  }

  function getBadge(item: MenuItem) {
    if (item.badgeType === "payments") {
      return {
        count: pendingPayments,
        hasNew: hasNewPayments,
        color: "bg-orange-500 text-white",
      };
    }

    if (item.badgeType === "orders") {
      return {
        count: pendingOrders,
        hasNew: hasNewOrders,
        color: "bg-blue-500 text-white",
      };
    }

    if (item.badgeType === "tickets") {
      return {
        count: openTickets,
        hasNew: hasNewTickets,
        color: "bg-green-500 text-white",
      };
    }

    return null;
  }

  function formatMoney(value: number) {
    return `₱${Number(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-900/40 bg-[#062712] text-white shadow-2xl lg:hidden"
      >
        <Menu size={21} />
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-emerald-900/40 bg-gradient-to-b from-[#052715] via-[#031d0f] to-[#02140a] text-white shadow-2xl shadow-emerald-950/30 transition-all duration-300 ${
          minimized ? "w-24" : "w-72"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-6">
          {!minimized ? (
            <Link href="/admin" onClick={closeMobile}>
              <img
                src="/logo.png"
                alt="Ascend Service"
                className="h-14 w-auto"
              />
            </Link>
          ) : (
            <Link
              href="/admin"
              onClick={closeMobile}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-xl font-black text-emerald-300"
            >
              A
            </Link>
          )}

          {!minimized && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="hidden h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-100 transition hover:bg-white/15 lg:flex"
                title="Minimize sidebar"
              >
                <PanelLeftClose size={18} />
              </button>

              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-100 transition hover:bg-white/15 lg:hidden"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>

        {minimized && (
          <div className="px-4 pb-4">
            <button
              onClick={toggleSidebar}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-100 transition hover:bg-white/15"
              title="Maximize sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {!minimized && (
          <div className="px-4 pb-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-100/70">
                    Admin Access
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">
                    Control Panel
                  </h2>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                  <ShieldCheck size={23} />
                </div>
              </div>

              <div className="mt-4 inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-200">
                {getRoleLabel()}
              </div>
            </div>
          </div>
        )}

        <nav
          className="
            flex-1 overflow-y-auto px-3 pb-4
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-white/15
            hover:[&::-webkit-scrollbar-thumb]:bg-white/25
          "
        >
          <div className="space-y-2">
            {groups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !item.roles || item.roles.includes(role),
              );

              if (visibleItems.length <= 0) return null;

              const isOpen = minimized ? true : openGroups[group.title];

              return (
                <div key={group.title}>
                  {!minimized && (
                    <button
                      onClick={() => toggleGroup(group.title)}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-100/50 transition hover:bg-white/5 hover:text-emerald-100"
                    >
                      <span>{group.title}</span>

                      <ChevronRight
                        size={16}
                        className={`transition ${isOpen ? "rotate-90" : ""}`}
                      />
                    </button>
                  )}

                  {isOpen && (
                    <div className={minimized ? "space-y-2" : "space-y-1"}>
                      {visibleItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;
                        const badge = getBadge(item);

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={(event) => handleItemClick(item, event)}
                            title={minimized ? item.name : undefined}
                            className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                              minimized ? "justify-center px-2" : ""
                            } ${
                              active
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
                                : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <Icon
                              size={19}
                              strokeWidth={2.2}
                              className="shrink-0"
                            />

                            {!minimized && (
                              <span className="min-w-0 flex-1 truncate">
                                {item.name}
                              </span>
                            )}

                            {!minimized && badge && badge.count > 0 && (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-black ${badge.color}`}
                                >
                                  {badge.count}
                                </span>

                                {badge.hasNew && (
                                  <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black text-white">
                                    NEW
                                  </span>
                                )}
                              </div>
                            )}

                            {minimized && badge && badge.count > 0 && (
                              <span
                                className={`absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${badge.color}`}
                              >
                                {badge.count}
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
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          {!minimized ? (
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/20 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-100/70">
                    System Balance
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-tight text-white">
                    {formatMoney(systemBalance)}
                  </h3>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                  <Wallet size={23} />
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={closeMobile}
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-400"
              >
                User Dashboard
              </Link>
            </div>
          ) : (
            <Link
              href="/dashboard"
              onClick={closeMobile}
              title="User Dashboard"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-100 transition hover:bg-white/15"
            >
              <Users size={20} />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
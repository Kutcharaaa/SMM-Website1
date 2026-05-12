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
  const [minimized, setMinimized] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  async function loadAdminData() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profile?.role) {
      setRole(profile.role);
    }

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
      return;
    }

    if (!lastOpenedAt) {
      setHasNewPayments(true);
      return;
    }

    setHasNewPayments(
      new Date(latestPendingCreatedAt).getTime() >
        new Date(lastOpenedAt).getTime()
    );
  }

  useEffect(() => {
    const savedMinimized = localStorage.getItem("admin_sidebar_minimized");
    setMinimized(savedMinimized === "true");

    const savedGroups = localStorage.getItem("admin_sidebar_open_groups");

    if (savedGroups) {
      setOpenGroups(JSON.parse(savedGroups));
    } else {
      setOpenGroups({
        Main: true,
        Management: true,
        Catalog: true,
        Finance: true,
        System: true,
      });
    }

    loadAdminData();

    const interval = setInterval(() => {
      loadAdminData();
    }, 3000);

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
          name: "Reports",
          href: "/admin/reports",
          icon: "📊",
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
    <aside
      className={`hidden lg:flex fixed left-0 top-0 h-screen flex-col border-r border-zinc-800/80 bg-zinc-950 text-white transition-all duration-300 ${
        minimized ? "w-24" : "w-72"
      }`}
    >
      <div className="px-4 py-5 border-b border-zinc-800/80 flex items-center justify-between">
        {!minimized ? (
          <img
            src="/logo.png"
            alt="Ascend Service"
            className="h-14 w-auto"
          />
        ) : (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20 text-2xl font-black text-blue-400">
            A
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="rounded-xl border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-400 hover:text-white hover:border-blue-500 transition"
          title={minimized ? "Maximize sidebar" : "Minimize sidebar"}
        >
          {minimized ? "»" : "«"}
        </button>
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
          scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800
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
                            : undefined
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

                        {minimized &&
                          item.name === "Payments" &&
                          pendingPayments > 0 && (
                            <span className="absolute right-2 top-1 min-w-5 h-5 rounded-full bg-red-500 border border-red-400 px-1 text-[10px] font-bold text-white flex items-center justify-center">
                              {pendingPayments}
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
  );
}
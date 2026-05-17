"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  LifeBuoy,
  Package,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StatsState = {
  users: number;
  pendingPayments: number;
  approvedDeposits: number;
  activeOrders: number;
  completedOrders: number;
  openTickets: number;
  totalCash: number;
  expenses: number;
  totalDeposits: number;
  totalOrderRevenue: number;
};

type RecentOrder = {
  id: string;
  user_id: string | null;
  service_name: string | null;
  quantity: number | null;
  status: string | null;
  price: number | null;
  created_at: string;
};

type RecentDeposit = {
  id: string;
  user_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  created_at: string;
};

type RecentUser = {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
};

const emptyStats: StatsState = {
  users: 0,
  pendingPayments: 0,
  approvedDeposits: 0,
  activeOrders: 0,
  completedOrders: 0,
  openTickets: 0,
  totalCash: 0,
  expenses: 0,
  totalDeposits: 0,
  totalOrderRevenue: 0,
};

function formatMoney(value: number) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusStyle(status?: string | null) {
  const clean = (status || "pending").toLowerCase();

  if (clean === "completed" || clean === "approved" || clean === "success") {
    return "bg-green-50 text-green-700";
  }

  if (clean === "pending") {
    return "bg-yellow-50 text-yellow-700";
  }

  if (clean === "processing" || clean === "partial") {
    return "bg-blue-50 text-blue-700";
  }

  if (clean === "cancelled" || clean === "canceled" || clean === "rejected") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatsState>(emptyStats);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<RecentDeposit[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function safeCount(
    table: string,
    filter?: (query: any) => any,
  ): Promise<number> {
    let query = supabase.from(table).select("id", {
      count: "exact",
      head: true,
    });

    if (filter) {
      query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
      console.warn(`Count error for ${table}:`, error.message);
      return 0;
    }

    return count || 0;
  }

  async function safeSum(table: string, column: string, filter?: (query: any) => any) {
    let query = supabase.from(table).select(column);

    if (filter) {
      query = filter(query);
    }

    const { data, error } = await query;

    if (error) {
      console.warn(`Sum error for ${table}.${column}:`, error.message);
      return 0;
    }

    return (
      data?.reduce((sum: number, item: any) => {
        return sum + Number(item?.[column] || 0);
      }, 0) || 0
    );
  }

  async function loadStats() {
    setLoading(true);

    const [
      users,
      pendingPayments,
      approvedDeposits,
      activeOrders,
      completedOrders,
      openTickets,
      totalCash,
      expenses,
      totalDeposits,
      totalOrderRevenue,
    ] = await Promise.all([
      safeCount("profiles"),
      safeCount("deposits", (q) => q.eq("status", "pending")),
      safeCount("deposits", (q) => q.in("status", ["approved", "completed", "success", "paid"])),
      safeCount("orders", (q) => q.in("status", ["pending", "processing", "partial"])),
      safeCount("orders", (q) => q.eq("status", "completed")),
      safeCount("tickets", (q) => q.eq("status", "open")),
      safeSum("cash_accounts", "balance"),
      safeSum("expenses", "amount"),
      safeSum("deposits", "amount", (q) =>
        q.in("status", ["approved", "completed", "success", "paid"]),
      ),
      safeSum("orders", "price"),
    ]);

    setStats({
      users,
      pendingPayments,
      approvedDeposits,
      activeOrders,
      completedOrders,
      openTickets,
      totalCash,
      expenses,
      totalDeposits,
      totalOrderRevenue,
    });

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, service_name, quantity, status, price, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (orderError) {
      console.warn("Recent orders error:", orderError.message);
      setRecentOrders([]);
    } else {
      setRecentOrders((orderData || []) as RecentOrder[]);
    }

    const { data: depositData, error: depositError } = await supabase
      .from("deposits")
      .select("id, user_id, amount, method, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (depositError) {
      console.warn("Recent deposits error:", depositError.message);
      setRecentDeposits([]);
    } else {
      setRecentDeposits((depositData || []) as RecentDeposit[]);
    }

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, username, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (userError) {
      console.warn("Recent users error:", userError.message);
      setRecentUsers([]);
    } else {
      setRecentUsers((userData || []) as RecentUser[]);
    }

    setLastUpdated(
      new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );

    setLoading(false);
  }

  useEffect(() => {
    loadStats();

    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const estimatedProfit = useMemo(() => {
    return stats.totalOrderRevenue - stats.expenses;
  }, [stats.totalOrderRevenue, stats.expenses]);

  const cards = [
    {
      label: "Total Users",
      value: formatNumber(stats.users),
      subtitle: "Registered accounts",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Pending Payments",
      value: formatNumber(stats.pendingPayments),
      subtitle: "Need approval",
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-yellow-50 text-yellow-700",
      alert: stats.pendingPayments > 0,
    },
    {
      label: "Active Orders",
      value: formatNumber(stats.activeOrders),
      subtitle: "Pending / processing",
      icon: Package,
      href: "/admin/orders",
      color: "bg-blue-50 text-blue-700",
      alert: stats.activeOrders > 0,
    },
    {
      label: "Open Tickets",
      value: formatNumber(stats.openTickets),
      subtitle: "Awaiting reply",
      icon: LifeBuoy,
      href: "/admin/tickets",
      color: "bg-red-50 text-red-700",
      alert: stats.openTickets > 0,
    },
    {
      label: "Total Business Cash",
      value: formatMoney(stats.totalCash),
      subtitle: "Cash account balance",
      icon: Wallet,
      href: "/admin/cash-accounts",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Estimated Profit",
      value: formatMoney(estimatedProfit),
      subtitle: "Orders minus expenses",
      icon: estimatedProfit >= 0 ? TrendingUp : TrendingDown,
      href: "/admin/reports",
      color: estimatedProfit >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-2 text-sm font-black text-green-700">
              <ShieldCheck size={17} />
              Admin Control Center
            </div>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">
              Admin Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              Monitor users, orders, payments, tickets, cash accounts, expenses,
              and business performance in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadStats}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700 disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
            >
              View Orders
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-green-950/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.color}`}>
                    <Icon size={27} />
                  </div>

                  {card.alert ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      <AlertCircle size={13} />
                      Action
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-400">
                      Live
                    </span>
                  )}
                </div>

                <p className="mt-6 text-sm font-black text-slate-500">
                  {card.label}
                </p>

                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {loading ? "..." : card.value}
                </h3>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-400">
                    {card.subtitle}
                  </p>

                  <ArrowRight
                    size={18}
                    className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-green-600"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Business Snapshot
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Quick financial and operation summary.
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                Updated {lastUpdated || "—"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <SnapshotCard
                title="Approved Deposits"
                value={formatNumber(stats.approvedDeposits)}
                subtitle={formatMoney(stats.totalDeposits)}
                icon={CheckCircle2}
              />

              <SnapshotCard
                title="Completed Orders"
                value={formatNumber(stats.completedOrders)}
                subtitle="All completed orders"
                icon={Package}
              />

              <SnapshotCard
                title="Total Order Revenue"
                value={formatMoney(stats.totalOrderRevenue)}
                subtitle="Based on order price"
                icon={DollarSign}
              />

              <SnapshotCard
                title="Total Expenses"
                value={formatMoney(stats.expenses)}
                subtitle="Business expenses"
                icon={TrendingDown}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">Quick Actions</h2>

            <div className="mt-6 space-y-3">
              <QuickAction
                href="/admin/payments"
                title="Review Pending Payments"
                subtitle={`${stats.pendingPayments} pending payment${
                  stats.pendingPayments === 1 ? "" : "s"
                }`}
                icon={CreditCard}
              />

              <QuickAction
                href="/admin/orders"
                title="Manage Active Orders"
                subtitle={`${stats.activeOrders} active order${
                  stats.activeOrders === 1 ? "" : "s"
                }`}
                icon={Package}
              />

              <QuickAction
                href="/admin/tickets"
                title="Answer Support Tickets"
                subtitle={`${stats.openTickets} open ticket${
                  stats.openTickets === 1 ? "" : "s"
                }`}
                icon={LifeBuoy}
              />

              <QuickAction
                href="/admin/services"
                title="Manage Services"
                subtitle="Update prices and availability"
                icon={BarChart3}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <RecentOrdersTable orders={recentOrders} />
          <RecentDepositsTable deposits={recentDeposits} />
          <RecentUsersTable users={recentUsers} />
        </div>
      </div>
    </AdminLayout>
  );
}

function SnapshotCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Icon size={22} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-500">{title}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{value}</h3>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-400">{subtitle}</p>
    </div>
  );
}

function QuickAction({
  href,
  title,
  subtitle,
  icon: Icon,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl bg-white/10 p-4 transition hover:bg-white/15"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-500/20 text-green-300">
        <Icon size={23} />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-black text-white">{title}</h3>
        <p className="mt-1 truncate text-xs font-semibold text-slate-400">
          {subtitle}
        </p>
      </div>

      <ArrowRight
        size={17}
        className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-green-300"
      />
    </Link>
  );
}

function RecentOrdersTable({ orders }: { orders: RecentOrder[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">Recent Orders</h2>
        <Link href="/admin/orders" className="text-sm font-black text-green-700">
          View All
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {orders.length <= 0 ? (
          <EmptyState text="No recent orders." />
        ) : (
          orders.map((order) => (
            <div key={order.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {order.service_name || "Unknown Service"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    #{order.id.slice(0, 8)} • {formatDate(order.created_at)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                    order.status,
                  )}`}
                >
                  {order.status || "pending"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-500">
                  Qty: {formatNumber(Number(order.quantity || 0))}
                </span>
                <span className="font-black text-slate-950">
                  {formatMoney(Number(order.price || 0))}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentDepositsTable({ deposits }: { deposits: RecentDeposit[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">Recent Payments</h2>
        <Link href="/admin/payments" className="text-sm font-black text-green-700">
          View All
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {deposits.length <= 0 ? (
          <EmptyState text="No recent payments." />
        ) : (
          deposits.map((deposit) => (
            <div key={deposit.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {formatMoney(Number(deposit.amount || 0))}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {deposit.method || "Payment"} • {formatDate(deposit.created_at)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                    deposit.status,
                  )}`}
                >
                  {deposit.status || "pending"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecentUsersTable({ users }: { users: RecentUser[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">Recent Users</h2>
        <Link href="/admin/users" className="text-sm font-black text-green-700">
          View All
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {users.length <= 0 ? (
          <EmptyState text="No recent users." />
        ) : (
          users.map((user) => (
            <div key={user.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-sm font-black text-green-700">
                  {(user.username || user.email || "U").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">
                    {user.username || "User"}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-400">
                    {user.email || "No email"} • {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="p-8 text-center">
      <Clock className="mx-auto text-slate-300" size={28} />
      <p className="mt-3 text-sm font-semibold text-slate-400">{text}</p>
    </div>
  );
}
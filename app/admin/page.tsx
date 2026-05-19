"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  ArrowRight,
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

type RangeType = "day" | "week" | "month" | "year";

type OverviewMetric =
  | "revenue"
  | "grossProfit"
  | "orders"
  | "users"
  | "addFundCount"
  | "addFundAmount"
  | "estimatedProfit";

type StatisticType = "orders" | "tickets" | "payments" | "users";

type StatsState = {
  users: number;
  pendingPayments: number;
  approvedDeposits: number;
  activeOrders: number;
  completedOrders: number;
  pendingOrders: number;
  processingOrders: number;
  partialOrders: number;
  cancelledOrders: number;
  openTickets: number;
  totalCash: number;
  expenses: number;
  totalDeposits: number;
  totalOrderRevenue: number;
  childPanelRevenue: number;
  totalRevenue: number;
};

type OrderRow = {
  id: string;
  user_id: string | null;
  service_name: string | null;
  quantity: number | null;
  status: string | null;
  price: number | null;
  created_at: string;
};

type DepositRow = {
  id: string;
  user_id: string | null;
  amount: number | null;
  method: string | null;
  status: string | null;
  created_at: string;
};

type UserRow = {
  id: string;
  username: string | null;
  role: string | null;
  created_at: string | null;
};

type TicketRow = {
  id: string;
  status: string | null;
  created_at: string | null;
};

type ExpenseRow = {
  amount: number | null;
  created_at?: string | null;
};

type CashMovementRow = {
  id: string;
  type: string | null;
  amount: number | null;
  created_at: string | null;
};

type ChartPoint = {
  label: string;
  value: number;
};

type DonutItem = {
  label: string;
  value: number;
  color: string;
};

const emptyStats: StatsState = {
  users: 0,
  pendingPayments: 0,
  approvedDeposits: 0,
  activeOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  processingOrders: 0,
  partialOrders: 0,
  cancelledOrders: 0,
  openTickets: 0,
  totalCash: 0,
  expenses: 0,
  totalDeposits: 0,
  totalOrderRevenue: 0,
  childPanelRevenue: 0,
  totalRevenue: 0,
};

const overviewTabs: { label: string; value: OverviewMetric }[] = [
  { label: "Revenue", value: "revenue" },
  { label: "Gross Profit", value: "grossProfit" },
  { label: "Orders", value: "orders" },
  { label: "Users", value: "users" },
  { label: "Add Fund Count", value: "addFundCount" },
  { label: "Add Fund Amount", value: "addFundAmount" },
  { label: "Estimated Profit", value: "estimatedProfit" },
];

const rangeTabs: { label: string; value: RangeType }[] = [
  { label: "This Day", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

const statisticsTabs: { label: string; value: StatisticType }[] = [
  { label: "Orders", value: "orders" },
  { label: "Tickets", value: "tickets" },
  { label: "Payments", value: "payments" },
  { label: "Users", value: "users" },
];

function formatMoney(value: number) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatShortMoney(value: number) {
  const amount = Number(value || 0);

  if (amount >= 1000000) return `₱${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(0)}K`;

  return `₱${amount.toFixed(0)}`;
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

function cleanStatus(status?: string | null) {
  return (status || "").toLowerCase().trim();
}

function isApprovedDeposit(status?: string | null) {
  const clean = cleanStatus(status);
  return ["approved", "completed", "success", "paid"].includes(clean);
}

function isCancelled(status?: string | null) {
  const clean = cleanStatus(status);
  return ["cancelled", "canceled", "rejected", "failed"].includes(clean);
}

function normalizeCashMovementType(type?: string | null) {
  const clean = String(type || "")
    .toLowerCase()
    .trim()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (
    [
      "child_panel_subscription",
      "child_panel_auto_renew",
      "child_panel_renewal",
    ].includes(clean)
  ) {
    return "child_panel_subscription";
  }

  return clean;
}

function isChildPanelMovement(type?: string | null) {
  return normalizeCashMovementType(type) === "child_panel_subscription";
}

function getStatusStyle(status?: string | null) {
  const clean = cleanStatus(status);

  if (clean === "completed" || clean === "approved" || clean === "success") {
    return "bg-green-50 text-green-700";
  }

  if (clean === "pending") {
    return "bg-yellow-50 text-yellow-700";
  }

  if (clean === "processing" || clean === "partial") {
    return "bg-blue-50 text-blue-700";
  }

  if (isCancelled(clean)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStartOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

function getRangeStart(range: RangeType) {
  const now = new Date();

  if (range === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (range === "week") {
    const start = getStartOfWeek(now);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate());
  }

  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(now.getFullYear(), 0, 1);
}

function getRangeEnd(range: RangeType) {
  const now = new Date();

  if (range === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  if (range === "week") {
    const start = getStartOfWeek(now);
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  }

  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  return new Date(now.getFullYear() + 1, 0, 1);
}

function isInsideRange(value: string | null | undefined, range: RangeType) {
  if (!value) return false;

  const date = new Date(value);
  const start = getRangeStart(range);
  const end = getRangeEnd(range);

  return date >= start && date < end;
}

function getBucketLabel(date: Date, range: RangeType) {
  if (range === "day") {
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      hour12: true,
    });
  }

  if (range === "week") {
    return date.toLocaleDateString("en-PH", {
      weekday: "short",
    });
  }

  if (range === "month") {
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-PH", {
    month: "short",
  });
}

function createBuckets(range: RangeType) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (range === "day") {
    const start = getRangeStart("day");

    for (let hour = 0; hour < 24; hour += 4) {
      const bucketStart = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        hour,
      );

      const bucketEnd = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        hour + 4,
      );

      buckets.push({
        label: getBucketLabel(bucketStart, range),
        start: bucketStart,
        end: bucketEnd,
      });
    }
  }

  if (range === "week") {
    const start = getStartOfWeek(now);

    for (let index = 0; index < 7; index++) {
      const bucketStart = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + index,
      );

      const bucketEnd = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate() + index + 1,
      );

      buckets.push({
        label: getBucketLabel(bucketStart, range),
        start: bucketStart,
        end: bucketEnd,
      });
    }
  }

  if (range === "month") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedDays = [1, 7, 13, 19, 25, daysInMonth].filter(
      (day, index, array) => array.indexOf(day) === index && day <= daysInMonth,
    );

    selectedDays.forEach((day, index) => {
      const nextDay = selectedDays[index + 1] || daysInMonth + 1;

      const bucketStart = new Date(year, month, day);
      const bucketEnd = new Date(year, month, nextDay);

      buckets.push({
        label: getBucketLabel(bucketStart, range),
        start: bucketStart,
        end: bucketEnd,
      });
    });
  }

  if (range === "year") {
    const year = now.getFullYear();

    for (let month = 0; month < 12; month++) {
      const bucketStart = new Date(year, month, 1);
      const bucketEnd = new Date(year, month + 1, 1);

      buckets.push({
        label: getBucketLabel(bucketStart, range),
        start: bucketStart,
        end: bucketEnd,
      });
    }
  }

  return buckets;
}

function sumOrdersInBucket(orders: OrderRow[], start: Date, end: Date) {
  return orders
    .filter((order) => {
      const date = new Date(order.created_at);
      return date >= start && date < end;
    })
    .reduce((sum, order) => sum + Number(order.price || 0), 0);
}

function sumChildPanelRevenueInBucket(
  movements: CashMovementRow[],
  start: Date,
  end: Date,
) {
  return movements
    .filter((movement) => {
      if (!movement.created_at) return false;
      const date = new Date(movement.created_at);
      return date >= start && date < end && isChildPanelMovement(movement.type);
    })
    .reduce((sum, movement) => sum + Math.max(0, Number(movement.amount || 0)), 0);
}

function countOrdersInBucket(orders: OrderRow[], start: Date, end: Date) {
  return orders.filter((order) => {
    const date = new Date(order.created_at);
    return date >= start && date < end;
  }).length;
}

function countUsersInBucket(users: UserRow[], start: Date, end: Date) {
  return users.filter((user) => {
    if (!user.created_at) return false;
    const date = new Date(user.created_at);
    return date >= start && date < end;
  }).length;
}

function sumDepositsInBucket(deposits: DepositRow[], start: Date, end: Date) {
  return deposits
    .filter((deposit) => {
      const date = new Date(deposit.created_at);
      return date >= start && date < end && isApprovedDeposit(deposit.status);
    })
    .reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0);
}

function countDepositsInBucket(deposits: DepositRow[], start: Date, end: Date) {
  return deposits.filter((deposit) => {
    const date = new Date(deposit.created_at);
    return date >= start && date < end && isApprovedDeposit(deposit.status);
  }).length;
}

function sumExpensesInBucket(expenses: ExpenseRow[], start: Date, end: Date) {
  return expenses
    .filter((expense) => {
      if (!expense.created_at) return false;
      const date = new Date(expense.created_at);
      return date >= start && date < end;
    })
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function buildLinePath(points: ChartPoint[], width: number, height: number) {
  if (points.length <= 0) return "";

  const maxValue = Math.max(...points.map((item) => item.value), 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  return points
    .map((point, index) => {
      const x = index * stepX;
      const y = height - (point.value / maxValue) * height;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

function buildAreaPath(points: ChartPoint[], width: number, height: number) {
  const line = buildLinePath(points, width, height);

  if (!line || points.length <= 0) return "";

  return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function buildDonutGradient(items: DonutItem[], total: number) {
  if (total <= 0) {
    return "conic-gradient(#e5e7eb 0deg 360deg)";
  }

  let current = 0;

  const parts = items.map((item) => {
    const start = current;
    const degree = (item.value / total) * 360;
    const end = start + degree;

    current = end;

    return `${item.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${parts.join(", ")})`;
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatsState>(emptyStats);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovementRow[]>([]);

  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<DepositRow[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);

  const [overviewMetric, setOverviewMetric] =
    useState<OverviewMetric>("revenue");
  const [overviewRange, setOverviewRange] = useState<RangeType>("month");
  const [statisticsType, setStatisticsType] =
    useState<StatisticType>("orders");

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  async function loadStats() {
    setLoading(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, service_name, quantity, status, price, created_at")
      .order("created_at", { ascending: false });

    const { data: depositData, error: depositError } = await supabase
      .from("deposits")
      .select("id, user_id, amount, method, status, created_at")
      .order("created_at", { ascending: false });

    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id, username, role, created_at")
      .order("created_at", { ascending: false });

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("id, status, created_at")
      .order("created_at", { ascending: false });

    const { data: cashAccounts, error: cashError } = await supabase
      .from("cash_accounts")
      .select("balance");

    let cashMovementRows: CashMovementRow[] = [];
    let cashMovementFrom = 0;
    const cashMovementBatchSize = 1000;

    while (true) {
      const cashMovementTo = cashMovementFrom + cashMovementBatchSize - 1;

      const { data: cashMovementData, error: cashMovementError } =
        await supabase
          .from("cash_movements")
          .select("id, type, amount, created_at")
          .order("created_at", { ascending: false })
          .range(cashMovementFrom, cashMovementTo);

      if (cashMovementError) {
        cashMovementRows = [];
        break;
      }

      const batch = (cashMovementData || []) as CashMovementRow[];
      cashMovementRows = [...cashMovementRows, ...batch];

      if (batch.length < cashMovementBatchSize) {
        break;
      }

      cashMovementFrom += cashMovementBatchSize;
    }

    let expenseRows: ExpenseRow[] = [];

    const { data: expenseDataWithDate, error: expenseDateError } =
      await supabase.from("expenses").select("amount, created_at");

    if (!expenseDateError && expenseDataWithDate) {
      expenseRows = expenseDataWithDate as ExpenseRow[];
    } else {
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount");

      expenseRows = (expenseData || []) as ExpenseRow[];
    }

    const loadedOrders = orderError ? [] : ((orderData || []) as OrderRow[]);
    const loadedDeposits = depositError
      ? []
      : ((depositData || []) as DepositRow[]);
    const loadedUsers = userError ? [] : ((userData || []) as UserRow[]);
    const loadedTickets = ticketError ? [] : ((ticketData || []) as TicketRow[]);

    const pendingPayments = loadedDeposits.filter(
      (item) => cleanStatus(item.status) === "pending",
    ).length;

    const approvedDeposits = loadedDeposits.filter((item) =>
      isApprovedDeposit(item.status),
    ).length;

    const totalDeposits = loadedDeposits
      .filter((item) => isApprovedDeposit(item.status))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const pendingOrders = loadedOrders.filter(
      (item) => cleanStatus(item.status) === "pending",
    ).length;

    const processingOrders = loadedOrders.filter(
      (item) => cleanStatus(item.status) === "processing",
    ).length;

    const partialOrders = loadedOrders.filter(
      (item) => cleanStatus(item.status) === "partial",
    ).length;

    const completedOrders = loadedOrders.filter(
      (item) => cleanStatus(item.status) === "completed",
    ).length;

    const cancelledOrders = loadedOrders.filter((item) =>
      isCancelled(item.status),
    ).length;

    const activeOrders = pendingOrders + processingOrders + partialOrders;

    const openTickets = loadedTickets.filter(
      (item) => cleanStatus(item.status) === "open",
    ).length;

    const totalCash =
      cashError || !cashAccounts
        ? 0
        : cashAccounts.reduce(
            (sum, item: any) => sum + Number(item.balance || 0),
            0,
          );

    const expenseTotal = expenseRows.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    const totalOrderRevenue = loadedOrders.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    const childPanelRevenue = cashMovementRows
      .filter((item) => isChildPanelMovement(item.type))
      .reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0);

    const totalRevenue = totalOrderRevenue + childPanelRevenue;

    setOrders(loadedOrders);
    setDeposits(loadedDeposits);
    setUsers(loadedUsers);
    setTickets(loadedTickets);
    setExpenses(expenseRows);
    setCashMovements(cashMovementRows);

    setRecentOrders(loadedOrders.slice(0, 5));
    setRecentDeposits(loadedDeposits.slice(0, 5));
    setRecentUsers(loadedUsers.slice(0, 5));

    setStats({
      users: loadedUsers.length,
      pendingPayments,
      approvedDeposits,
      activeOrders,
      completedOrders,
      pendingOrders,
      processingOrders,
      partialOrders,
      cancelledOrders,
      openTickets,
      totalCash,
      expenses: expenseTotal,
      totalDeposits,
      totalOrderRevenue,
      childPanelRevenue,
      totalRevenue,
    });

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
    return stats.totalRevenue - stats.expenses;
  }, [stats.totalRevenue, stats.expenses]);

  const overviewPoints = useMemo(() => {
    const buckets = createBuckets(overviewRange);

    return buckets.map((bucket) => {
      const orderRevenue = sumOrdersInBucket(orders, bucket.start, bucket.end);
      const childPanelRevenue = sumChildPanelRevenueInBucket(
        cashMovements,
        bucket.start,
        bucket.end,
      );
      const revenue = orderRevenue + childPanelRevenue;
      const bucketExpenses = sumExpensesInBucket(expenses, bucket.start, bucket.end);

      let value = revenue;

      if (overviewMetric === "revenue") value = revenue;
      if (overviewMetric === "grossProfit") value = Math.max(0, revenue - bucketExpenses);
      if (overviewMetric === "orders") value = countOrdersInBucket(orders, bucket.start, bucket.end);
      if (overviewMetric === "users") value = countUsersInBucket(users, bucket.start, bucket.end);
      if (overviewMetric === "addFundCount") value = countDepositsInBucket(deposits, bucket.start, bucket.end);
      if (overviewMetric === "addFundAmount") value = sumDepositsInBucket(deposits, bucket.start, bucket.end);
      if (overviewMetric === "estimatedProfit") value = revenue - bucketExpenses;

      return {
        label: bucket.label,
        value,
      };
    });
  }, [
    overviewMetric,
    overviewRange,
    orders,
    users,
    deposits,
    expenses,
    cashMovements,
  ]);

  const currentOverviewTotal = useMemo(() => {
    return overviewPoints.reduce((sum, item) => sum + Number(item.value || 0), 0);
  }, [overviewPoints]);

  const statisticsItems = useMemo<DonutItem[]>(() => {
    if (statisticsType === "orders") {
      return [
        { label: "Completed", value: stats.completedOrders, color: "#16a34a" },
        { label: "Processing", value: stats.processingOrders, color: "#2563eb" },
        { label: "Pending", value: stats.pendingOrders, color: "#f59e0b" },
        { label: "Partial", value: stats.partialOrders, color: "#8b5cf6" },
        { label: "Canceled", value: stats.cancelledOrders, color: "#ef4444" },
      ];
    }

    if (statisticsType === "tickets") {
      return [
        {
          label: "Open",
          value: tickets.filter((item) => cleanStatus(item.status) === "open").length,
          color: "#ef4444",
        },
        {
          label: "Pending",
          value: tickets.filter((item) => cleanStatus(item.status) === "pending").length,
          color: "#f59e0b",
        },
        {
          label: "Answered",
          value: tickets.filter((item) =>
            ["answered", "reply", "replied"].includes(cleanStatus(item.status)),
          ).length,
          color: "#2563eb",
        },
        {
          label: "Resolved",
          value: tickets.filter((item) =>
            ["resolved", "closed", "completed"].includes(cleanStatus(item.status)),
          ).length,
          color: "#16a34a",
        },
      ];
    }

    if (statisticsType === "payments") {
      return [
        {
          label: "Approved",
          value: deposits.filter((item) => isApprovedDeposit(item.status)).length,
          color: "#16a34a",
        },
        {
          label: "Pending",
          value: deposits.filter((item) => cleanStatus(item.status) === "pending").length,
          color: "#f59e0b",
        },
        {
          label: "Rejected",
          value: deposits.filter((item) => isCancelled(item.status)).length,
          color: "#ef4444",
        },
      ];
    }

    return [
      {
        label: "Users",
        value: users.filter((item) => cleanStatus(item.role) === "user").length,
        color: "#2563eb",
      },
      {
        label: "Admins",
        value: users.filter((item) => cleanStatus(item.role) === "admin").length,
        color: "#16a34a",
      },
      {
        label: "Head Admin",
        value: users.filter((item) => cleanStatus(item.role) === "head_admin").length,
        color: "#f59e0b",
      },
      {
        label: "Developer",
        value: users.filter((item) => cleanStatus(item.role) === "super_admin").length,
        color: "#8b5cf6",
      },
    ];
  }, [statisticsType, stats, tickets, deposits, users]);

  const statisticsTotal = statisticsItems.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const cards = [
    {
      label: "Total Users",
      value: formatNumber(stats.users),
      subtitle: "All registered users",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Pending Payments",
      value: formatNumber(stats.pendingPayments),
      subtitle: "Awaiting approval",
      icon: CreditCard,
      href: "/admin/payments",
      color: "bg-orange-50 text-orange-700",
      alert: stats.pendingPayments > 0,
    },
    {
      label: "Active Orders",
      value: formatNumber(stats.activeOrders),
      subtitle: "Processing / pending",
      icon: Package,
      href: "/admin/orders",
      color: "bg-blue-50 text-blue-700",
      alert: stats.activeOrders > 0,
    },
    {
      label: "Open Tickets",
      value: formatNumber(stats.openTickets),
      subtitle: "Customer support",
      icon: LifeBuoy,
      href: "/admin/tickets",
      color: "bg-red-50 text-red-700",
      alert: stats.openTickets > 0,
    },
    {
      label: "Total Cash",
      value: formatMoney(stats.totalCash),
      subtitle: "All cash accounts",
      icon: Wallet,
      href: "/admin/cash-accounts",
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Expenses",
      value: formatMoney(stats.expenses),
      subtitle: "Business expenses",
      icon: TrendingDown,
      href: "/admin/reports",
      color: "bg-purple-50 text-purple-700",
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
              Monitor revenue, gross profit, orders, users, add funds, tickets,
              payments, and platform activity.
            </p>
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-700 disabled:opacity-60"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.label}
                href={card.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-green-950/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.color}`}
                  >
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

                <p className="mt-6 text-sm font-black uppercase tracking-wide text-slate-500">
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

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <OverviewChart
            points={overviewPoints}
            metric={overviewMetric}
            range={overviewRange}
            total={currentOverviewTotal}
            onMetricChange={setOverviewMetric}
            onRangeChange={setOverviewRange}
          />

          <StatisticsDonut
            type={statisticsType}
            onTypeChange={setStatisticsType}
            items={statisticsItems}
            total={statisticsTotal}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Financial Summary
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Updated {lastUpdated || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
              title="Total Revenue"
              value={formatMoney(stats.totalRevenue)}
              subtitle="Orders + child panel revenue"
              icon={DollarSign}
            />

            <SnapshotCard
              title="Child Panel Revenue"
              value={formatMoney(stats.childPanelRevenue)}
              subtitle="Subscriptions and auto-renewals"
              icon={ShieldCheck}
            />

            <SnapshotCard
              title="Estimated Profit"
              value={formatMoney(estimatedProfit)}
              subtitle="Revenue minus expenses"
              icon={estimatedProfit >= 0 ? TrendingUp : TrendingDown}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <RecentOrdersTable orders={recentOrders} />
          <RecentDepositsTable deposits={recentDeposits} />
          <RecentUsersTable users={recentUsers} orders={orders} />
        </div>
      </div>
    </AdminLayout>
  );
}

function OverviewChart({
  points,
  metric,
  range,
  total,
  onMetricChange,
  onRangeChange,
}: {
  points: ChartPoint[];
  metric: OverviewMetric;
  range: RangeType;
  total: number;
  onMetricChange: (value: OverviewMetric) => void;
  onRangeChange: (value: RangeType) => void;
}) {
  const width = 760;
  const height = 250;

  const linePath = buildLinePath(points, width, height);
  const areaPath = buildAreaPath(points, width, height);
  const maxValue = Math.max(...points.map((item) => item.value), 1);

  const moneyMetrics: OverviewMetric[] = [
    "revenue",
    "grossProfit",
    "addFundAmount",
    "estimatedProfit",
  ];

  const isMoney = moneyMetrics.includes(metric);

  const yLabels = [1, 0.8, 0.6, 0.4, 0.2, 0].map((ratio) =>
    isMoney
      ? formatShortMoney(maxValue * ratio)
      : formatNumber(Math.round(maxValue * ratio)),
  );

  const activeMetric = overviewTabs.find((item) => item.value === metric)?.label;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {activeMetric} Overview
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Total: {isMoney ? formatMoney(total) : formatNumber(total)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {rangeTabs.map((item) => (
              <button
                key={item.value}
                onClick={() => onRangeChange(item.value)}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                  range === item.value
                    ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-green-200 hover:text-green-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {overviewTabs.map((item) => (
            <button
              key={item.value}
              onClick={() => onMetricChange(item.value)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                metric === item.value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="flex h-[280px] flex-col justify-between pt-2 text-xs font-black text-slate-400">
          {yLabels.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>

        <div className="relative h-[315px] flex-1 overflow-hidden rounded-2xl bg-gradient-to-b from-white to-slate-50">
          <div className="absolute inset-x-0 top-0 h-[250px]">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="absolute left-0 right-0 border-t border-slate-100"
                style={{ top: `${item * 25}%` }}
              />
            ))}

            <svg
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <path d={areaPath} fill="rgba(34, 197, 94, 0.12)" />

              <path
                d={linePath}
                fill="none"
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((point, index) => {
                const x =
                  points.length > 1 ? (index * width) / (points.length - 1) : 0;
                const y = height - (point.value / maxValue) * height;

                return (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#16a34a"
                    stroke="white"
                    strokeWidth="3"
                  />
                );
              })}
            </svg>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 grid gap-2 border-t border-slate-100 pt-4`}
            style={{
              gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
            }}
          >
            {points.map((point) => (
              <p
                key={point.label}
                className="text-center text-xs font-black text-slate-400"
              >
                {point.label}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatisticsDonut({
  type,
  onTypeChange,
  items,
  total,
}: {
  type: StatisticType;
  onTypeChange: (value: StatisticType) => void;
  items: DonutItem[];
  total: number;
}) {
  const donutGradient = buildDonutGradient(items, total);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-slate-950">Statistics</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          View breakdown by orders, tickets, payments, or users.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {statisticsTabs.map((item) => (
          <button
            key={item.value}
            onClick={() => onTypeChange(item.value)}
            className={`rounded-xl px-4 py-2 text-xs font-black transition ${
              type === item.value
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-7 grid gap-6 md:grid-cols-[250px_1fr] xl:grid-cols-1 2xl:grid-cols-[250px_1fr]">
        <div className="relative mx-auto flex h-[230px] w-[230px] items-center justify-center">
          <div
            className="h-[210px] w-[210px] rounded-full"
            style={{ background: donutGradient }}
          />

          <div className="absolute flex h-[128px] w-[128px] flex-col items-center justify-center rounded-full bg-white shadow-sm">
            <h3 className="text-3xl font-black text-slate-950">
              {formatNumber(total)}
            </h3>
            <p className="text-sm font-semibold text-slate-500">Total</p>
          </div>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const percent = total > 0 ? (item.value / total) * 100 : 0;

            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <p className="text-sm font-black text-slate-600">
                    {item.label}
                  </p>
                </div>

                <p className="text-sm font-black text-slate-950">
                  {formatNumber(item.value)}{" "}
                  <span className="text-slate-400">
                    ({percent.toFixed(1)}%)
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
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

function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
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

function RecentDepositsTable({ deposits }: { deposits: DepositRow[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h2 className="text-lg font-black text-slate-950">
          Recent Transactions
        </h2>

        <Link
          href="/admin/payments"
          className="text-sm font-black text-green-700"
        >
          View All
        </Link>
      </div>

      <div className="divide-y divide-slate-100">
        {deposits.length <= 0 ? (
          <EmptyState text="No recent transactions." />
        ) : (
          deposits.map((deposit) => (
            <div key={deposit.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {formatMoney(Number(deposit.amount || 0))}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {deposit.method || "Payment"} •{" "}
                    {formatDate(deposit.created_at)}
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

function RecentUsersTable({
  users,
  orders,
}: {
  users: UserRow[];
  orders: OrderRow[];
}) {
  function getUserDisplayName(user: UserRow) {
    return user.username || "User";
  }

  function getUserTotalOrders(userId: string) {
    return orders.filter((order) => order.user_id === userId).length;
  }

  function getUserRoleBadge(role?: string | null) {
    const clean = cleanStatus(role);

    if (clean === "super_admin") {
      return {
        label: "Developer",
        className: "bg-purple-50 text-purple-700 ring-purple-100",
      };
    }

    if (clean === "head_admin") {
      return {
        label: "Head Admin",
        className: "bg-red-50 text-red-700 ring-red-100",
      };
    }

    if (clean === "admin") {
      return {
        label: "Admin",
        className: "bg-blue-50 text-blue-700 ring-blue-100",
      };
    }

    return {
      label: "User",
      className: "bg-green-50 text-green-700 ring-green-100",
    };
  }

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
          users.map((user) => {
            const badge = getUserRoleBadge(user.role);
            const displayName = getUserDisplayName(user);
            const totalOrders = getUserTotalOrders(user.id);

            return (
              <div key={user.id} className="p-5 transition hover:bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-sm font-black text-green-700">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-sm font-black text-slate-950">
                        {displayName}
                      </p>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-4">
                      <p className="truncate text-xs font-semibold text-slate-400">
                        {formatNumber(totalOrders)} Total Orders
                      </p>

                      <p className="shrink-0 text-xs font-semibold text-slate-400">
                        {formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
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
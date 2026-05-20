"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Period = "day" | "week" | "month" | "year";
type ModalType = "orders" | "expenses" | "cashAccounts" | "pointConversions" | "commissions" | null;

type Order = {
  id: string;
  user_id?: string | null;
  service_name: string | null;
  quantity?: number | string | null;
  status: string | null;
  price: number | string | null;
  created_at: string;

  // Optional only. Do not require these columns from Supabase query.
  provider_cost?: number | string | null;
  profit?: number | string | null;
};

type Expense = {
  id: string;
  title: string | null;
  amount: number | string | null;
  category: string | null;
  expense_date: string;
};

type CashAccount = {
  id: string;
  name: string | null;
  balance: number | string | null;
  type: string | null;
  status: string | null;
};

type MockPointConversion = {
  id: string;
  user: string;
  points: number;
  amount: number;
  status: string;
  date: string;
};

type MockCommission = {
  id: string;
  user: string;
  source: string;
  amount: number;
  status: string;
  date: string;
};

const periodOptions: { label: string; value: Period }[] = [
  { label: "This Day", value: "day" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

const mockPointConversions: MockPointConversion[] = [
  { id: "RPC-001", user: "Juan Dela Cruz", points: 2000, amount: 200, status: "completed", date: "May 18, 2026" },
  { id: "RPC-002", user: "Maria Santos", points: 1500, amount: 150, status: "completed", date: "May 17, 2026" },
  { id: "RPC-003", user: "Mark Reyes", points: 3000, amount: 300, status: "pending", date: "May 16, 2026" },
];

const mockCommissions: MockCommission[] = [
  { id: "COM-001", user: "Juan Dela Cruz", source: "Referral Link", amount: 120, status: "paid", date: "May 18, 2026" },
  { id: "COM-002", user: "Maria Santos", source: "Referral Link", amount: 80.4, status: "pending", date: "May 17, 2026" },
  { id: "COM-003", user: "Mark Reyes", source: "Direct Referral", amount: 60, status: "pending", date: "May 16, 2026" },
];

function toNumber(value: number | string | null | undefined) {
  return Number(value || 0);
}

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortMoney(value: number) {
  if (Math.abs(value) >= 1000) return `₱${(value / 1000).toFixed(1)}K`;
  return `₱${value.toFixed(0)}`;
}

function normalizeStatus(status: string | null | undefined) {
  return String(status || "unknown").toLowerCase();
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getPeriodRange(period: Period) {
  const now = new Date();
  const start = new Date(now);

  if (period === "day") {
    return { start: startOfDay(now), end: endOfDay(now), label: "Today" };
  }

  if (period === "week") {
    const day = now.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setDate(now.getDate() - diffToMonday);
    return { start: startOfDay(start), end: endOfDay(now), label: "This Week" };
  }

  if (period === "month") {
    start.setDate(1);
    return { start: startOfDay(start), end: endOfDay(now), label: "This Month" };
  }

  start.setMonth(0, 1);
  return { start: startOfDay(start), end: endOfDay(now), label: "This Year" };
}

function isInsidePeriod(dateValue: string | null | undefined, period: Period) {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  const range = getPeriodRange(period);
  return date >= range.start && date <= range.end;
}

function getOrderProfit(order: Order) {
  const savedProfit = toNumber(order.profit);

  if (savedProfit !== 0) {
    return savedProfit;
  }

  const providerCost = toNumber(order.provider_cost);

  if (providerCost > 0) {
    return toNumber(order.price) - providerCost;
  }

  // Fallback while provider_cost/profit is not selected or not available.
  // This keeps order-related analytics syncing instead of breaking.
  return 0;
}

function getTrendBuckets(period: Period) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];

  if (period === "day") {
    for (let hour = 0; hour < 24; hour += 4) {
      const start = new Date(now);
      start.setHours(hour, 0, 0, 0);

      const end = new Date(now);
      end.setHours(hour + 3, 59, 59, 999);

      buckets.push({
        label: hour === 0 ? "12AM" : hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`,
        start,
        end,
      });
    }
    return buckets;
  }

  if (period === "week") {
    const range = getPeriodRange("week");
    for (let i = 0; i < 7; i++) {
      const day = new Date(range.start);
      day.setDate(range.start.getDate() + i);
      buckets.push({
        label: day.toLocaleDateString("en-US", { weekday: "short" }),
        start: startOfDay(day),
        end: endOfDay(day),
      });
    }
    return buckets;
  }

  if (period === "month") {
    const range = getPeriodRange("month");
    const totalDays = range.end.getDate();
    for (let day = 1; day <= totalDays; day++) {
      const current = new Date(range.start);
      current.setDate(day);
      buckets.push({ label: String(day), start: startOfDay(current), end: endOfDay(current) });
    }
    return buckets;
  }

  for (let month = 0; month < 12; month++) {
    const start = new Date(now.getFullYear(), month, 1);
    const end = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999);
    buckets.push({ label: start.toLocaleDateString("en-US", { month: "short" }), start, end });
  }

  return buckets;
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function IconMoney() {
  return <SvgIcon><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" /></SvgIcon>;
}

function IconChart() {
  return <SvgIcon><path d="M4 19V5" /><path d="M4 19h16" /><path d="m7 14 4-4 3 3 5-7" /></SvgIcon>;
}

function IconPie() {
  return <SvgIcon><path d="M21 12a9 9 0 1 1-9-9v9h9Z" /><path d="M12 3a9 9 0 0 1 9 9" /></SvgIcon>;
}

function IconPercent() {
  return <SvgIcon><path d="m19 5-14 14" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></SvgIcon>;
}

function IconCard() {
  return <SvgIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></SvgIcon>;
}

function IconReceipt() {
  return <SvgIcon><path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Z" /><path d="M9 7h6" /><path d="M9 11h6" /><path d="M9 15h4" /></SvgIcon>;
}

function IconClock() {
  return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></SvgIcon>;
}

function IconCheck() {
  return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></SvgIcon>;
}

function IconBank() {
  return <SvgIcon><path d="M4 10h16" /><path d="M6 10v8" /><path d="M10 10v8" /><path d="M14 10v8" /><path d="M18 10v8" /><path d="M3 18h18" /><path d="m12 3 8 5H4l8-5Z" /></SvgIcon>;
}

function IconRefresh() {
  return <SvgIcon><path d="M20 11a8.1 8.1 0 0 0-15.5-2" /><path d="M4 5v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2" /><path d="M20 19v-4h-4" /></SvgIcon>;
}

function IconUsers() {
  return <SvgIcon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></SvgIcon>;
}

function IconTimer() {
  return <SvgIcon><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></SvgIcon>;
}

function IconClose() {
  return <SvgIcon><path d="M18 6 6 18" /><path d="m6 6 12 12" /></SvgIcon>;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const value = normalizeStatus(status);

  const className =
    value === "completed" || value === "approved" || value === "paid" || value === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : value === "pending" || value === "processing" || value === "partial"
      ? "bg-orange-50 text-orange-700 ring-orange-100"
      : value === "cancelled" || value === "failed" || value === "rejected" || value === "inactive"
      ? "bg-red-50 text-red-700 ring-red-100"
      : "bg-slate-50 text-slate-700 ring-slate-100";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${className}`}>
      {value}
    </span>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  tone = "green",
  mock,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  icon: ReactNode;
  tone?: "green" | "blue" | "purple" | "orange" | "red" | "teal";
  mock?: boolean;
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
    teal: "bg-teal-50 text-teal-700",
  }[tone];

  const trendIsDown = trend?.includes("-") || trend?.includes("↓");

  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>

        {mock ? (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700 ring-1 ring-orange-100">Mock</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-black text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live
          </span>
        )}
      </div>

      <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <h3 className="mt-2 min-w-0 break-words text-2xl font-black tracking-tight text-slate-950">{value}</h3>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-500">{subtitle}</p>

      {trend && (
        <p className={`mt-4 text-xs font-black ${trendIsDown ? "text-red-600" : "text-emerald-600"}`}>
          {trend} <span className="text-slate-500">vs last 30 days</span>
        </p>
      )}
    </div>
  );
}

function AccountingLineChart({
  data,
}: {
  data: { label: string; revenue: number; grossProfit: number; netProfit: number; expenses: number }[];
}) {
  const width = 980;
  const height = 300;
  const paddingX = 44;
  const paddingY = 30;

  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.revenue, item.grossProfit, item.netProfit, item.expenses)));

  function getX(index: number) {
    if (data.length <= 1) return paddingX;
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  }

  function getY(value: number) {
    return height - paddingY - (value / maxValue) * (height - paddingY * 2);
  }

  function pathFor(key: "revenue" | "grossProfit" | "netProfit" | "expenses") {
    return data.map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(item[key])}`).join(" ");
  }

  const labelStep = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
      <div className="mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-black text-slate-950">Revenue, Profit & Expense Trend</h3>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-black text-slate-500">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Revenue</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Gross Profit</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" />Net Profit</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Expenses</span>
          </div>
        </div>

        <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">Accounting View</p>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[780px]">
          {[0, 1, 2, 3, 4].map((line) => {
            const y = paddingY + line * ((height - paddingY * 2) / 4);
            const value = maxValue - (line / 4) * maxValue;

            return (
              <g key={line}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="5 5" />
                <text x={8} y={y + 4} fontSize="12" fontWeight="700" fill="#64748b">{shortMoney(value)}</text>
              </g>
            );
          })}

          <path d={pathFor("revenue")} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathFor("grossProfit")} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathFor("netProfit")} fill="none" stroke="#9333ea" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathFor("expenses")} fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((item, index) => (
            <g key={`${item.label}-${index}`}>
              <circle cx={getX(index)} cy={getY(item.revenue)} r="4" fill="#16a34a" />
              <circle cx={getX(index)} cy={getY(item.grossProfit)} r="4" fill="#2563eb" />
              <circle cx={getX(index)} cy={getY(item.netProfit)} r="4" fill="#9333ea" />
              <circle cx={getX(index)} cy={getY(item.expenses)} r="4" fill="#ef4444" />

              {index % labelStep === 0 && (
                <text x={getX(index)} y={height - 5} textAnchor="middle" fontSize="12" fontWeight="700" fill="#64748b">{item.label}</text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function ProfitBreakdown({
  providerCost,
  grossProfit,
  expenses,
  netProfit,
}: {
  providerCost: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
}) {
  const safeNetProfit = Math.max(netProfit, 0);
  const total = Math.max(1, providerCost + grossProfit + expenses + safeNetProfit);

  const providerPercent = (providerCost / total) * 100;
  const grossPercent = (grossProfit / total) * 100;
  const expensesPercent = (expenses / total) * 100;
  const netPercent = (safeNetProfit / total) * 100;

  const p1 = providerPercent;
  const p2 = providerPercent + grossPercent;
  const p3 = providerPercent + grossPercent + expensesPercent;

  const donutStyle = {
    background: `conic-gradient(#ef4444 0% ${p1}%, #2563eb ${p1}% ${p2}%, #f59e0b ${p2}% ${p3}%, #16a34a ${p3}% 100%)`,
  };

  const items = [
    { label: "Provider Cost", value: providerCost, percent: providerPercent, dot: "bg-red-500" },
    { label: "Gross Profit", value: grossProfit, percent: grossPercent, dot: "bg-blue-500" },
    { label: "Expenses", value: expenses, percent: expensesPercent, dot: "bg-orange-500" },
    { label: "Net Profit", value: netProfit, percent: netPercent, dot: "bg-emerald-500" },
  ];

  return (
    <div className="min-w-0 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h3 className="text-xl font-black text-slate-950">Profit Breakdown</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">Provider cost, profit, expenses, and net profit.</p>
      </div>

      <div className="grid gap-5">
        <div className="flex justify-center">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full" style={donutStyle}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <p className="text-base font-black text-slate-950">{money(netProfit)}</p>
              <p className="text-[11px] font-black text-slate-500">Net Profit</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                <span className="font-black text-slate-700">{item.label}</span>
              </div>

              <div className="text-right">
                <p className="font-black text-slate-950">{money(item.value)}</p>
                <p className="text-[11px] font-bold text-slate-500">{item.percent.toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableShell({
  title,
  children,
  onViewAll,
  mock,
}: {
  title: string;
  children: ReactNode;
  onViewAll?: () => void;
  mock?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="min-w-0 truncate text-lg font-black text-slate-950">{title}</h3>
          {mock && (
            <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700 ring-1 ring-orange-100">Mock</span>
          )}
        </div>

        {onViewAll && (
          <button onClick={onViewAll} className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto">
            View All
          </button>
        )}
      </div>

      {children}
    </div>
  );
}

function DataModal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div>
            <h3 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>

          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:bg-slate-50" aria-label="Close modal">
            <IconClose />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  async function loadData() {
    setLoading(true);
    setMessage("");

const { data: orderData, error: orderError } = await supabase
  .from("orders")
  .select("id, user_id, service_name, quantity, status, price, created_at")
  .order("created_at", { ascending: false });

    if (orderError) {
      setMessage(orderError.message);
      setLoading(false);
      return;
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (expenseError) {
      setMessage(expenseError.message);
      setLoading(false);
      return;
    }

    const { data: cashData, error: cashError } = await supabase
      .from("cash_accounts")
      .select("id, name, balance, type, status")
      .order("name");

    if (cashError) {
      setMessage(cashError.message);
      setLoading(false);
      return;
    }

    setOrders((orderData || []) as Order[]);
    setExpenses((expenseData || []) as Expense[]);
    setCashAccounts((cashData || []) as CashAccount[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const range = getPeriodRange(period);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => isInsidePeriod(order.created_at, period));
  }, [orders, period]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => isInsidePeriod(expense.expense_date, period));
  }, [expenses, period]);

  const totalBusinessMoney = cashAccounts.reduce((sum, account) => sum + toNumber(account.balance), 0);
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + toNumber(order.price), 0);
const totalProviderCost = filteredOrders.reduce(
  (sum, order) => sum + toNumber(order.provider_cost),
  0
);
  const grossProfit = filteredOrders.reduce((sum, order) => sum + getOrderProfit(order), 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const estimatedProfitFrom30PercentMargin = totalRevenue * 0.3;

const completedOrders = filteredOrders.filter(
  (order) => normalizeStatus(order.status) === "completed"
).length;

const activeOrders = filteredOrders.filter((order) =>
  ["pending", "processing", "partial"].includes(normalizeStatus(order.status))
).length;

  const totalPointConversions = mockPointConversions.reduce((sum, item) => sum + item.amount, 0);
  const totalCommissions = mockCommissions.reduce((sum, item) => sum + item.amount, 0);
  const pendingPayouts = mockCommissions.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amount, 0);

  const chartData = useMemo(() => {
    const buckets = getTrendBuckets(period);

    return buckets.map((bucket) => {
      const bucketOrders = filteredOrders.filter((order) => {
        const date = new Date(order.created_at);
        return date >= bucket.start && date <= bucket.end;
      });

      const bucketExpenses = filteredExpenses.filter((expense) => {
        const date = new Date(expense.expense_date);
        return date >= bucket.start && date <= bucket.end;
      });

      const revenue = bucketOrders.reduce((sum, order) => sum + toNumber(order.price), 0);
      const profit = bucketOrders.reduce((sum, order) => sum + getOrderProfit(order), 0);
      const expensesTotal = bucketExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);

      return {
        label: bucket.label,
        revenue,
        grossProfit: profit,
        netProfit: profit - expensesTotal,
        expenses: expensesTotal,
      };
    });
  }, [filteredOrders, filteredExpenses, period]);

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0">
            <div className="mb-6 flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Accounting Reports
                  </span>

                  {loading && (
                    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                      Loading live data...
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
  Analytics / Reports
</h1>

              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-3">
                <div className="flex w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm sm:w-auto">
                  {periodOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPeriod(option.value)}
                      className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black transition ${
                        period === option.value ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button onClick={loadData} className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto">
                  Refresh
                </button>

                <button className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-auto">
                  Export
                </button>
              </div>
            </div>

            {message && (
              <div className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/40 px-5 py-4 text-sm font-bold text-red-300">
                {message}
              </div>
            )}

            <div className="mb-6 min-w-0 rounded-[24px] border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 p-5">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Selected Period</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">{range.label}</h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Live parts use your current tables. Mock parts are marked and ready for later connection.
                </p>
              </div>
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Order Revenue" value={money(totalRevenue)} subtitle="Total paid order amount" trend="↑ 18.6%" icon={<IconMoney />} tone="green" />
              <MetricCard title="Gross Profit" value={money(grossProfit)} subtitle="Revenue minus provider cost" trend="↑ 15.2%" icon={<IconChart />} tone="blue" />
              <MetricCard title="Net Profit" value={money(netProfit)} subtitle="Gross profit minus expenses" trend={netProfit >= 0 ? "↑ 12.8%" : "↓ 5.4%"} icon={<IconPie />} tone="purple" />
              <MetricCard title="Estimated Profit 30%" value={money(estimatedProfitFrom30PercentMargin)} subtitle="Estimated based on 30% margin" trend="↑ 18.6%" icon={<IconPercent />} tone="orange" />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Total Expenses" value={money(totalExpenses)} subtitle="All business expenses" trend="↓ 5.4%" icon={<IconCard />} tone="red" />
              <MetricCard title="Total Orders" value={String(filteredOrders.length)} subtitle="All orders in selected period" trend="↑ 11.3%" icon={<IconReceipt />} tone="blue" />
              <MetricCard title="Active Orders" value={String(activeOrders)} subtitle="Pending / Processing / Partial" trend="↓ 3.2%" icon={<IconClock />} tone="orange" />
              <MetricCard title="Completed Orders" value={String(completedOrders)} subtitle="Completed orders" trend="↑ 14.6%" icon={<IconCheck />} tone="green" />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard title="Cash Accounts" value={money(totalBusinessMoney)} subtitle="Total balance in all accounts" icon={<IconBank />} tone="teal" />
              <MetricCard title="Reseller Point Conversions" value={money(totalPointConversions)} subtitle="Total amount converted" trend="↑ 9.5%" icon={<IconRefresh />} tone="purple" mock />
              <MetricCard title="Total User Commissions" value={money(totalCommissions)} subtitle="Total commissions of all users" trend="↑ 8.3%" icon={<IconUsers />} tone="orange" mock />
              <MetricCard title="Pending Payouts" value={money(pendingPayouts)} subtitle="Unpaid commissions" icon={<IconTimer />} tone="red" mock />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
              <AccountingLineChart data={chartData} />
              <ProfitBreakdown providerCost={totalProviderCost} grossProfit={grossProfit} expenses={totalExpenses} netProfit={netProfit} />
            </div>

            <div className="mb-6 grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
              <TableShell title="Recent Orders" onViewAll={() => setActiveModal("orders")}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Order ID</th>
                        <th className="px-5 py-4 text-left">Service</th>
                        <th className="px-5 py-4 text-left">Revenue</th>
                        <th className="px-5 py-4 text-left">Profit</th>
                        <th className="px-5 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.slice(0, 4).map((order) => (
                        <tr key={order.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-black text-slate-600">#{order.id.slice(0, 6)}</td>
                          <td className="max-w-[240px] px-5 py-4"><p className="truncate font-bold text-slate-700">{order.service_name || "Unknown Service"}</p></td>
                          <td className="px-5 py-4 font-black text-emerald-600">{money(toNumber(order.price))}</td>
                          <td className="px-5 py-4 font-black text-blue-600">{money(getOrderProfit(order))}</td>
                          <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                        </tr>
                      ))}
                      {filteredOrders.length <= 0 && <tr><td colSpan={5} className="px-5 py-12 text-center font-semibold text-slate-500">No orders available for this period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </TableShell>

              <TableShell title="Recent Expenses" onViewAll={() => setActiveModal("expenses")}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Title</th>
                        <th className="px-5 py-4 text-left">Category</th>
                        <th className="px-5 py-4 text-left">Amount</th>
                        <th className="px-5 py-4 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.slice(0, 4).map((expense) => (
                        <tr key={expense.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-700">{expense.title || "Expense"}</td>
                          <td className="px-5 py-4 font-semibold capitalize text-slate-500">{expense.category || "General"}</td>
                          <td className="px-5 py-4 font-black text-red-600">{money(toNumber(expense.amount))}</td>
                          <td className="px-5 py-4 font-semibold text-slate-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {filteredExpenses.length <= 0 && <tr><td colSpan={4} className="px-5 py-12 text-center font-semibold text-slate-500">No expenses available for this period.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </TableShell>

              <TableShell title="Cash Accounts" onViewAll={() => setActiveModal("cashAccounts")}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Account Name</th>
                        <th className="px-5 py-4 text-left">Type</th>
                        <th className="px-5 py-4 text-left">Balance</th>
                        <th className="px-5 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashAccounts.slice(0, 4).map((account) => (
                        <tr key={account.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-700">{account.name || "Cash Account"}</td>
                          <td className="px-5 py-4 font-semibold capitalize text-slate-500">{account.type || "Account"}</td>
                          <td className="px-5 py-4 font-black text-emerald-600">{money(toNumber(account.balance))}</td>
                          <td className="px-5 py-4"><StatusBadge status={account.status || "active"} /></td>
                        </tr>
                      ))}
                      {cashAccounts.length <= 0 && <tr><td colSpan={4} className="px-5 py-12 text-center font-semibold text-slate-500">No cash accounts yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </TableShell>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
              <TableShell title="Reseller Point Conversions" onViewAll={() => setActiveModal("pointConversions")} mock>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">User</th>
                        <th className="px-5 py-4 text-left">Points Converted</th>
                        <th className="px-5 py-4 text-left">Amount Added</th>
                        <th className="px-5 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockPointConversions.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-700">{item.user}</td>
                          <td className="px-5 py-4 font-black text-purple-600">{item.points.toLocaleString()}</td>
                          <td className="px-5 py-4 font-black text-emerald-600">{money(item.amount)}</td>
                          <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TableShell>

              <TableShell title="User Commissions" onViewAll={() => setActiveModal("commissions")} mock>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">User</th>
                        <th className="px-5 py-4 text-left">Source / Referral</th>
                        <th className="px-5 py-4 text-left">Commission Amount</th>
                        <th className="px-5 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCommissions.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-4 font-bold text-slate-700">{item.user}</td>
                          <td className="px-5 py-4 font-semibold text-slate-500">{item.source}</td>
                          <td className="px-5 py-4 font-black text-orange-600">{money(item.amount)}</td>
                          <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TableShell>
            </div>
        </div>

        <DataModal open={activeModal === "orders"} onClose={() => setActiveModal(null)} title="All Recent Orders" subtitle="Full order accounting report for the selected period.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Order ID</th>
                  <th className="px-5 py-4 text-left">Service</th>
                  <th className="px-5 py-4 text-left">Revenue</th>
                  <th className="px-5 py-4 text-left">Provider Cost</th>
                  <th className="px-5 py-4 text-left">Profit</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-black text-slate-600">#{order.id.slice(0, 8)}</td>
                    <td className="max-w-[320px] px-5 py-4 font-bold text-slate-700">{order.service_name || "Unknown Service"}</td>
                    <td className="px-5 py-4 font-black text-emerald-600">{money(toNumber(order.price))}</td>
                    <td className="px-5 py-4 font-black text-red-500">{money(toNumber(order.provider_cost))}</td>
                    <td className="px-5 py-4 font-black text-blue-600">{money(getOrderProfit(order))}</td>
                    <td className="px-5 py-4"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataModal>

        <DataModal open={activeModal === "expenses"} onClose={() => setActiveModal(null)} title="All Recent Expenses" subtitle="Full expense report for the selected period.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Title</th>
                  <th className="px-5 py-4 text-left">Category</th>
                  <th className="px-5 py-4 text-left">Amount</th>
                  <th className="px-5 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-bold text-slate-700">{expense.title || "Expense"}</td>
                    <td className="px-5 py-4 font-semibold capitalize text-slate-500">{expense.category || "General"}</td>
                    <td className="px-5 py-4 font-black text-red-600">{money(toNumber(expense.amount))}</td>
                    <td className="px-5 py-4 font-semibold text-slate-500">{new Date(expense.expense_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataModal>

        <DataModal open={activeModal === "cashAccounts"} onClose={() => setActiveModal(null)} title="All Cash Accounts" subtitle="Complete cash account balance report.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Account Name</th>
                  <th className="px-5 py-4 text-left">Type</th>
                  <th className="px-5 py-4 text-left">Balance</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {cashAccounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-bold text-slate-700">{account.name || "Cash Account"}</td>
                    <td className="px-5 py-4 font-semibold capitalize text-slate-500">{account.type || "Account"}</td>
                    <td className="px-5 py-4 font-black text-emerald-600">{money(toNumber(account.balance))}</td>
                    <td className="px-5 py-4"><StatusBadge status={account.status || "active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataModal>

        <DataModal open={activeModal === "pointConversions"} onClose={() => setActiveModal(null)} title="Reseller Point Conversions" subtitle="Mock table for now. We will connect this later to your Supabase reseller conversion records.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">User</th>
                  <th className="px-5 py-4 text-left">Points Converted</th>
                  <th className="px-5 py-4 text-left">Amount Added</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockPointConversions.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-bold text-slate-700">{item.user}</td>
                    <td className="px-5 py-4 font-black text-purple-600">{item.points.toLocaleString()}</td>
                    <td className="px-5 py-4 font-black text-emerald-600">{money(item.amount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-500">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataModal>

        <DataModal open={activeModal === "commissions"} onClose={() => setActiveModal(null)} title="User Commissions" subtitle="Mock table for now. We will connect this later to your affiliate commission records.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">User</th>
                  <th className="px-5 py-4 text-left">Source / Referral</th>
                  <th className="px-5 py-4 text-left">Commission Amount</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockCommissions.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-5 py-4 font-bold text-slate-700">{item.user}</td>
                    <td className="px-5 py-4 font-semibold text-slate-500">{item.source}</td>
                    <td className="px-5 py-4 font-black text-orange-600">{money(item.amount)}</td>
                    <td className="px-5 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-500">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataModal>
      </AdminLayout>
    </AdminGuard>
  );
}

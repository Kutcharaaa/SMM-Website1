"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import {
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  Filter,
  MoreVertical,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency?: string | null;
  note: string | null;
  cash_account_id: string | null;
  expense_date: string;
  created_at: string;
  created_by?: string | null;
};

type CashAccount = {
  id: string;
  name: string;
  balance: number;
  type?: string | null;
  status?: string | null;
};

type Period = "all" | "today" | "week" | "month" | "year";

const EXPENSE_CATEGORIES = [
  { value: "provider", label: "Provider/API Cost", tone: "violet" },
  { value: "ads", label: "Ads & Marketing", tone: "pink" },
  { value: "subscription", label: "Subscriptions", tone: "blue" },
  { value: "salary", label: "Staff / Salary", tone: "emerald" },
  { value: "domain", label: "Domain & Hosting", tone: "orange" },
  { value: "refund", label: "Refund / Adjustment", tone: "amber" },
  { value: "office", label: "Office Expense", tone: "cyan" },
  { value: "tools", label: "Development Tools", tone: "indigo" },
  { value: "fees", label: "Bank / Transfer Fees", tone: "rose" },
  { value: "general", label: "Other", tone: "slate" },
] as const;

function toNumber(value: number | string | null | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number | string | null | undefined) {
  return `₱${toNumber(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeCategory(category?: string | null) {
  const clean = String(category || "general").toLowerCase().trim();

  if (["provider", "provider/api", "provider/api cost", "api", "provider balance"].includes(clean)) return "provider";
  if (["ads", "marketing", "ads & marketing", "ad"].includes(clean)) return "ads";
  if (["subscription", "subscriptions", "software"].includes(clean)) return "subscription";
  if (["salary", "staff", "staff / salary", "payroll"].includes(clean)) return "salary";
  if (["domain", "hosting", "domain & hosting"].includes(clean)) return "domain";
  if (["refund", "adjustment", "refund / adjustment"].includes(clean)) return "refund";
  if (["office", "office expense"].includes(clean)) return "office";
  if (["tools", "development", "development tools", "design"].includes(clean)) return "tools";
  if (["fees", "bank", "bank / transfer fees", "transfer fees"].includes(clean)) return "fees";

  return "general";
}

function getCategoryMeta(category?: string | null) {
  const normalized = normalizeCategory(category);
  return EXPENSE_CATEGORIES.find((item) => item.value === normalized) || EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

function getCategoryLabel(category?: string | null) {
  return getCategoryMeta(category).label;
}

function getCategoryBadgeClass(category?: string | null) {
  const tone = getCategoryMeta(category).tone;

  const classes: Record<string, string> = {
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    pink: "bg-pink-50 text-pink-700 ring-pink-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return classes[tone] || classes.slate;
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function isInsidePeriod(dateValue: string, period: Period) {
  if (period === "all") return true;

  const date = new Date(dateValue);
  const now = new Date();

  if (period === "today") {
    return date >= startOfDay(now) && date <= endOfDay(now);
  }

  if (period === "week") {
    const start = startOfDay(now);
    start.setDate(now.getDate() - 6);
    return date >= start && date <= endOfDay(now);
  }

  if (period === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }

  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  return true;
}

function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-PH", { month: "short" });
}

function getCashAccountDisplay(account?: CashAccount) {
  if (!account) return "Unknown account";
  return `${account.name} — ${formatMoney(account.balance)}`;
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  tone: "blue" | "emerald" | "orange" | "violet" | "pink" | "cyan";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    pink: "bg-pink-50 text-pink-700 ring-pink-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
        <Receipt size={25} />
      </div>
      <h4 className="mt-4 text-lg font-black text-slate-950">{title}</h4>
      <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("provider");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cashAccountFilter, setCashAccountFilter] = useState("all");

  async function loadExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setExpenses((data || []) as Expense[]);
  }

  async function loadCashAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("id, name, balance, type, status")
      .eq("status", "active")
      .order("name");

    if (error) {
      setMessage(error.message);
      return;
    }

    setCashAccounts((data || []) as CashAccount[]);
  }

  async function loadData() {
    setLoading(true);
    setMessage("");
    await Promise.all([loadExpenses(), loadCashAccounts()]);
    setLoading(false);
  }

  useEffect(() => {
    setExpenseDate(new Date().toISOString().slice(0, 10));
    loadData();
  }, []);

  const filteredExpenses = useMemo(() => {
    const query = search.toLowerCase().trim();

    return expenses.filter((expense) => {
      const matchesPeriod = isInsidePeriod(expense.expense_date || expense.created_at, period);
      const normalizedCategory = normalizeCategory(expense.category);
      const matchesCategory = categoryFilter === "all" || normalizedCategory === categoryFilter;
      const matchesCashAccount = cashAccountFilter === "all" || expense.cash_account_id === cashAccountFilter;
      const cashAccountName = cashAccounts.find((account) => account.id === expense.cash_account_id)?.name || "";
      const matchesSearch =
        !query ||
        String(expense.title || "").toLowerCase().includes(query) ||
        String(expense.note || "").toLowerCase().includes(query) ||
        String(expense.category || "").toLowerCase().includes(query) ||
        cashAccountName.toLowerCase().includes(query);

      return matchesPeriod && matchesCategory && matchesCashAccount && matchesSearch;
    });
  }, [cashAccountFilter, cashAccounts, categoryFilter, expenses, period, search]);

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const allTimeExpenses = expenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const todayExpenses = expenses
    .filter((expense) => isInsidePeriod(expense.expense_date || expense.created_at, "today"))
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const monthExpenses = expenses
    .filter((expense) => isInsidePeriod(expense.expense_date || expense.created_at, "month"))
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const providerCosts = filteredExpenses
    .filter((expense) => normalizeCategory(expense.category) === "provider")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const subscriptionCosts = filteredExpenses
    .filter((expense) => normalizeCategory(expense.category) === "subscription")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const usedCashAccounts = new Set(filteredExpenses.map((expense) => expense.cash_account_id).filter(Boolean)).size;

  const categoryBreakdown = useMemo(() => {
    return EXPENSE_CATEGORIES.map((categoryItem) => {
      const amount = filteredExpenses
        .filter((expense) => normalizeCategory(expense.category) === categoryItem.value)
        .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

      return {
        ...categoryItem,
        amount,
        percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    }).filter((item) => item.amount > 0);
  }, [filteredExpenses, totalExpenses]);

  const chartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentYear = now.getFullYear();

    return months.map((month, index) => {
      const amountForMonth = expenses
        .filter((expense) => {
          const date = new Date(expense.expense_date || expense.created_at);
          return date.getFullYear() === currentYear && date.getMonth() === index;
        })
        .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

      return {
        label: month,
        amount: amountForMonth,
      };
    });
  }, [expenses]);

  const maxChartValue = Math.max(1, ...chartData.map((item) => item.amount));
  const topCategory = categoryBreakdown[0]
    ? [...categoryBreakdown].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const mostUsedCashAccount = useMemo(() => {
    const usage = cashAccounts.map((account) => {
      const amountUsed = filteredExpenses
        .filter((expense) => expense.cash_account_id === account.id)
        .reduce((sum, expense) => sum + toNumber(expense.amount), 0);

      return {
        account,
        amountUsed,
      };
    });

    return usage.sort((a, b) => b.amountUsed - a.amountUsed)[0] || null;
  }, [cashAccounts, filteredExpenses]);

  function getCashAccountName(id: string | null) {
    if (!id) return "Not selected";
    return cashAccounts.find((account) => account.id === id)?.name || "Unknown account";
  }

  function resetForm() {
    setTitle("");
    setCategory("provider");
    setAmount("");
    setNote("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setCashAccountId("");
  }

  function openAddModal() {
    setMessage("");
    resetForm();
    setAddModalOpen(true);
  }

  async function addExpense() {
    if (saving) return;

    setMessage("");

    if (!title.trim()) {
      setMessage("Please enter an expense title.");
      return;
    }

    const expenseAmount = Number(amount || 0);

    if (!Number.isFinite(expenseAmount) || expenseAmount <= 0) {
      setMessage("Amount must be greater than 0.");
      return;
    }

    if (!cashAccountId) {
      setMessage("Please select which cash account paid this expense.");
      return;
    }

    const selectedCashAccount = cashAccounts.find((account) => account.id === cashAccountId);

    if (!selectedCashAccount) {
      setMessage("Selected cash account not found.");
      return;
    }

    const currentBalance = toNumber(selectedCashAccount.balance);

    if (currentBalance < expenseAmount) {
      setMessage("Not enough balance in selected cash account.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    try {
      const { data: createdExpense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          title: title.trim(),
          category,
          amount: Number(expenseAmount.toFixed(2)),
          currency: "PHP",
          note: note.trim() || null,
          cash_account_id: cashAccountId,
          expense_date: expenseDate || new Date().toISOString().slice(0, 10),
          created_by: user?.id,
        })
        .select()
        .single();

      if (expenseError || !createdExpense) {
        setMessage(expenseError?.message || "Failed to add expense.");
        setSaving(false);
        return;
      }

      const newBalance = Number((currentBalance - expenseAmount).toFixed(2));

      const { error: cashError } = await supabase
        .from("cash_accounts")
        .update({
          balance: newBalance,
        })
        .eq("id", cashAccountId);

      if (cashError) {
        setMessage(cashError.message);
        setSaving(false);
        return;
      }

      await supabase.from("cash_movements").insert({
        cash_account_id: cashAccountId,
        type: "expense",
        amount: -expenseAmount,
        description: `Expense: ${title.trim()}`,
        reference_type: "expense",
        reference_id: createdExpense.id,
        created_by: user?.id,
      });

      setMessage("Expense added and cash account balance deducted.");
      setAddModalOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("ADD_EXPENSE_ERROR:", error);
      setMessage("Failed to add expense.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(expense: Expense) {
    const confirmDelete = confirm(
      "Void/delete this expense? This will NOT automatically return the money to the cash account."
    );

    if (!confirmDelete) return;

    const { error } = await supabase.from("expenses").delete().eq("id", expense.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Expense deleted. Cash account balance was not returned automatically.");
    await loadExpenses();
  }

  function exportCSV() {
    const headers = ["Date", "Title", "Category", "Cash Account", "Amount", "Note", "Created At"];
    const rows = filteredExpenses.map((expense) => [
      expense.expense_date,
      expense.title,
      getCategoryLabel(expense.category),
      getCashAccountName(expense.cash_account_id),
      toNumber(expense.amount).toFixed(2),
      expense.note || "",
      expense.created_at,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    downloadTextFile(`ascend-expenses-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  }

  function exportPDF() {
    window.print();
  }

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <main className="min-h-screen bg-[#f6f8fb] text-slate-950 print:bg-white">
        <AdminSidebar />

        <section className="min-h-screen lg:ml-72">
          <AdminTopbar />

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                  <Receipt size={15} />
                  Expense Accounting
                </div>

                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Expenses</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                  Track operational costs, provider costs, subscriptions, staff, and business expenses.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Add Expense
                </button>

                <button
                  type="button"
                  onClick={exportPDF}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Printer size={17} />
                  Export PDF
                </button>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Download size={17} />
                  Export CSV
                </button>
              </div>
            </div>

            {message && (
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
                {message}
              </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard title="Total Expenses" value={formatMoney(allTimeExpenses)} subtitle="All-time recorded" icon={<Wallet size={22} />} tone="blue" />
              <StatCard title="This Month" value={formatMoney(monthExpenses)} subtitle="Current month" icon={<CalendarDays size={22} />} tone="emerald" />
              <StatCard title="Today" value={formatMoney(todayExpenses)} subtitle="Today's expenses" icon={<Clock3 size={22} />} tone="orange" />
              <StatCard title="Provider/API" value={formatMoney(providerCosts)} subtitle="Filtered period" icon={<BarChart3 size={22} />} tone="violet" />
              <StatCard title="Subscriptions" value={formatMoney(subscriptionCosts)} subtitle="Filtered period" icon={<CreditCard size={22} />} tone="pink" />
              <StatCard title="Cash Accounts" value={String(usedCashAccounts)} subtitle="Used in period" icon={<Banknote size={22} />} tone="cyan" />
            </div>

            <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">Expenses Overview</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Monthly expense trend for the current year.</p>
                  </div>

                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    {(["today", "week", "month", "year"] as Period[]).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPeriod(item)}
                        className={`rounded-xl px-3 py-2 text-xs font-black capitalize transition ${
                          period === item ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        {item === "today" ? "Today" : item === "week" ? "Week" : item === "month" ? "Month" : "Year"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex h-72 items-end gap-2 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 sm:gap-3">
                  {chartData.map((item) => {
                    const height = Math.max(8, (item.amount / maxChartValue) * 100);

                    return (
                      <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <div className="flex w-full items-end justify-center">
                          <div
                            title={`${item.label}: ${formatMoney(item.amount)}`}
                            className="w-full max-w-9 rounded-t-xl bg-blue-600/80 transition hover:bg-blue-700"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-black text-slate-950">Expenses by Category</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Breakdown for the selected filters.</p>

                <div className="mt-6 space-y-4">
                  {categoryBreakdown.length <= 0 ? (
                    <EmptyState title="No category data" subtitle="Add expenses or adjust the filters to see breakdown data." />
                  ) : (
                    categoryBreakdown
                      .sort((a, b) => b.amount - a.amount)
                      .map((item) => (
                        <div key={item.value}>
                          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                            <span className="font-black text-slate-700">{item.label}</span>
                            <span className="font-black text-slate-950">{formatMoney(item.amount)}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, item.percent)}%` }} />
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{item.percent.toFixed(1)}% of selected expenses</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">Expense Records</h2>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Showing {filteredExpenses.length} of {expenses.length} expenses.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadData}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                      Refresh
                    </button>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_220px_170px]">
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4">
                      <Search size={17} className="text-slate-400" />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search expenses..."
                        className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black text-slate-700 outline-none"
                      >
                        <option value="all">All Categories</option>
                        {EXPENSE_CATEGORIES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-slate-400" />
                    </div>

                    <div className="relative">
                      <select
                        value={cashAccountFilter}
                        onChange={(event) => setCashAccountFilter(event.target.value)}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black text-slate-700 outline-none"
                      >
                        <option value="all">All Cash Accounts</option>
                        {cashAccounts.map((account) => (
                          <option key={account.id} value={account.id}>{account.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-4 text-slate-400" />
                    </div>

                    <div className="relative">
                      <select
                        value={period}
                        onChange={(event) => setPeriod(event.target.value as Period)}
                        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-black text-slate-700 outline-none"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                      </select>
                      <Filter size={16} className="pointer-events-none absolute right-4 top-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="p-4 text-left font-black">Date</th>
                        <th className="p-4 text-left font-black">Title</th>
                        <th className="p-4 text-left font-black">Category</th>
                        <th className="p-4 text-left font-black">Cash Account</th>
                        <th className="p-4 text-left font-black">Amount</th>
                        <th className="p-4 text-left font-black">Note</th>
                        <th className="p-4 text-left font-black">Status</th>
                        <th className="p-4 text-left font-black">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredExpenses.length <= 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10">
                            <EmptyState title="No expenses found" subtitle="Try changing the filters or add your first expense." />
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <tr key={expense.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                            <td className="p-4 font-semibold text-slate-500">{formatDate(expense.expense_date)}</td>
                            <td className="max-w-[240px] p-4 font-black text-slate-800">
                              <p className="truncate">{expense.title}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">Created {formatDateTime(expense.created_at)}</p>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getCategoryBadgeClass(expense.category)}`}>
                                {getCategoryLabel(expense.category)}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-blue-700">{getCashAccountName(expense.cash_account_id)}</td>
                            <td className="p-4 font-black text-red-600">-{formatMoney(expense.amount)}</td>
                            <td className="max-w-[240px] p-4 text-slate-500">
                              <p className="truncate font-semibold">{expense.note || "—"}</p>
                            </td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                                <CheckCircle2 size={13} />
                                Paid
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedExpense(expense)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100"
                                  title="View"
                                >
                                  <Eye size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteExpense(expense)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Insights</h3>

                  <div className="mt-5 space-y-5">
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950">Expense Health</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {monthExpenses > 0 ? "Tracking active expenses this month." : "No expenses recorded this month."}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
                        <TrendingDown size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950">Top Category</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {topCategory ? `${topCategory.label} · ${formatMoney(topCategory.amount)}` : "No category yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                        <Banknote size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950">Most Used Cash Account</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {mostUsedCashAccount?.amountUsed
                            ? `${mostUsedCashAccount.account.name} · ${formatMoney(mostUsedCashAccount.amountUsed)}`
                            : "No usage yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-950">Last Expense Added</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {expenses[0] ? `${expenses[0].title} · ${formatMoney(expenses[0].amount)}` : "No expense yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">Tips</h3>
                  <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-500">
                    <li>• Review expenses weekly to keep reports accurate.</li>
                    <li>• Use categories consistently for clean analytics.</li>
                    <li>• Export CSV/PDF for monthly accounting records.</li>
                    <li>• Avoid deleting old expenses unless it was a mistake.</li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {addModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-6 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">New Expense</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">Add Expense</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    This will deduct the amount from the selected cash account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={saving}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-4 p-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-black text-slate-700">Expense Title</label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Example: Provider balance top-up"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Amount</label>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0"
                    placeholder="0.00"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Expense Date</label>
                  <input
                    value={expenseDate}
                    onChange={(event) => setExpenseDate(event.target.value)}
                    type="date"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  >
                    {EXPENSE_CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Paid From Cash Account</label>
                  <select
                    value={cashAccountId}
                    onChange={(event) => setCashAccountId(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  >
                    <option value="">Select cash account</option>
                    {cashAccounts.map((account) => (
                      <option key={account.id} value={account.id}>{getCashAccountDisplay(account)}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-black text-slate-700">Note</label>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Optional note or payment details"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  />
                </div>

                <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                  Saving this expense will deduct the amount from the selected cash account and create a cash movement record.
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={addExpense}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={17} className="animate-spin" /> : <Plus size={17} />}
                  {saving ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedExpense && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-6 w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-blue-600">Expense Details</p>
                  <h3 className="mt-1 text-2xl font-black text-slate-950">{selectedExpense.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">Recorded {formatDateTime(selectedExpense.created_at)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm font-bold text-slate-500">Amount</p>
                  <h4 className="mt-1 text-4xl font-black text-red-600">-{formatMoney(selectedExpense.amount)}</h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Category</p>
                    <p className="mt-2 font-black text-slate-800">{getCategoryLabel(selectedExpense.category)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Cash Account</p>
                    <p className="mt-2 font-black text-slate-800">{getCashAccountName(selectedExpense.cash_account_id)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Expense Date</p>
                    <p className="mt-2 font-black text-slate-800">{formatDate(selectedExpense.expense_date)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Status</p>
                    <p className="mt-2 font-black text-emerald-700">Paid</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">Note</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{selectedExpense.note || "No note provided."}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </AdminGuard>
  );
}

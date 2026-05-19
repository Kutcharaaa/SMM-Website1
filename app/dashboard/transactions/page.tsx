"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Crown,
  Download,
  Eye,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type WalletTransaction = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  wallet_credit?: number | null;
  currency?: string | null;
  method?: string | null;
  reference_number?: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  balance: number | string | null;
};

type TransactionItem = {
  id: string;
  source: "wallet_transactions" | "deposits";
  type: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
};

type TypeFilter =
  | "all"
  | "add_funds"
  | "child_panel_subscription"
  | "child_panel_auto_renew"
  | "point_conversion"
  | "refund"
  | "manual_adjustment"
  | "other";

type StatusFilter = "all" | "completed" | "pending" | "failed" | "refunded";

const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: "All Types", value: "all" },
  { label: "Add Funds", value: "add_funds" },
  { label: "Child Panel Subscription", value: "child_panel_subscription" },
  { label: "Child Panel Auto Renew", value: "child_panel_auto_renew" },
  { label: "Point Conversion", value: "point_conversion" },
  { label: "Refund", value: "refund" },
  { label: "Manual Adjustment", value: "manual_adjustment" },
  { label: "Other", value: "other" },
];

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
];

function formatPeso(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("en-PH");
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeType(type?: string | null): TypeFilter {
  const clean = String(type || "other").toLowerCase().trim();

  if (
    [
      "deposit",
      "add_funds",
      "add funds",
      "add-funds",
      "add_fund",
      "wallet_topup",
      "topup",
    ].includes(clean)
  ) {
    return "add_funds";
  }

  if (
    [
      "child_panel_subscription",
      "child panel subscription",
      "child-panel-subscription",
    ].includes(clean)
  ) {
    return "child_panel_subscription";
  }

  if (
    [
      "child_panel_auto_renew",
      "child panel auto renew",
      "child-panel-auto-renew",
      "child_panel_renewal",
      "child panel renewal",
    ].includes(clean)
  ) {
    return "child_panel_auto_renew";
  }

  if (
    [
      "point_conversion",
      "point conversion",
      "points_conversion",
      "convert_points",
      "convert points",
    ].includes(clean)
  ) {
    return "point_conversion";
  }

  if (["refund", "refunded", "wallet_refund"].includes(clean)) {
    return "refund";
  }

  if (
    [
      "manual_adjustment",
      "manual adjustment",
      "manual",
      "adjustment",
    ].includes(clean)
  ) {
    return "manual_adjustment";
  }

  return "other";
}

function normalizeStatus(status?: string | null): StatusFilter {
  const clean = String(status || "completed").toLowerCase().trim();

  if (["approved", "success", "successful", "paid", "completed"].includes(clean)) {
    return "completed";
  }

  if (["pending", "processing", "review"].includes(clean)) {
    return "pending";
  }

  if (["failed", "rejected", "cancelled", "canceled", "expired"].includes(clean)) {
    return "failed";
  }

  if (["refund", "refunded"].includes(clean)) {
    return "refunded";
  }

  return "completed";
}

function getTypeLabel(type: string) {
  const clean = normalizeType(type);

  if (clean === "add_funds") return "Add Funds";
  if (clean === "child_panel_subscription") return "Subscription";
  if (clean === "child_panel_auto_renew") return "Auto Renew";
  if (clean === "point_conversion") return "Point Conversion";
  if (clean === "refund") return "Refund";
  if (clean === "manual_adjustment") return "Manual Adjustment";

  return "Other";
}

function getTypeTitle(type: string) {
  const clean = normalizeType(type);

  if (clean === "add_funds") return "Add Funds";
  if (clean === "child_panel_subscription") return "Child Panel Subscription";
  if (clean === "child_panel_auto_renew") return "Child Panel Auto Renew";
  if (clean === "point_conversion") return "Point Conversion";
  if (clean === "refund") return "Refund to Wallet";
  if (clean === "manual_adjustment") return "Manual Adjustment";

  return "Wallet Transaction";
}

function getReferenceCode(item: TransactionItem) {
  const base = item.referenceId || item.id;
  const prefix =
    normalizeType(item.type) === "child_panel_subscription"
      ? "SUB"
      : normalizeType(item.type) === "child_panel_auto_renew"
        ? "REN"
        : normalizeType(item.type) === "point_conversion"
          ? "PCN"
          : normalizeType(item.type) === "refund"
            ? "REF"
            : normalizeType(item.type) === "add_funds"
              ? "TXN"
              : "WLT";

  return `${prefix}-${base.slice(0, 8).toUpperCase()}`;
}

function getStatusLabel(status: string) {
  const clean = normalizeStatus(status);

  if (clean === "completed") return "Completed";
  if (clean === "pending") return "Pending";
  if (clean === "failed") return "Failed";
  if (clean === "refunded") return "Refunded";

  return "Completed";
}

function TypeIcon({ type }: { type: string }) {
  const clean = normalizeType(type);

  const iconClass =
    clean === "add_funds"
      ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
      : clean === "child_panel_subscription"
        ? "bg-purple-50 text-purple-600 ring-purple-100"
        : clean === "child_panel_auto_renew"
          ? "bg-blue-50 text-blue-600 ring-blue-100"
          : clean === "point_conversion"
            ? "bg-orange-50 text-orange-600 ring-orange-100"
            : clean === "refund"
              ? "bg-sky-50 text-sky-600 ring-sky-100"
              : clean === "manual_adjustment"
                ? "bg-slate-100 text-slate-600 ring-slate-200"
                : "bg-slate-100 text-slate-600 ring-slate-200";

  const Icon =
    clean === "add_funds"
      ? Wallet
      : clean === "child_panel_subscription"
        ? Crown
        : clean === "child_panel_auto_renew"
          ? RotateCcw
          : clean === "point_conversion"
            ? SlidersHorizontal
            : clean === "refund"
              ? RefreshCw
              : SlidersHorizontal;

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${iconClass}`}>
      <Icon size={18} />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const clean = normalizeType(type);

  const className =
    clean === "add_funds"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : clean === "child_panel_subscription"
        ? "bg-purple-50 text-purple-700 ring-purple-100"
        : clean === "child_panel_auto_renew"
          ? "bg-blue-50 text-blue-700 ring-blue-100"
          : clean === "point_conversion"
            ? "bg-orange-50 text-orange-700 ring-orange-100"
            : clean === "refund"
              ? "bg-sky-50 text-sky-700 ring-sky-100"
              : clean === "manual_adjustment"
                ? "bg-slate-100 text-slate-700 ring-slate-200"
                : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {getTypeLabel(type)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const clean = normalizeStatus(status);

  const className =
    clean === "completed"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : clean === "pending"
        ? "bg-orange-50 text-orange-700 ring-orange-100"
        : clean === "refunded"
          ? "bg-blue-50 text-blue-700 ring-blue-100"
          : "bg-red-50 text-red-700 ring-red-100";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          clean === "completed"
            ? "bg-emerald-500"
            : clean === "pending"
              ? "bg-orange-500"
              : clean === "refunded"
                ? "bg-blue-500"
                : "bg-red-500"
        }`}
      />
      {getStatusLabel(status)}
    </span>
  );
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
  icon: ReactNode;
  tone: "blue" | "green" | "red" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className={`text-sm font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function DashboardTransactionsPage() {
  const { formatAmount } = useDisplayCurrency();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionItem | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadTransactions() {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      setMessage("Please login to view transactions.");
      return;
    }

    const userId = authData.user.id;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (profileData) setProfile(profileData as Profile);

    let walletRows: WalletTransaction[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setMessage(error.message);
        break;
      }

      const batch = (data || []) as WalletTransaction[];
      walletRows = [...walletRows, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    let depositRows: Deposit[] = [];
    from = 0;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("deposits")
        .select("id, user_id, amount, wallet_credit, currency, method, reference_number, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        break;
      }

      const batch = (data || []) as Deposit[];
      depositRows = [...depositRows, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    const walletItems: TransactionItem[] = walletRows.map((row) => ({
      id: row.id,
      source: "wallet_transactions",
      type: normalizeType(row.type),
      title: getTypeTitle(row.type),
      description: row.description || getTypeTitle(row.type),
      amount: Number(row.amount || 0),
      status: normalizeStatus(row.status),
      referenceType: row.reference_type || row.type,
      referenceId: row.reference_id || row.id,
      createdAt: row.created_at,
    }));

    const depositItems: TransactionItem[] = depositRows.map((row) => ({
      id: row.id,
      source: "deposits",
      type: "add_funds",
      title: `Add Funds via ${row.method || "Payment Method"}`,
      description:
        normalizeStatus(row.status) === "completed"
          ? "Added funds to main balance"
          : `Deposit request is ${row.status}`,
      amount:
        normalizeStatus(row.status) === "completed"
          ? Number(row.wallet_credit || row.amount || 0)
          : Number(row.amount || 0),
      status: normalizeStatus(row.status),
      referenceType: "deposit",
      referenceId: row.reference_number || row.id,
      createdAt: row.created_at,
    }));

    const combined = [...walletItems, ...depositItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setTransactions(combined);
    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.toLowerCase().trim();

    return transactions.filter((item) => {
      const itemType = normalizeType(item.type);
      const itemStatus = normalizeStatus(item.status);

      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.referenceId.toLowerCase().includes(query) ||
        getReferenceCode(item).toLowerCase().includes(query) ||
        getTypeLabel(item.type).toLowerCase().includes(query);

      const matchesType = typeFilter === "all" ? true : itemType === typeFilter;
      const matchesStatus =
        statusFilter === "all" ? true : itemStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, statusFilter, transactions, typeFilter]);

  const stats = useMemo(() => {
    const completed = transactions.filter(
      (item) => normalizeStatus(item.status) === "completed",
    );

    const totalInflow = completed
      .filter((item) => Number(item.amount || 0) > 0)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalOutflow = completed
      .filter((item) => Number(item.amount || 0) < 0)
      .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0);

    const successful = completed.length;
    const netBalance = totalInflow - totalOutflow;

    return {
      total: transactions.length,
      totalInflow,
      totalOutflow,
      successful,
      netBalance,
      pending: transactions.filter((item) => normalizeStatus(item.status) === "pending").length,
      refunds: completed
        .filter((item) => normalizeType(item.type) === "refund")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    };
  }, [transactions]);

  const recentActivity = filteredTransactions.slice(0, 5);

  function exportTransactionsToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredTransactions
      .map((item) => {
        const amount = Number(item.amount || 0);
        const sign = amount >= 0 ? "+" : "-";

        return `
          <tr>
            <td>${escapeHtml(item.title)}</td>
            <td>${escapeHtml(getTypeLabel(item.type))}</td>
            <td class="${amount >= 0 ? "inflow" : "outflow"}">${sign}${formatPeso(
              Math.abs(amount),
            )}</td>
            <td>${escapeHtml(getStatusLabel(item.status))}</td>
            <td>${formatDate(item.createdAt)} ${formatTime(item.createdAt)}</td>
            <td>${escapeHtml(getReferenceCode(item))}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1200,height=900");

    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transactions Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
            .muted { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.7; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
            .card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
            .card strong { display: block; margin-top: 8px; font-size: 22px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 900; padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #334155; vertical-align: top; }
            .inflow { color: #059669; }
            .outflow { color: #dc2626; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Transactions Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Transactions: ${transactions.length}</div>
              <div>Filtered Transactions: ${filteredTransactions.length}</div>
              <div>Current Balance: ${formatPeso(profile?.balance)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Transactions</span><strong>${formatNumber(stats.total)}</strong></div>
            <div class="card"><span>Total Inflow</span><strong>${formatPeso(stats.totalInflow)}</strong></div>
            <div class="card"><span>Total Outflow</span><strong>${formatPeso(stats.totalOutflow)}</strong></div>
            <div class="card"><span>Net Balance</span><strong>${formatPeso(stats.netBalance)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="6" style="text-align:center; padding:32px;">No transactions found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Wallet Transaction Report</span>
            <span>This report was generated from the Dashboard Transactions page.</span>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
        <DashboardSidebar />

        <section className="lg:ml-72 min-h-screen">
          <DashboardTopbar />

          <div className="p-5 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Transactions
                </h1>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                  Track your wallet activity, deposits, conversions, subscriptions, and account adjustments.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={exportTransactionsToPDF}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <Download size={17} />
                  Export PDF
                </button>

                <button
                  type="button"
                  onClick={loadTransactions}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  <RefreshCw size={17} />
                  Refresh
                </button>
              </div>
            </div>

            {message && (
              <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
                {message}
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Transactions"
                value={formatNumber(stats.total)}
                subtitle="All time"
                icon={<SlidersHorizontal size={26} />}
                tone="blue"
              />

              <StatCard
                title="Total Inflow"
                value={formatAmount(stats.totalInflow)}
                subtitle="All time"
                icon={<ArrowDownLeft size={26} />}
                tone="green"
              />

              <StatCard
                title="Total Outflow"
                value={formatAmount(stats.totalOutflow)}
                subtitle="All time"
                icon={<ArrowUpRight size={26} />}
                tone="red"
              />

              <StatCard
                title="Successful Transactions"
                value={formatNumber(stats.successful)}
                subtitle={`${stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(2) : "0.00"}% success rate`}
                icon={<ShieldCheck size={26} />}
                tone="purple"
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_330px]">
              <div className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px_auto]">
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                      <Search size={18} className="text-slate-400" />

                      <input
                        type="text"
                        placeholder="Search transactions, reference..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <select
                      value={typeFilter}
                      onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                    >
                      {typeFilters.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                      className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                    >
                      {statusFilters.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setTypeFilter("all");
                        setStatusFilter("all");
                      }}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <X size={17} />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="text-lg font-black text-slate-950">
                      Transaction History
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 text-left">Transaction</th>
                          <th className="px-5 py-4 text-left">Type</th>
                          <th className="px-5 py-4 text-left">Amount</th>
                          <th className="px-5 py-4 text-left">Status</th>
                          <th className="px-5 py-4 text-left">Date</th>
                          <th className="px-5 py-4 text-left">Reference</th>
                          <th className="px-5 py-4 text-left">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTransactions.map((item) => {
                          const amount = Number(item.amount || 0);
                          const isInflow = amount >= 0;

                          return (
                            <tr key={`${item.source}-${item.id}`} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                              <td className="px-5 py-5 align-top">
                                <div className="flex items-center gap-4">
                                  <TypeIcon type={item.type} />

                                  <div className="min-w-0">
                                    <p className="max-w-[260px] truncate font-black text-slate-950">
                                      {item.title}
                                    </p>
                                    <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-slate-500">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-5 align-top">
                                <TypeBadge type={item.type} />
                              </td>

                              <td className="px-5 py-5 align-top">
                                <p className={`font-black ${isInflow ? "text-emerald-600" : "text-red-600"}`}>
                                  {isInflow ? "+" : "-"} {formatAmount(Math.abs(amount))}
                                </p>
                              </td>

                              <td className="px-5 py-5 align-top">
                                <StatusBadge status={item.status} />
                              </td>

                              <td className="px-5 py-5 align-top">
                                <p className="font-black text-slate-800">{formatDate(item.createdAt)}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">{formatTime(item.createdAt)}</p>
                              </td>

                              <td className="px-5 py-5 align-top">
                                <p className="font-black text-slate-700">{getReferenceCode(item)}</p>
                                <p className="mt-1 text-xs font-semibold text-slate-400">{item.referenceType}</p>
                              </td>

                              <td className="px-5 py-5 align-top">
                                <button
                                  type="button"
                                  onClick={() => setSelectedTransaction(item)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                  title="View details"
                                >
                                  <Eye size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredTransactions.length <= 0 && (
                          <tr>
                            <td colSpan={7} className="px-5 py-16 text-center">
                              <div className="mx-auto flex max-w-sm flex-col items-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                  <Wallet size={26} />
                                </div>

                                <h3 className="mt-4 text-lg font-black text-slate-950">
                                  No transactions found
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                  Try clearing your search or filters.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Showing <span className="font-black text-slate-800">{filteredTransactions.length}</span>{" "}
                      of <span className="font-black text-slate-800">{transactions.length}</span> transactions
                    </p>

                    <p>{loading ? "Loading transactions..." : "Transactions loaded"}</p>
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-slate-950">
                      Transaction Summary
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <SummaryRow label="Current Balance" value={formatAmount(profile?.balance || 0)} />
                    <SummaryRow label="Total Transactions" value={formatNumber(stats.total)} />
                    <SummaryRow label="Total Inflow" value={formatAmount(stats.totalInflow)} valueClassName="text-emerald-600" />
                    <SummaryRow label="Total Outflow" value={formatAmount(stats.totalOutflow)} valueClassName="text-red-600" />
                    <SummaryRow label="Net Flow" value={formatAmount(stats.netBalance)} valueClassName={stats.netBalance >= 0 ? "text-blue-600" : "text-red-600"} />
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-slate-950">Quick Info</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex gap-3">
                        <ArrowDownLeft size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                        <p className="text-sm font-semibold leading-6 text-slate-600">
                          Inflow includes Add Funds, refunds, point conversions, and account credits.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="flex gap-3">
                        <ArrowUpRight size={18} className="mt-0.5 shrink-0 text-red-600" />
                        <p className="text-sm font-semibold leading-6 text-slate-600">
                          Outflow includes purchases, subscriptions, renewals, and wallet deductions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>
                  </div>

                  <div className="space-y-4">
                    {recentActivity.map((item) => {
                      const amount = Number(item.amount || 0);
                      return (
                        <div key={`recent-${item.source}-${item.id}`} className="flex items-start gap-3">
                          <TypeIcon type={item.type} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatDate(item.createdAt)} {formatTime(item.createdAt)}
                            </p>
                          </div>
                          <p className={`text-sm font-black ${amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            {amount >= 0 ? "+" : "-"}{formatAmount(Math.abs(amount))}
                          </p>
                        </div>
                      );
                    })}

                    {recentActivity.length <= 0 && (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                        No recent activity yet.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {selectedTransaction && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Transaction Details
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review wallet activity details and reference information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <TypeIcon type={selectedTransaction.type} />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">
                      {selectedTransaction.title}
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {selectedTransaction.description}
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-black ${
                      selectedTransaction.amount >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {selectedTransaction.amount >= 0 ? "+" : "-"}{formatAmount(Math.abs(selectedTransaction.amount))}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Type</p>
                    <div className="mt-2"><TypeBadge type={selectedTransaction.type} /></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Status</p>
                    <div className="mt-2"><StatusBadge status={selectedTransaction.status} /></div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Reference</p>
                    <p className="mt-2 text-sm font-black text-slate-900">{getReferenceCode(selectedTransaction)}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Date</p>
                    <p className="mt-2 text-sm font-black text-slate-900">
                      {formatDate(selectedTransaction.createdAt)} · {formatTime(selectedTransaction.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardGuard>
  );
}

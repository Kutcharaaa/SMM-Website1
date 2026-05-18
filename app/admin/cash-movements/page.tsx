"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  Landmark,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type CashMovement = {
  id: string;
  cash_account_id: string | null;
  type: string | null;
  amount: number | string | null;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  cash_accounts?: {
    id?: string;
    name?: string | null;
    balance?: number | string | null;
    type?: string | null;
    icon_url?: string | null;
  } | null;
};

type CashAccount = {
  id: string;
  name: string;
  balance: number | string | null;
  type: string | null;
  icon_url?: string | null;
};

type TypeFilter =
  | "all"
  | "deposit"
  | "expense"
  | "provider_payment"
  | "refund"
  | "manual_adjustment"
  | "other";

const typeFilters: { label: string; value: TypeFilter }[] = [
  { label: "All Types", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Expenses", value: "expense" },
  { label: "Provider Payments", value: "provider_payment" },
  { label: "Refunds", value: "refund" },
  { label: "Manual Adjustments", value: "manual_adjustment" },
  { label: "Other", value: "other" },
];

function normalizeText(value?: string | null) {
  return String(value || "").toLowerCase().trim();
}

function normalizeMovementType(type?: string | null) {
  const clean = normalizeText(type);

  if (["deposit", "deposits", "in", "inflow", "income", "add", "credit"].includes(clean)) {
    return "deposit";
  }

  if (["expense", "expenses", "out", "outflow", "payment", "debit", "withdraw"].includes(clean)) {
    return "expense";
  }

  if (["provider", "provider_payment", "provider payment", "provider-payment"].includes(clean)) {
    return "provider_payment";
  }

  if (["refund", "order_refund", "order refund"].includes(clean)) {
    return "refund";
  }

  if (["manual", "manual_adjustment", "manual adjustment", "adjustment"].includes(clean)) {
    return "manual_adjustment";
  }

  return clean || "other";
}

function getTypeLabel(type?: string | null) {
  const clean = normalizeMovementType(type);

  if (clean === "provider_payment") return "Provider Payment";
  if (clean === "manual_adjustment") return "Manual Adjustment";

  return clean.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function isInflow(type?: string | null, amount?: number | string | null) {
  const clean = normalizeMovementType(type);
  const numericAmount = Number(amount || 0);

  if (clean === "deposit") return true;
  if (clean === "manual_adjustment") return numericAmount >= 0;

  return numericAmount > 0;
}

function isOutflow(type?: string | null, amount?: number | string | null) {
  const clean = normalizeMovementType(type);
  const numericAmount = Number(amount || 0);

  if (clean === "expense" || clean === "provider_payment" || clean === "refund") return true;

  return numericAmount < 0;
}

function formatMoney(value: number | string | null | undefined) {
  return `₱${Math.abs(Number(value || 0)).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedMoney(value: number | string | null | undefined, type?: string | null) {
  const amount = Number(value || 0);
  const outflow = isOutflow(type, amount);
  const prefix = outflow ? "-" : "+";

  return `${prefix}${formatMoney(amount)}`;
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

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("en-PH");
}

function shortMovementId(id: string) {
  return `MV-${String(id).slice(0, 8).toUpperCase()}`;
}

function shortReferenceId(id?: string | null) {
  if (!id) return "—";
  return String(id).length > 14 ? `${String(id).slice(0, 14)}...` : String(id);
}

function isWithin24Hours(value?: string | null) {
  if (!value) return false;
  const dayMs = 24 * 60 * 60 * 1000;
  return Date.now() - new Date(value).getTime() <= dayMs;
}

function getAccountInitial(name?: string | null) {
  return String(name || "A").charAt(0).toUpperCase();
}

function AccountIcon({
  account,
  size = "md",
}: {
  account?: CashMovement["cash_accounts"] | CashAccount | null;
  size?: "sm" | "md";
}) {
  const sizeClass =
    size === "sm"
      ? "h-10 w-10 rounded-2xl text-sm"
      : "h-12 w-12 rounded-2xl text-base";

  const name = account?.name || "Unknown";
  const iconUrl = account?.icon_url || null;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-blue-50 font-black text-blue-700 ring-1 ring-blue-100 ${sizeClass}`}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        getAccountInitial(name)
      )}
    </div>
  );
}

function MovementIcon({ type, amount }: { type?: string | null; amount?: number | string | null }) {
  const outflow = isOutflow(type, amount);
  const inflow = isInflow(type, amount);

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${
        inflow
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : outflow
            ? "bg-red-50 text-red-700 ring-red-100"
            : "bg-blue-50 text-blue-700 ring-blue-100"
      }`}
    >
      {inflow ? <ArrowDownLeft size={20} /> : outflow ? <ArrowUpRight size={20} /> : <Banknote size={20} />}
    </div>
  );
}

function TypeBadge({ type }: { type?: string | null }) {
  const clean = normalizeMovementType(type);

  const className =
    clean === "deposit"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : clean === "expense" || clean === "provider_payment"
        ? "bg-red-50 text-red-700 ring-red-100"
        : clean === "refund"
          ? "bg-orange-50 text-orange-700 ring-orange-100"
          : clean === "manual_adjustment"
            ? "bg-blue-50 text-blue-700 ring-blue-100"
            : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {getTypeLabel(type)}
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
  tone: "green" | "red" | "blue" | "purple";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="hidden h-14 w-24 items-end justify-end sm:flex">
          <svg viewBox="0 0 120 60" className="h-14 w-24 opacity-70">
            <path
              d="M4 48 C18 38, 22 44, 34 30 C44 18, 50 24, 58 30 C70 40, 74 14, 86 20 C98 26, 102 10, 116 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              className={
                tone === "green"
                  ? "text-emerald-300"
                  : tone === "red"
                    ? "text-red-300"
                    : tone === "blue"
                      ? "text-blue-300"
                      : "text-purple-300"
              }
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className={`mt-2 text-sm font-black ${valueClassName}`}>{value}</div>
    </div>
  );
}

export default function AdminCashMovementsPage() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [cashAccountFilter, setCashAccountFilter] = useState("all");

  async function loadMovements() {
    const { data, error } = await supabase
      .from("cash_movements")
      .select(
        `
        *,
        cash_accounts (
          id,
          name,
          balance,
          type,
          icon_url
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMovements((data || []) as CashMovement[]);
    setLoading(false);
  }

  async function loadCashAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("id, name, balance, type, icon_url")
      .order("name");

    if (!error) {
      setCashAccounts((data || []) as CashAccount[]);
    }
  }

  useEffect(() => {
    loadMovements();
    loadCashAccounts();

    const interval = setInterval(() => {
      loadMovements();
      loadCashAccounts();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  function getAccountName(id?: string | null) {
    if (!id) return "Unknown Account";
    return cashAccounts.find((account) => account.id === id)?.name || "Unknown Account";
  }

  const stats = useMemo(() => {
    const inflow = movements
      .filter((movement) => isInflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    const outflow = movements
      .filter((movement) => isOutflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      total: movements.length,
    };
  }, [movements]);

  const summary = useMemo(() => {
    const recent24 = movements.filter((movement) => isWithin24Hours(movement.created_at));

    const recentInflow = recent24
      .filter((movement) => isInflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    const recentOutflow = recent24
      .filter((movement) => isOutflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    const highestMovement = movements.reduce<CashMovement | null>((highest, movement) => {
      if (!highest) return movement;

      return Math.abs(Number(movement.amount || 0)) > Math.abs(Number(highest.amount || 0))
        ? movement
        : highest;
    }, null);

    const accountCounts = new Map<string, number>();

    movements.forEach((movement) => {
      const key = movement.cash_account_id || "unknown";
      accountCounts.set(key, (accountCounts.get(key) || 0) + 1);
    });

    const mostActiveAccountId = Array.from(accountCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      recentInflow,
      recentOutflow,
      highestMovement,
      mostActiveAccountId,
      mostActiveCount: mostActiveAccountId ? accountCounts.get(mostActiveAccountId) || 0 : 0,
    };
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const query = search.toLowerCase().trim();

    return movements.filter((movement) => {
      const movementType = normalizeMovementType(movement.type);

      const matchesSearch =
        !query ||
        String(movement.id || "").toLowerCase().includes(query) ||
        String(movement.description || "").toLowerCase().includes(query) ||
        String(movement.reference_type || "").toLowerCase().includes(query) ||
        String(movement.reference_id || "").toLowerCase().includes(query) ||
        String(movement.cash_accounts?.name || "").toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all"
          ? true
          : typeFilter === "other"
            ? !["deposit", "expense", "provider_payment", "refund", "manual_adjustment"].includes(movementType)
            : movementType === typeFilter;

      const matchesAccount =
        cashAccountFilter === "all" ? true : movement.cash_account_id === cashAccountFilter;

      return matchesSearch && matchesType && matchesAccount;
    });
  }, [cashAccountFilter, movements, search, typeFilter]);

  const recentActivity = movements.slice(0, 5);

  function exportMovementsToPDF() {
    const logoUrl = "/logo.png";

    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const totalInflow = filteredMovements
      .filter((movement) => isInflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    const totalOutflow = filteredMovements
      .filter((movement) => isOutflow(movement.type, movement.amount))
      .reduce((sum, movement) => sum + Math.abs(Number(movement.amount || 0)), 0);

    const rowsHtml = filteredMovements
      .map((movement) => {
        const outflow = isOutflow(movement.type, movement.amount);
        const amountClass = outflow ? "amount-red" : "amount-green";

        return `
          <tr>
            <td>${shortMovementId(movement.id)}</td>
            <td>${movement.cash_accounts?.name || getAccountName(movement.cash_account_id)}</td>
            <td>${getTypeLabel(movement.type)}</td>
            <td class="${amountClass}">${formatSignedMoney(movement.amount, movement.type)}</td>
            <td>${movement.description || "—"}</td>
            <td>${movement.reference_type || "—"}</td>
            <td>${shortReferenceId(movement.reference_id)}</td>
            <td>${formatDate(movement.created_at)} ${formatTime(movement.created_at)}</td>
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
          <title>Cash Movements Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
            .header { display: flex; justify-content: space-between; align-items: center; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
            .brand { display: flex; align-items: center; gap: 16px; }
            .logo { width: 160px; max-height: 70px; object-fit: contain; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
            .muted { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.7; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
            .card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
            .card strong { display: block; margin-top: 8px; font-size: 22px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 900; padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #334155; vertical-align: top; }
            .amount-green { color: #047857; font-weight: 900; }
            .amount-red { color: #dc2626; font-weight: 900; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; gap: 20px; }
            @media print { body { padding: 18px; } table { font-size: 10px; } th, td { padding: 8px; } }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" class="logo" />
              <div>
                <h1>Cash Movements Report</h1>
                <p class="muted">Ascend Service · Generated ${reportDate}</p>
              </div>
            </div>

            <div class="muted">
              <div>Total Records: ${filteredMovements.length}</div>
              <div>Type Filter: ${typeFilter}</div>
              <div>Cash Account Filter: ${cashAccountFilter === "all" ? "All Accounts" : getAccountName(cashAccountFilter)}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Inflow</span><strong>${formatMoney(totalInflow)}</strong></div>
            <div class="card"><span>Total Outflow</span><strong>${formatMoney(totalOutflow)}</strong></div>
            <div class="card"><span>Net Movement</span><strong>${totalInflow >= totalOutflow ? "" : "-"}${formatMoney(totalInflow - totalOutflow)}</strong></div>
            <div class="card"><span>Total Transactions</span><strong>${filteredMovements.length}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Movement ID</th>
                <th>Cash Account</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Reference Type</th>
                <th>Reference ID</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              ${
                rowsHtml ||
                `<tr>
                  <td colspan="8" style="text-align:center; padding: 32px;">
                    No cash movement records found.
                  </td>
                </tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Elevate Your Social Presence</span>
            <span>This report was generated from the Admin Cash Movements page.</span>
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
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Cash Movements
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Track every cash inflow and outflow across all business accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  loadMovements();
                  loadCashAccounts();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportMovementsToPDF}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <Download size={17} />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Inflow" value={formatMoney(stats.inflow)} subtitle="All time money in" icon={<TrendingUp size={26} />} tone="green" />
            <StatCard title="Total Outflow" value={formatMoney(stats.outflow)} subtitle="All time money out" icon={<TrendingDown size={26} />} tone="red" />
            <StatCard title="Net Movement" value={`${stats.net < 0 ? "-" : ""}${formatMoney(stats.net)}`} subtitle="Inflow minus outflow" icon={<Activity size={26} />} tone="blue" />
            <StatCard title="Total Transactions" value={formatNumber(stats.total)} subtitle="All cash movement records" icon={<FileText size={26} />} tone="purple" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">All Cash Movements</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Showing {filteredMovements.length} of {movements.length} entries.
                    </p>
                  </div>

                  <div className="flex h-11 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm lg:w-[340px]">
                    <Search size={18} className="text-slate-400" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by reference, description..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {typeFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cashAccountFilter}
                    onChange={(event) => setCashAccountFilter(event.target.value)}
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    <option value="all">All Accounts</option>
                    {cashAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setCashAccountFilter("all");
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Filter size={17} />
                    Filters
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      loadMovements();
                      loadCashAccounts();
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-slate-700 shadow-sm transition hover:bg-slate-50"
                    title="Refresh"
                  >
                    <RefreshCw size={17} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Movement ID</th>
                      <th className="px-5 py-4 text-left">Cash Account</th>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Amount</th>
                      <th className="px-5 py-4 text-left">Description</th>
                      <th className="px-5 py-4 text-left">Reference</th>
                      <th className="px-5 py-4 text-left">Date</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMovements.map((movement) => {
                      const outflow = isOutflow(movement.type, movement.amount);
                      const inflow = isInflow(movement.type, movement.amount);

                      return (
                        <tr key={movement.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-5 align-top font-black text-blue-700">
                            {shortMovementId(movement.id)}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex items-start gap-3">
                              <AccountIcon account={movement.cash_accounts} size="sm" />
                              <div className="min-w-0">
                                <p className="max-w-[190px] truncate font-black text-slate-800">
                                  {movement.cash_accounts?.name || getAccountName(movement.cash_account_id)}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  Balance: {formatMoney(movement.cash_accounts?.balance || 0)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <TypeBadge type={movement.type} />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p
                              className={`font-black ${
                                inflow ? "text-emerald-600" : outflow ? "text-red-600" : "text-slate-700"
                              }`}
                            >
                              {formatSignedMoney(movement.amount, movement.type)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="max-w-[230px] font-semibold leading-5 text-slate-600">
                              {movement.description || "No description"}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">
                              {movement.reference_type || "—"}
                            </p>
                            <p className="mt-1 max-w-[160px] truncate text-xs font-semibold text-slate-400">
                              {shortReferenceId(movement.reference_id)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">{formatDate(movement.created_at)}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {formatTime(movement.created_at)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <button
                              type="button"
                              onClick={() => setSelectedMovement(movement)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="View movement"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredMovements.length <= 0 && (
                      <tr>
                        <td colSpan={8} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <WalletCards size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No cash movements found
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
                  Showing <span className="font-black text-slate-800">{filteredMovements.length}</span>{" "}
                  of <span className="font-black text-slate-800">{movements.length}</span> entries
                </p>

                <p>{loading ? "Loading cash movements..." : "Auto-refreshing every 15 seconds"}</p>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock3 size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-slate-950">Movement Summary</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <SummaryItem
                    icon={<ArrowDownLeft size={18} />}
                    title="Recent Inflow (24h)"
                    subtitle="Money received recently"
                    value={formatMoney(summary.recentInflow)}
                    valueClassName="text-emerald-600"
                    iconClassName="bg-emerald-50 text-emerald-700"
                  />

                  <SummaryItem
                    icon={<ArrowUpRight size={18} />}
                    title="Recent Outflow (24h)"
                    subtitle="Money spent recently"
                    value={formatMoney(summary.recentOutflow)}
                    valueClassName="text-red-600"
                    iconClassName="bg-red-50 text-red-700"
                  />

                  <SummaryItem
                    icon={<Activity size={18} />}
                    title="Highest Movement"
                    subtitle={
                      summary.highestMovement
                        ? `${formatDate(summary.highestMovement.created_at)} ${formatTime(summary.highestMovement.created_at)}`
                        : "No data"
                    }
                    value={summary.highestMovement ? formatMoney(summary.highestMovement.amount) : formatMoney(0)}
                    valueClassName="text-blue-600"
                    iconClassName="bg-blue-50 text-blue-700"
                  />

                  <SummaryItem
                    icon={<Landmark size={18} />}
                    title="Most Active Account"
                    subtitle={`${summary.mostActiveCount} transactions`}
                    value={getAccountName(summary.mostActiveAccountId)}
                    valueClassName="text-slate-700 max-w-[120px] truncate"
                    iconClassName="bg-purple-50 text-purple-700"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setTypeFilter("all");
                      setCashAccountFilter("all");
                    }}
                    className="text-sm font-black text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((movement) => {
                    const inflow = isInflow(movement.type, movement.amount);
                    const outflow = isOutflow(movement.type, movement.amount);

                    return (
                      <button
                        key={movement.id}
                        type="button"
                        onClick={() => setSelectedMovement(movement)}
                        className="flex w-full items-start gap-3 rounded-2xl p-2 text-left transition hover:bg-slate-50"
                      >
                        <MovementIcon type={movement.type} amount={movement.amount} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-800">
                                {movement.description || getTypeLabel(movement.type)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {movement.cash_accounts?.name || getAccountName(movement.cash_account_id)}
                              </p>
                            </div>

                            <p
                              className={`shrink-0 text-sm font-black ${
                                inflow ? "text-emerald-600" : outflow ? "text-red-600" : "text-slate-700"
                              }`}
                            >
                              {formatSignedMoney(movement.amount, movement.type)}
                            </p>
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {formatTime(movement.created_at)}
                          </p>
                        </div>
                      </button>
                    );
                  })}

                  {recentActivity.length <= 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No recent cash movements yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black text-slate-950">Quick Insights</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">
                    Deposits and inflows are tracked from approved payment requests.
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                    Provider payments and expenses reduce your cash account balance.
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                    Export this page for accounting reports and transaction audits.
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {selectedMovement && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Cash Movement Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review transaction information, reference details, and related cash account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <MovementIcon type={selectedMovement.type} amount={selectedMovement.amount} />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">
                      {selectedMovement.description || getTypeLabel(selectedMovement.type)}
                    </h4>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {selectedMovement.cash_accounts?.name || getAccountName(selectedMovement.cash_account_id)}
                    </p>

                    <div className="mt-3">
                      <TypeBadge type={selectedMovement.type} />
                    </div>
                  </div>

                  <p
                    className={`shrink-0 text-2xl font-black ${
                      isInflow(selectedMovement.type, selectedMovement.amount)
                        ? "text-emerald-600"
                        : isOutflow(selectedMovement.type, selectedMovement.amount)
                          ? "text-red-600"
                          : "text-slate-700"
                    }`}
                  >
                    {formatSignedMoney(selectedMovement.amount, selectedMovement.type)}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <InfoBlock label="Movement ID" value={shortMovementId(selectedMovement.id)} />
                  <InfoBlock label="Cash Account" value={selectedMovement.cash_accounts?.name || getAccountName(selectedMovement.cash_account_id)} />
                  <InfoBlock
                    label="Amount"
                    value={formatSignedMoney(selectedMovement.amount, selectedMovement.type)}
                    valueClassName={
                      isInflow(selectedMovement.type, selectedMovement.amount)
                        ? "text-emerald-600"
                        : isOutflow(selectedMovement.type, selectedMovement.amount)
                          ? "text-red-600"
                          : "text-slate-950"
                    }
                  />
                  <InfoBlock label="Type" value={<TypeBadge type={selectedMovement.type} />} />
                  <InfoBlock label="Reference Type" value={selectedMovement.reference_type || "—"} />
                  <InfoBlock label="Reference ID" value={selectedMovement.reference_id || "—"} />
                  <InfoBlock label="Date" value={formatDate(selectedMovement.created_at)} />
                  <InfoBlock label="Time" value={formatTime(selectedMovement.created_at)} />
                  <InfoBlock label="Account Balance" value={formatMoney(selectedMovement.cash_accounts?.balance || 0)} />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    {selectedMovement.description || "No description added."}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedMovement(null)}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

function SummaryItem({
  icon,
  title,
  subtitle,
  value,
  valueClassName,
  iconClassName,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: string;
  valueClassName: string;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-700">{title}</p>
          <p className="truncate text-xs font-semibold text-slate-400">{subtitle}</p>
        </div>
      </div>

      <p className={`shrink-0 text-right font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}

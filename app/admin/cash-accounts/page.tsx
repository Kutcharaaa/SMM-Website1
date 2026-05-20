"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  ImageIcon,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

type CashAccount = {
  id: string;
  name: string;
  type: string;
  balance: number | string | null;
  currency: string | null;
  status: string | null;
  created_at: string;
  icon_url?: string | null;
  account_number?: string | null;
  description?: string | null;
};

type CashMovement = {
  id: string;
  cash_account_id: string | null;
  type: string | null;
  amount: number | string | null;
  description: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
};

type StatusFilter = "all" | "active" | "inactive";
type AccountType = "wallet" | "bank" | "cash" | "paypal" | "crypto" | "other";

const accountTypes: { label: string; value: AccountType }[] = [
  { label: "E-Wallet", value: "wallet" },
  { label: "Bank", value: "bank" },
  { label: "Cash", value: "cash" },
  { label: "PayPal", value: "paypal" },
  { label: "Crypto", value: "crypto" },
  { label: "Other", value: "other" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
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

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status?: string | null) {
  return String(status || "active").toLowerCase().trim();
}

function normalizeType(type?: string | null) {
  return String(type || "wallet").toLowerCase().trim();
}

function getTypeLabel(type?: string | null) {
  const clean = normalizeType(type);
  return accountTypes.find((item) => item.value === clean)?.label || "Other";
}

function getAccountInitial(name?: string | null) {
  return String(name || "A").charAt(0).toUpperCase();
}

function isInflow(type?: string | null) {
  const clean = normalizeType(type);
  return ["deposit", "in", "inflow", "income", "add", "credit"].includes(clean);
}

function isOutflow(type?: string | null) {
  const clean = normalizeType(type);
  return ["expense", "out", "outflow", "payment", "provider", "debit", "withdraw"].includes(clean);
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
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 sm:h-14 sm:w-14 sm:rounded-3xl ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 min-w-0 truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function AccountIcon({
  iconUrl,
  name,
  size = "md",
}: {
  iconUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-10 w-10 rounded-2xl text-sm",
    md: "h-14 w-14 rounded-2xl text-base",
    lg: "h-24 w-24 rounded-full text-2xl",
  }[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-blue-50 font-black text-blue-700 ring-1 ring-blue-100 ${sizeClass}`}
    >
      {iconUrl ? (
        <img src={iconUrl} alt={name || "Cash account"} className="h-full w-full object-cover" />
      ) : (
        getAccountInitial(name)
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const active = normalizeStatus(status) === "active";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function TypeBadge({ type }: { type?: string | null }) {
  const clean = normalizeType(type);

  const className =
    clean === "bank"
      ? "bg-purple-50 text-purple-700 ring-purple-100"
      : clean === "cash"
        ? "bg-orange-50 text-orange-700 ring-orange-100"
        : clean === "wallet"
          ? "bg-blue-50 text-blue-700 ring-blue-100"
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {getTypeLabel(type)}
    </span>
  );
}

function UploadBox({
  url,
  uploading,
  onChange,
  onRemove,
}: {
  url: string;
  uploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-black text-slate-700">
          Account Icon
        </label>

        {url && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-black text-red-600 hover:text-red-700"
          >
            Remove
          </button>
        )}
      </div>

      <label className="group flex h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 text-center transition hover:border-blue-300 hover:bg-blue-50/50">
        {url ? (
          <img src={url} alt="Account icon" className="h-full max-h-24 w-full object-contain" />
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition group-hover:text-blue-600">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            </div>

            <p className="mt-3 text-sm font-black text-slate-700">
              {uploading ? "Uploading..." : "Click to upload icon"}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              PNG, JPG, WEBP. Recommended 512x512.
            </p>
          </>
        )}

        <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={uploading} />
      </label>
    </div>
  );
}

function PreviewAccountCard({
  name,
  type,
  provider,
  currency,
  balance,
  status,
  description,
  iconUrl,
}: {
  name: string;
  type: string;
  provider: string;
  currency: string;
  balance: string;
  status: string;
  description: string;
  iconUrl: string;
}) {
  const displayName = name || "Sample Account Name";
  const displayProvider = provider || "Sample Provider / Bank";
  const displayDescription = description || "This is a short description of the account.";

  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-black text-slate-700">Live Preview</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">This is how the account will appear.</p>

      <div className="mt-6 rounded-[26px] border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="flex justify-center">
          <AccountIcon iconUrl={iconUrl} name={displayName} size="lg" />
        </div>

        <h4 className="mt-5 min-w-0 truncate text-xl font-black text-slate-950 sm:text-2xl">{displayName}</h4>
        <p className="mt-1 min-w-0 truncate text-sm font-semibold text-slate-500">{displayProvider}</p>

        <div className="my-5 border-t border-slate-100" />

        <p className="text-sm font-bold text-slate-500">Balance</p>
        <p className="mt-1 min-w-0 truncate text-2xl font-black text-slate-950 sm:text-3xl">{formatMoney(balance)}</p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <TypeBadge type={type} />
          <StatusBadge status={status} />
        </div>

        <p className="mt-5 break-words text-sm font-semibold leading-6 text-slate-500">{displayDescription}</p>
        <p className="mt-4 text-sm font-black text-slate-500">{currency || "PHP"} (₱)</p>
      </div>
    </div>
  );
}

function DonutChart({ accounts, total }: { accounts: CashAccount[]; total: number }) {
  const topAccounts = accounts.slice(0, 4);
  let startPercent = 0;

  const gradient =
    total <= 0 || topAccounts.length <= 0
      ? "#e2e8f0 0% 100%"
      : topAccounts
          .map((account, index) => {
            const colors = ["#2563eb", "#22c55e", "#a855f7", "#f97316"];
            const percent = (Number(account.balance || 0) / total) * 100;
            const segment = `${colors[index]} ${startPercent}% ${startPercent + percent}%`;
            startPercent += percent;
            return segment;
          })
          .join(", ");

  return (
    <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
      <div
        className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full sm:h-40 sm:w-40"
        style={{ background: `conic-gradient(${gradient})` }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white px-2 text-center shadow-inner">
          <p className="max-w-[88px] truncate text-sm font-black text-slate-950 sm:text-base">{formatMoney(total)}</p>
          <p className="text-xs font-bold text-slate-500">Total Balance</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        {topAccounts.length <= 0 ? (
          <p className="text-sm font-semibold text-slate-500">No cash accounts yet.</p>
        ) : (
          topAccounts.map((account, index) => {
            const colors = ["bg-blue-600", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
            const percent = total > 0 ? (Number(account.balance || 0) / total) * 100 : 0;

            return (
              <div key={account.id} className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${colors[index]}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">{account.name}</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{formatMoney(account.balance)}</p>
                  </div>
                </div>

                <p className="shrink-0 text-xs font-black text-slate-500">{percent.toFixed(1)}%</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function AdminCashAccountsPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<CashAccount | null>(null);
  const [previewAccount, setPreviewAccount] = useState<CashAccount | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("wallet");
  const [provider, setProvider] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("active");
  const [description, setDescription] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setAccounts((data || []) as CashAccount[]);
    setLoading(false);
  }

  async function loadMovements() {
    const { data, error } = await supabase
      .from("cash_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error) {
      setMovements((data || []) as CashMovement[]);
    }
  }

  useEffect(() => {
    loadAccounts();
    loadMovements();

    const interval = setInterval(() => {
      loadAccounts();
      loadMovements();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  function resetForm() {
    setName("");
    setType("wallet");
    setProvider("");
    setCurrency("PHP");
    setBalance("");
    setStatus("active");
    setDescription("");
    setAccountNumber("");
    setIconUrl("");
  }

  function openAddModal() {
    resetForm();
    setSelectedAccount(null);
    setShowModal(true);
    setMessage("");
  }

  function openEditModal(account: CashAccount) {
    setSelectedAccount(account);
    setName(account.name || "");
    setType(normalizeType(account.type) as AccountType);
    setProvider(account.account_number || "");
    setCurrency(account.currency || "PHP");
    setBalance(String(account.balance ?? ""));
    setStatus(normalizeStatus(account.status));
    setDescription(account.description || "");
    setAccountNumber(account.account_number || "");
    setIconUrl(account.icon_url || "");
    setShowModal(true);
    setMessage("");
  }

  async function uploadIcon(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);

    const extension = file.name.split(".").pop() || "png";
    const fileName = `icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage.from("cash-account-icons").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      setMessage(error.message);
      setUploadingIcon(false);
      event.target.value = "";
      return;
    }

    const { data } = supabase.storage.from("cash-account-icons").getPublicUrl(fileName);

    setIconUrl(data.publicUrl);
    setMessage("Cash account icon uploaded.");
    setUploadingIcon(false);
    event.target.value = "";
  }

  function validateForm() {
    if (!name.trim()) {
      setMessage("Please enter account name.");
      return false;
    }

    if (!type) {
      setMessage("Please select account type.");
      return false;
    }

    return true;
  }

  async function saveAccount() {
    if (saving) return;
    if (!validateForm()) return;

    setSaving(true);

    const payload = {
      name: name.trim(),
      type,
      balance: Number(balance || 0),
      currency: currency || "PHP",
      status,
      icon_url: iconUrl || null,
      account_number: accountNumber.trim() || null,
      description: description.trim() || null,
    };

    if (selectedAccount) {
      const { error } = await supabase
        .from("cash_accounts")
        .update(payload)
        .eq("id", selectedAccount.id);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Cash account updated.");
    } else {
      const { error } = await supabase.from("cash_accounts").insert(payload);

      if (error) {
        setMessage(error.message);
        setSaving(false);
        return;
      }

      setMessage("Cash account added.");
    }

    setSaving(false);
    setShowModal(false);
    setSelectedAccount(null);
    resetForm();
    loadAccounts();
  }

  async function deleteAccount(account: CashAccount) {
    const confirmDelete = confirm(`Delete "${account.name}" cash account?`);
    if (!confirmDelete) return;

    const { error } = await supabase.from("cash_accounts").delete().eq("id", account.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Cash account deleted.");
    setPreviewAccount(null);
    setSelectedAccount(null);
    loadAccounts();
  }

  function getAccountName(id?: string | null) {
    if (!id) return "Unknown Account";
    return accounts.find((account) => account.id === id)?.name || "Unknown Account";
  }

  const stats = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    const totalInflow = movements
      .filter((movement) => isInflow(movement.type))
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const totalOutflow = movements
      .filter((movement) => isOutflow(movement.type))
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const activeAccounts = accounts.filter((account) => normalizeStatus(account.status) === "active").length;

    return {
      totalBalance,
      totalInflow,
      totalOutflow,
      activeAccounts,
    };
  }, [accounts, movements]);

  const filteredAccounts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return accounts.filter((account) => {
      const matchesSearch =
        !query ||
        String(account.name || "").toLowerCase().includes(query) ||
        String(account.type || "").toLowerCase().includes(query) ||
        String(account.account_number || "").toLowerCase().includes(query) ||
        String(account.description || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? normalizeStatus(account.status) === "active"
            : normalizeStatus(account.status) !== "active";

      return matchesSearch && matchesStatus;
    });
  }, [accounts, search, statusFilter]);

  const recentMovements = movements.slice(0, 5);

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-purple-600 text-white shadow-sm sm:h-14 sm:w-14">
                <Landmark size={25} />
              </div>

              <div className="min-w-0">
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Cash Accounts
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                  Manage your business cash accounts and track all cash movements.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
            >
              <Plus size={18} />
              Add Cash Account
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Balance"
              value={formatMoney(stats.totalBalance)}
              subtitle="Total across all accounts"
              icon={<Wallet size={26} />}
              tone="blue"
            />

            <StatCard
              title="Total Inflow"
              value={formatMoney(stats.totalInflow)}
              subtitle="All time money in"
              icon={<ArrowDownLeft size={26} />}
              tone="green"
            />

            <StatCard
              title="Total Outflow"
              value={formatMoney(stats.totalOutflow)}
              subtitle="All time money out"
              icon={<ArrowUpRight size={26} />}
              tone="red"
            />

            <StatCard
              title="Total Accounts"
              value={String(stats.activeAccounts)}
              subtitle="Active cash accounts"
              icon={<Landmark size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
            <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-black text-slate-950">Cash Accounts</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Showing {filteredAccounts.length} of {accounts.length} accounts.
                  </p>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
                  <div className="flex h-11 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search accounts..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {statusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      loadAccounts();
                      loadMovements();
                    }}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 lg:w-auto"
                  >
                    <RefreshCw size={17} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">#</th>
                      <th className="px-5 py-4 text-left">Account</th>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Balance</th>
                      <th className="px-5 py-4 text-left">Provider / Bank</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAccounts.map((account, index) => (
                      <tr key={account.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top font-black text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex min-w-0 items-start gap-4">
                            <AccountIcon iconUrl={account.icon_url} name={account.name} size="md" />

                            <div className="min-w-0">
                              <p className="max-w-[250px] truncate font-black text-slate-950">{account.name}</p>
                              <p className="mt-1 max-w-[250px] truncate text-sm font-semibold text-slate-500">
                                {account.description || "No description added."}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <TypeBadge type={account.type} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="whitespace-nowrap font-black text-slate-950">{formatMoney(account.balance)}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Available balance
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="max-w-[180px] truncate font-black text-slate-800">
                            {account.account_number || account.currency || "—"}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {account.currency || "PHP"}
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge status={account.status} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewAccount(account)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(account)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteAccount(account)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredAccounts.length <= 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <Landmark size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No cash accounts found
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              Try clearing the filter or add your first cash account.
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
                  Showing <span className="font-black text-slate-800">{filteredAccounts.length}</span>{" "}
                  of <span className="font-black text-slate-800">{accounts.length}</span> accounts
                </p>

                <p>{loading ? "Loading cash accounts..." : "Auto-refreshing every 15 seconds"}</p>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="truncate text-xl font-black text-slate-950">Account Summary</h3>

                <div className="mt-6">
                  <DonutChart accounts={accounts} total={stats.totalBalance} />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="min-w-0 truncate text-xl font-black text-slate-950">Recent Cash Movements</h3>

                  <button className="shrink-0 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-blue-700 transition hover:bg-slate-50">
                    View All
                  </button>
                </div>

                <div className="min-w-0 space-y-4">
                  {recentMovements.map((movement) => {
                    const inflow = isInflow(movement.type);
                    const outflow = isOutflow(movement.type);

                    return (
                      <div key={movement.id} className="flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                            inflow
                              ? "bg-emerald-50 text-emerald-700"
                              : outflow
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-50 text-slate-600"
                          }`}
                        >
                          {inflow ? (
                            <ArrowDownLeft size={18} />
                          ) : outflow ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <Banknote size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-800">
                                {movement.description || `${movement.type || "Movement"}`}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {getAccountName(movement.cash_account_id)}
                              </p>
                            </div>

                            <p
                              className={`shrink-0 text-sm font-black ${
                                inflow ? "text-emerald-700" : outflow ? "text-red-600" : "text-slate-700"
                              }`}
                            >
                              {inflow ? "+" : outflow ? "-" : ""}
                              {formatMoney(movement.amount)}
                            </p>
                          </div>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {formatDate(movement.created_at)} · {formatTime(movement.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {recentMovements.length <= 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No cash movements yet.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                    {selectedAccount ? "Manage Cash Account" : "Add Cash Account"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Create or update a business cash account for tracking balances and movements.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAccount(null);
                    resetForm();
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  disabled={saving || uploadingIcon}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_390px]">
                <div className="min-w-0 space-y-5 p-5 sm:p-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">Account Information</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Add the main details for this cash account.
                    </p>
                  </div>

                  <UploadBox
                    url={iconUrl}
                    uploading={uploadingIcon}
                    onChange={uploadIcon}
                    onRemove={() => setIconUrl("")}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Account Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter account name"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Account Type <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={type}
                        onChange={(event) => setType(event.target.value as AccountType)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      >
                        {accountTypes.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Provider / Bank Name
                      </label>

                      <input
                        value={accountNumber}
                        onChange={(event) => setAccountNumber(event.target.value)}
                        placeholder="Enter provider or bank name"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Currency
                      </label>

                      <select
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="PHP">PHP (₱)</option>
                        <option value="USD">USD ($)</option>
                        <option value="THB">THB (฿)</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Opening Balance
                      </label>

                      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                        <div className="flex w-12 items-center justify-center border-r border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                          ₱
                        </div>

                        <input
                          value={balance}
                          onChange={(event) => setBalance(event.target.value)}
                          type="number"
                          placeholder="0.00"
                          className="min-w-0 flex-1 px-4 py-3 text-sm font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-black text-slate-700">Status</p>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStatus("active")}
                          className={`rounded-2xl border p-4 text-left transition ${
                            status === "active"
                              ? "border-blue-300 bg-blue-50 ring-4 ring-blue-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                status === "active" ? "bg-blue-600" : "bg-slate-300"
                              }`}
                            />
                            <span className="font-black text-slate-900">Active</span>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-500">Account is active</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus("inactive")}
                          className={`rounded-2xl border p-4 text-left transition ${
                            status !== "active"
                              ? "border-red-300 bg-red-50 ring-4 ring-red-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                status !== "active" ? "bg-red-500" : "bg-slate-300"
                              }`}
                            />
                            <span className="font-black text-slate-900">Inactive</span>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-500">Account is inactive</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Notes / Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Enter a short description or purpose for this account..."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      These details help you identify the purpose of this cash account.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-950">Optional Details</h4>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Account Number / Reference
                      </label>

                      <input
                        value={provider}
                        onChange={(event) => setProvider(event.target.value)}
                        placeholder="Enter account number or reference"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <PreviewAccountCard
                    name={name}
                    type={type}
                    provider={accountNumber}
                    currency={currency}
                    balance={balance}
                    status={status}
                    description={description}
                    iconUrl={iconUrl}
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedAccount(null);
                    resetForm();
                  }}
                  disabled={saving || uploadingIcon}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                {selectedAccount && (
                  <button
                    type="button"
                    onClick={() => deleteAccount(selectedAccount)}
                    disabled={saving || uploadingIcon}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={saveAccount}
                  disabled={saving || uploadingIcon}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {saving ? "Saving..." : selectedAccount ? "Save Changes" : "Save Cash Account"}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewAccount && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">Cash Account Preview</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review account details, balance, status, and linked information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewAccount(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-6 overflow-y-auto p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                      <AccountIcon iconUrl={previewAccount.icon_url} name={previewAccount.name} size="lg" />
                      <div className="min-w-0">
                        <h4 className="min-w-0 break-words text-xl font-black text-slate-950 sm:text-2xl">{previewAccount.name}</h4>
                        <p className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-500">
                          {previewAccount.account_number || previewAccount.currency || "Cash account"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <TypeBadge type={previewAccount.type} />
                          <StatusBadge status={previewAccount.status} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Balance</p>
                      <p className="mt-2 min-w-0 truncate text-2xl font-black text-emerald-600">
                        {formatMoney(previewAccount.balance)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Currency</p>
                      <p className="mt-2 break-words text-sm font-black text-slate-900">{previewAccount.currency || "PHP"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Account Number / Reference</p>
                      <p className="mt-2 break-words text-sm font-black text-slate-900">{previewAccount.account_number || "—"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Created</p>
                      <p className="mt-2 break-words text-sm font-black text-slate-900">{formatDate(previewAccount.created_at)}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">Description</p>
                    <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-600">
                      {previewAccount.description || "No description added."}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-sm font-black text-slate-700">Quick Actions</p>

                  <div className="mt-4 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewAccount(null);
                        openEditModal(previewAccount);
                      }}
                      className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit Account
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAccount(previewAccount)}
                      className="flex w-full items-center justify-between rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
                    >
                      Delete Account
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

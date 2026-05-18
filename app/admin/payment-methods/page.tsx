"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Edit3,
  Eye,
  Filter,
  ImageIcon,
  Landmark,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UploadCloud,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

type PaymentMethod = {
  id: string;
  name: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
  qr_url: string | null;
  icon_url: string | null;
  is_active: boolean;
  cash_account_id: string | null;
  created_at: string;
};

type CashAccount = {
  id: string;
  name: string;
};

type StatusFilter = "all" | "active" | "inactive";

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

function getLimitText(minAmount: string, maxAmount: string) {
  const min = Number(minAmount || 0);
  const max = Number(maxAmount || 0);

  if (min <= 0 && max <= 0) return "No limits set";
  if (min > 0 && max <= 0) return `${formatMoney(min)} minimum`;
  if (min <= 0 && max > 0) return `Up to ${formatMoney(max)}`;

  return `${formatMoney(min)} - ${formatMoney(max)}`;
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
  tone: "blue" | "green" | "orange" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function MethodLogo({
  url,
  name,
  size = "md",
}: {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-10 w-10 rounded-2xl",
    md: "h-14 w-14 rounded-2xl",
    lg: "h-24 w-24 rounded-3xl",
  }[size];

  const textSize = size === "lg" ? "text-xl" : "text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-blue-50 text-blue-700 ring-1 ring-blue-100 ${sizeClass}`}
    >
      {url ? (
        <img src={url} alt={name || "Payment method"} className="h-full w-full object-cover" />
      ) : (
        <span className={`font-black ${textSize}`}>
          {(name || "P").charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
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

function UploadBox({
  label,
  helper,
  url,
  uploading,
  onChange,
  onRemove,
}: {
  label: string;
  helper: string;
  url: string;
  uploading: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="block text-sm font-black text-slate-700">{label}</label>
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
          <img src={url} alt={label} className="h-full max-h-24 w-full object-contain" />
        ) : (
          <>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 ring-1 ring-slate-200 transition group-hover:text-blue-600">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            </div>
            <p className="mt-3 text-sm font-black text-slate-700">
              {uploading ? "Uploading..." : "Click to upload"}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
          </>
        )}

        <input type="file" accept="image/*" className="hidden" onChange={onChange} disabled={uploading} />
      </label>
    </div>
  );
}

function PreviewCard({
  name,
  accountName,
  accountNumber,
  instructions,
  iconUrl,
  cashAccountName,
  isActive,
  minAmount,
  maxAmount,
}: {
  name: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  iconUrl: string;
  cashAccountName: string;
  isActive: boolean;
  minAmount: string;
  maxAmount: string;
}) {
  const displayName = name || "Payment Method";
  const displayAccountName = accountName || "Account Name";
  const displayAccountNumber = accountNumber || "Account number";
  const displayInstructions =
    instructions || "Instructions will be shown to customers during deposit process.";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-700">Customer Preview</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">
        This is how customers will see this payment method.
      </p>

      <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <MethodLogo url={iconUrl} name={displayName} size="lg" />

          <h4 className="mt-4 text-xl font-black text-slate-950">{displayName}</h4>

          <div className="mt-3">
            <StatusBadge active={isActive} />
          </div>
        </div>

        <div className="mt-6 space-y-4 border-t border-slate-100 pt-5">
          <div className="flex items-start gap-3">
            <CreditCard size={18} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Account Name
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">{displayAccountName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <WalletCards size={18} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Account Number
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">{displayAccountNumber}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 size={18} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Cash Account
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">{cashAccountName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Landmark size={18} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Limits</p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {getLimitText(minAmount, maxAmount)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ImageIcon size={18} className="mt-0.5 text-slate-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Instructions
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                {displayInstructions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [previewMethod, setPreviewMethod] = useState<PaymentMethod | null>(null);

  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [cashAccountId, setCashAccountId] = useState("");
  const [minAmount, setMinAmount] = useState("10");
  const [maxAmount, setMaxAmount] = useState("50000");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [cashAccountFilter, setCashAccountFilter] = useState("all");

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMethods((data || []) as PaymentMethod[]);
    setLoading(false);
  }

  async function loadCashAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("id, name")
      .order("name");

    if (!error) {
      setCashAccounts((data || []) as CashAccount[]);
    }
  }

  useEffect(() => {
    loadMethods();
    loadCashAccounts();
  }, []);

  function resetForm() {
    setName("");
    setAccountName("");
    setAccountNumber("");
    setInstructions("");
    setQrUrl("");
    setIconUrl("");
    setIsActive(true);
    setCashAccountId("");
    setMinAmount("10");
    setMaxAmount("50000");
  }

  function getCashAccountName(id: string | null) {
    if (!id) return "Not linked";
    return cashAccounts.find((account) => account.id === id)?.name || "Not linked";
  }

  function openAddModal() {
    resetForm();
    setSelectedMethod(null);
    setShowModal(true);
    setMessage("");
  }

  function openManage(method: PaymentMethod) {
    setSelectedMethod(method);
    setName(method.name || "");
    setAccountName(method.account_name || "");
    setAccountNumber(method.account_number || "");
    setInstructions(method.instructions || "");
    setQrUrl(method.qr_url || "");
    setIconUrl(method.icon_url || "");
    setIsActive(Boolean(method.is_active));
    setCashAccountId(method.cash_account_id || "");

    const maybeMin = (method as unknown as { min_amount?: number | string | null }).min_amount;
    const maybeMax = (method as unknown as { max_amount?: number | string | null }).max_amount;

    setMinAmount(String(maybeMin ?? "10"));
    setMaxAmount(String(maybeMax ?? "50000"));

    setShowModal(true);
    setMessage("");
  }

  async function uploadImage(file: File, folder: "icons" | "qrs") {
    const extension = file.name.split(".").pop() || "png";
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error } = await supabase.storage
      .from("payment-method-qrs")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setMessage(error.message);
      return null;
    }

    const { data } = supabase.storage.from("payment-method-qrs").getPublicUrl(fileName);

    return data.publicUrl;
  }

  async function handleIconUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    const publicUrl = await uploadImage(file, "icons");

    if (publicUrl) {
      setIconUrl(publicUrl);
      setMessage("Payment method icon uploaded.");
    }

    setUploadingIcon(false);
    event.target.value = "";
  }

  async function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    const publicUrl = await uploadImage(file, "qrs");

    if (publicUrl) {
      setQrUrl(publicUrl);
      setMessage("QR code image uploaded.");
    }

    setUploadingQr(false);
    event.target.value = "";
  }

  function validateForm() {
    if (!name.trim()) {
      setMessage("Payment method name is required.");
      return false;
    }

    if (!accountName.trim()) {
      setMessage("Account name is required.");
      return false;
    }

    if (!accountNumber.trim()) {
      setMessage("Account number / reference is required.");
      return false;
    }

    if (!cashAccountId) {
      setMessage("Please select a linked cash account.");
      return false;
    }

    if (!qrUrl) {
      setMessage("Please upload a QR code image.");
      return false;
    }

    return true;
  }

  async function addMethod() {
    if (saving) return;
    if (!validateForm()) return;

    setSaving(true);

    const { error } = await supabase.from("payment_methods").insert({
      name: name.trim(),
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      instructions: instructions.trim(),
      qr_url: qrUrl,
      icon_url: iconUrl || null,
      is_active: isActive,
      cash_account_id: cashAccountId || null,
      min_amount: Number(minAmount || 0),
      max_amount: Number(maxAmount || 0),
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Payment method added successfully.");
    resetForm();
    setShowModal(false);
    setSaving(false);
    loadMethods();
  }

  async function updateMethod() {
    if (saving) return;
    if (!selectedMethod) return;
    if (!validateForm()) return;

    setSaving(true);

    const { error } = await supabase
      .from("payment_methods")
      .update({
        name: name.trim(),
        account_name: accountName.trim(),
        account_number: accountNumber.trim(),
        instructions: instructions.trim(),
        qr_url: qrUrl,
        icon_url: iconUrl || null,
        is_active: isActive,
        cash_account_id: cashAccountId || null,
        min_amount: Number(minAmount || 0),
        max_amount: Number(maxAmount || 0),
      })
      .eq("id", selectedMethod.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Payment method updated.");
    setSelectedMethod(null);
    resetForm();
    setShowModal(false);
    setSaving(false);
    loadMethods();
  }

  async function deleteMethod(method?: PaymentMethod | null) {
    const target = method || selectedMethod;

    if (!target) return;

    const confirmDelete = confirm(`Delete "${target.name}" payment method?`);

    if (!confirmDelete) return;

    const { error } = await supabase.from("payment_methods").delete().eq("id", target.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Payment method deleted.");
    setSelectedMethod(null);
    resetForm();
    setShowModal(false);
    loadMethods();
  }

  const stats = useMemo(() => {
    const active = methods.filter((method) => method.is_active).length;
    const inactive = methods.filter((method) => !method.is_active).length;
const totalCashAccounts = cashAccounts.length;

return {
  total: methods.length,
  active,
  inactive,
  totalCashAccounts,
};
  }, [methods, cashAccounts]);

  const filteredMethods = useMemo(() => {
    const query = search.toLowerCase().trim();

    return methods.filter((method) => {
      const matchesSearch =
        !query ||
        String(method.name || "").toLowerCase().includes(query) ||
        String(method.account_name || "").toLowerCase().includes(query) ||
        String(method.account_number || "").toLowerCase().includes(query) ||
        String(method.instructions || "").toLowerCase().includes(query) ||
        getCashAccountName(method.cash_account_id).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? method.is_active
            : !method.is_active;

      const matchesCash =
        cashAccountFilter === "all" ? true : method.cash_account_id === cashAccountFilter;

      return matchesSearch && matchesStatus && matchesCash;
    });
  }, [cashAccountFilter, methods, search, statusFilter, cashAccounts]);

  return (
    <AdminGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-sm">
                <CreditCard size={25} />
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Payment Methods
                </h2>

                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                  Manage all available payment methods, uploaded icons, QR codes, account details, and linked cash accounts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Payment Method
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Methods"
              value={String(stats.total)}
              subtitle="All payment methods"
              icon={<CreditCard size={26} />}
              tone="blue"
            />

            <StatCard
              title="Active Methods"
              value={String(stats.active)}
              subtitle="Currently active"
              icon={<CheckCircle2 size={26} />}
              tone="green"
            />

            <StatCard
              title="Inactive Methods"
              value={String(stats.inactive)}
              subtitle="Currently inactive"
              icon={<XCircle size={26} />}
              tone="orange"
            />

<StatCard
  title="Cash Accounts"
  value={String(stats.totalCashAccounts)}
  subtitle="Saved cash accounts"
  icon={<Landmark size={26} />}
  tone="purple"
/>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-100 p-5 xl:grid-cols-[1.2fr_0.6fr_0.6fr_auto]">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search payment methods..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={cashAccountFilter}
                onChange={(event) => setCashAccountFilter(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
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
                  setStatusFilter("all");
                  setCashAccountFilter("all");
                  loadMethods();
                  loadCashAccounts();
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">#</th>
                    <th className="px-5 py-4 text-left">Payment Method</th>
                    <th className="px-5 py-4 text-left">Cash Account</th>
                    <th className="px-5 py-4 text-left">Account Details</th>
                    <th className="px-5 py-4 text-left">Limits</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Created</th>
                    <th className="px-5 py-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMethods.map((method, index) => {
                    const methodMin = String(
                      (method as unknown as { min_amount?: number | string | null }).min_amount ?? "10",
                    );

                    const methodMax = String(
                      (method as unknown as { max_amount?: number | string | null }).max_amount ?? "50000",
                    );

                    return (
                      <tr key={method.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top font-black text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-4">
                            <MethodLogo url={method.icon_url} name={method.name} size="md" />

                            <div className="min-w-0">
                              <p className="font-black text-slate-900">{method.name}</p>
                              <p className="mt-1 max-w-[240px] text-sm font-semibold leading-5 text-slate-500">
                                {method.instructions || "No instructions added."}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-slate-800">
                            {getCashAccountName(method.cash_account_id)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Linked account
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-slate-800">
                            {method.account_name || "—"}
                          </p>
                          <p className="mt-1 max-w-[170px] truncate text-sm font-semibold text-slate-500">
                            {method.account_number || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top font-black text-slate-800">
                          {getLimitText(methodMin, methodMax)}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge active={method.is_active} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-slate-700">{formatDate(method.created_at)}</p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewMethod(method)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openManage(method)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50"
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteMethod(method)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMethods.length <= 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                            <CreditCard size={26} />
                          </div>

                          <h3 className="mt-4 text-lg font-black text-slate-950">
                            No payment methods found
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Try clearing your search or add your first payment method.
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
                Showing <span className="font-black text-slate-800">{filteredMethods.length}</span>{" "}
                of <span className="font-black text-slate-800">{methods.length}</span>{" "}
                payment methods
              </p>

              <p>{loading ? "Loading payment methods..." : "Payment methods loaded"}</p>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {selectedMethod ? "Manage Payment Method" : "Add Payment Method"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Create or update a deposit method with icon, QR code, account details, and customer instructions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethod(null);
                    resetForm();
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  disabled={saving || uploadingIcon || uploadingQr}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[1fr_380px]">
                <div className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <UploadBox
                      label="Payment Method Icon"
                      helper="PNG, JPG, WEBP. Recommended 512x512."
                      url={iconUrl}
                      uploading={uploadingIcon}
                      onChange={handleIconUpload}
                      onRemove={() => setIconUrl("")}
                    />

                    <UploadBox
                      label="QR Code Image"
                      helper="PNG, JPG, WEBP. Max 2MB recommended."
                      url={qrUrl}
                      uploading={uploadingQr}
                      onChange={handleQrUpload}
                      onRemove={() => setQrUrl("")}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Payment Method Name <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. GCash, Maya, BPI Bank Transfer"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Cash Account <span className="text-red-500">*</span>
                      </label>

                      <select
                        value={cashAccountId}
                        onChange={(event) => setCashAccountId(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Select cash account</option>
                        {cashAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Account Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        value={accountName}
                        onChange={(event) => setAccountName(event.target.value)}
                        placeholder="e.g. Juan Dela Cruz / Ascend Service"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Account Number / Reference <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value)}
                      placeholder="e.g. 0917 123 4567 or account number"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Minimum Amount (PHP)
                      </label>

                      <input
                        type="number"
                        value={minAmount}
                        onChange={(event) => setMinAmount(event.target.value)}
                        placeholder="10"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Maximum Amount (PHP)
                      </label>

                      <input
                        type="number"
                        value={maxAmount}
                        onChange={(event) => setMaxAmount(event.target.value)}
                        placeholder="50000"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Instructions
                    </label>

                    <textarea
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      placeholder="Example: Scan the QR code or send payment to our GCash number. Upload your proof after payment."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      These instructions will be shown to customers during deposit process.
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">
                      Status <span className="text-red-500">*</span>
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isActive
                            ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          />
                          <span className="font-black text-slate-900">Active</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Method is visible to customers.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          !isActive
                            ? "border-red-300 bg-red-50 ring-4 ring-red-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${
                              !isActive ? "bg-red-500" : "bg-slate-300"
                            }`}
                          />
                          <span className="font-black text-slate-900">Inactive</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Method is hidden from customers.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/60 p-6 lg:border-l lg:border-t-0">
                  <PreviewCard
                    name={name}
                    accountName={accountName}
                    accountNumber={accountNumber}
                    instructions={instructions}
                    iconUrl={iconUrl}
                    cashAccountName={getCashAccountName(cashAccountId)}
                    isActive={isActive}
                    minAmount={minAmount}
                    maxAmount={maxAmount}
                  />

                  {qrUrl && (
                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-sm font-black text-slate-700">QR Code Preview</p>
                      <img
                        src={qrUrl}
                        alt="QR code preview"
                        className="mt-4 h-64 w-full rounded-3xl border border-slate-200 bg-slate-50 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethod(null);
                    resetForm();
                  }}
                  disabled={saving || uploadingIcon || uploadingQr}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                {selectedMethod && (
                  <button
                    type="button"
                    onClick={() => deleteMethod(selectedMethod)}
                    disabled={saving || uploadingIcon || uploadingQr}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                )}

                <button
                  type="button"
                  onClick={selectedMethod ? updateMethod : addMethod}
                  disabled={saving || uploadingIcon || uploadingQr}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {saving ? "Saving..." : selectedMethod ? "Save Changes" : "Save Payment Method"}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewMethod && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Payment Method Preview</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review the payment method details and customer-facing information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewMethod(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                    <div className="flex items-center gap-4">
                      <MethodLogo url={previewMethod.icon_url} name={previewMethod.name} size="lg" />
                      <div>
                        <h4 className="text-2xl font-black text-slate-950">{previewMethod.name}</h4>
                        <div className="mt-2">
                          <StatusBadge active={previewMethod.is_active} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Account Name
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {previewMethod.account_name || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Account Number
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {previewMethod.account_number || "—"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Cash Account
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {getCashAccountName(previewMethod.cash_account_id)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Created
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {formatDate(previewMethod.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Instructions
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                      {previewMethod.instructions || "No instructions added."}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-black text-slate-700">QR Code</p>
                  {previewMethod.qr_url ? (
                    <img
                      src={previewMethod.qr_url}
                      alt={`${previewMethod.name} QR code`}
                      className="h-[360px] w-full rounded-3xl border border-slate-200 bg-slate-50 object-contain"
                    />
                  ) : (
                    <div className="flex h-[360px] w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-400">
                      <ImageIcon size={40} />
                      <p className="mt-3 text-sm font-bold">No QR uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

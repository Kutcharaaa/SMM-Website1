"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Edit3,
  Eye,
  Globe2,
  Loader2,
  Percent,
  Plus,
  RefreshCw,
  Save,
  Search,
  ToggleLeft,
  ToggleRight,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Currency = {
  id: string;
  currency_code: string;
  currency_name: string;
  is_enabled: boolean;
  market_rate: number;
  panel_rate: number;
  last_synced_at: string | null;
};

type ModalMode = "add" | "edit" | "view" | null;
type StatusFilter = "all" | "enabled" | "disabled";

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Enabled", value: "enabled" },
  { label: "Disabled", value: "disabled" },
];

const currencySymbols: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  THB: "฿",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  HKD: "HK$",
  MYR: "RM",
  IDR: "Rp",
  INR: "₹",
  VND: "₫",
  AED: "د.إ",
  SAR: "﷼",
};

const currencyFlags: Record<string, string> = {
  PHP: "🇵🇭",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  KRW: "🇰🇷",
  THB: "🇹🇭",
  SGD: "🇸🇬",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  HKD: "🇭🇰",
  MYR: "🇲🇾",
  IDR: "🇮🇩",
  INR: "🇮🇳",
  VND: "🇻🇳",
  AED: "🇦🇪",
  SAR: "🇸🇦",
};

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function getCurrencySymbol(code: string) {
  return currencySymbols[normalizeCode(code)] || normalizeCode(code);
}

function getCurrencyFlag(code: string) {
  return currencyFlags[normalizeCode(code)] || "¤";
}

function calculatePanelRate(marketRate: number | string, marginPercent: number | string) {
  const market = Number(marketRate || 0);
  const margin = Number(marginPercent || 0);

  return market * (1 - margin / 100);
}

function formatNumber(value: number | string | null | undefined, digits = 4) {
  return Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "Never synced";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(value?: string | null) {
  if (!value) return "Never";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  return `${days} day${days === 1 ? "" : "s"} ago`;
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
  tone: "blue" | "green" | "purple" | "orange";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
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

function CurrencyBadge({ code, name }: { code: string; name?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl ring-1 ring-blue-100">
        {getCurrencyFlag(code)}
      </div>

      <div className="min-w-0">
        <p className="font-black text-slate-950">{normalizeCode(code)}</p>
        <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-slate-500">
          {name || "Currency"}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        enabled
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-500" : "bg-red-500"}`} />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function InfoBox({
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

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [marginPercent, setMarginPercent] = useState("5");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [savingMargin, setSavingMargin] = useState(false);
  const [syncingRates, setSyncingRates] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  const [currencyCode, setCurrencyCode] = useState("");
  const [currencyName, setCurrencyName] = useState("");
  const [marketRate, setMarketRate] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  async function loadCurrencies() {
    setLoading(true);

    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("currency_code", { ascending: true });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setCurrencies((data || []) as Currency[]);
    setLoading(false);
  }

  async function loadMarginSetting() {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("margin_percent")
      .eq("id", 1)
      .single();

    if (!error && data) {
      setMarginPercent(String(data.margin_percent ?? 5));
    }
  }

  useEffect(() => {
    loadCurrencies();
    loadMarginSetting();
  }, []);

  function resetCurrencyForm() {
    setSelectedCurrency(null);
    setCurrencyCode("");
    setCurrencyName("");
    setMarketRate("");
    setIsEnabled(true);
  }

  function openAddModal() {
    resetCurrencyForm();
    setModalMode("add");
    setMessage("");
  }

  function openEditModal(currency: Currency) {
    setSelectedCurrency(currency);
    setCurrencyCode(currency.currency_code || "");
    setCurrencyName(currency.currency_name || "");
    setMarketRate(String(currency.market_rate || ""));
    setIsEnabled(Boolean(currency.is_enabled));
    setModalMode("edit");
    setMessage("");
  }

  function openViewModal(currency: Currency) {
    setSelectedCurrency(currency);
    setModalMode("view");
    setMessage("");
  }

  function closeModal() {
    setModalMode(null);
    resetCurrencyForm();
  }

  async function saveMargin() {
    setSavingMargin(true);

    const numericMargin = Number(marginPercent || 0);

    const { error } = await supabase
      .from("platform_settings")
      .upsert({
        id: 1,
        margin_percent: numericMargin,
      });

    if (error) {
      setMessage(error.message);
      setSavingMargin(false);
      return;
    }

    const updatePromises = currencies.map((currency) => {
      const panelRate = calculatePanelRate(currency.market_rate, numericMargin);

      return supabase
        .from("exchange_rates")
        .update({ panel_rate: panelRate })
        .eq("id", currency.id);
    });

    await Promise.all(updatePromises);

    setMessage("Margin percent saved and panel rates recalculated.");
    setSavingMargin(false);
    loadCurrencies();
  }

  async function syncLiveRates() {
    setSyncingRates(true);
    setMessage("Syncing live exchange rates...");

    try {
      const response = await fetch("/api/sync-exchange-rates", {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to sync exchange rates.");
        setSyncingRates(false);
        return;
      }

      setMessage(result.message || "Exchange rates synced successfully.");
      await loadCurrencies();
    } catch {
      setMessage("Failed to sync exchange rates.");
    }

    setSyncingRates(false);
  }

  function validateCurrencyForm() {
    if (!currencyCode.trim()) {
      setMessage("Currency code is required.");
      return false;
    }

    if (!currencyName.trim()) {
      setMessage("Currency name is required.");
      return false;
    }

    if (!marketRate || Number(marketRate) <= 0) {
      setMessage("Market rate must be greater than 0.");
      return false;
    }

    return true;
  }

  async function addCurrency() {
    if (savingCurrency) return;
    if (!validateCurrencyForm()) return;

    const code = normalizeCode(currencyCode);
    const panelRate = calculatePanelRate(marketRate, marginPercent);

    setSavingCurrency(true);

    const { error } = await supabase.from("exchange_rates").insert({
      currency_code: code,
      currency_name: currencyName.trim(),
      market_rate: Number(marketRate || 0),
      panel_rate: panelRate,
      is_enabled: isEnabled,
      last_synced_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setSavingCurrency(false);
      return;
    }

    setMessage(`${code} currency added successfully.`);
    setSavingCurrency(false);
    closeModal();
    loadCurrencies();
  }

  async function updateCurrency() {
    if (savingCurrency) return;
    if (!selectedCurrency) return;
    if (!validateCurrencyForm()) return;

    const code = normalizeCode(currencyCode);
    const panelRate = calculatePanelRate(marketRate, marginPercent);

    setSavingCurrency(true);

    const { error } = await supabase
      .from("exchange_rates")
      .update({
        currency_code: code,
        currency_name: currencyName.trim(),
        market_rate: Number(marketRate || 0),
        panel_rate: panelRate,
        is_enabled: isEnabled,
      })
      .eq("id", selectedCurrency.id);

    if (error) {
      setMessage(error.message);
      setSavingCurrency(false);
      return;
    }

    setMessage(`${code} currency updated successfully.`);
    setSavingCurrency(false);
    closeModal();
    loadCurrencies();
  }

  async function toggleCurrency(currency: Currency) {
    const nextEnabled = !currency.is_enabled;

    const { error } = await supabase
      .from("exchange_rates")
      .update({ is_enabled: nextEnabled })
      .eq("id", currency.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      `${currency.currency_code} ${nextEnabled ? "enabled" : "disabled"} successfully.`,
    );
    loadCurrencies();
  }

  const filteredCurrencies = useMemo(() => {
    const query = search.toLowerCase().trim();

    return currencies.filter((currency) => {
      const matchesSearch =
        !query ||
        String(currency.currency_code || "").toLowerCase().includes(query) ||
        String(currency.currency_name || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "enabled"
            ? currency.is_enabled
            : !currency.is_enabled;

      return matchesSearch && matchesStatus;
    });
  }, [currencies, search, statusFilter]);

  const stats = useMemo(() => {
    const enabled = currencies.filter((currency) => currency.is_enabled).length;
    const lastSyncedCurrency = [...currencies]
      .filter((currency) => currency.last_synced_at)
      .sort(
        (a, b) =>
          new Date(b.last_synced_at || 0).getTime() -
          new Date(a.last_synced_at || 0).getTime(),
      )[0];

    return {
      baseCurrency: "PHP",
      enabled,
      total: currencies.length,
      lastSync: timeAgo(lastSyncedCurrency?.last_synced_at),
      lastSyncDate: lastSyncedCurrency?.last_synced_at || null,
    };
  }, [currencies]);

  const previewPanelRate = calculatePanelRate(marketRate, marginPercent);
  const selectedMarginDifference =
    Number(marketRate || 0) - Number(previewPanelRate || 0);

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Currencies
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage exchange rates, margin configuration, and panel pricing.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Currency
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Base Currency"
              value={stats.baseCurrency}
              subtitle="Philippine Peso"
              icon={<WalletCards size={26} />}
              tone="blue"
            />

            <StatCard
              title="Enabled Currencies"
              value={String(stats.enabled)}
              subtitle={`of ${stats.total} total`}
              icon={<Globe2 size={26} />}
              tone="green"
            />

            <StatCard
              title="Margin Percent"
              value={`${Number(marginPercent || 0).toFixed(2)}%`}
              subtitle="Global exchange margin"
              icon={<Percent size={26} />}
              tone="purple"
            />

            <StatCard
              title="Last Sync"
              value={stats.lastSync}
              subtitle={
                stats.lastSyncDate
                  ? `${formatDate(stats.lastSyncDate)} ${formatTime(stats.lastSyncDate)}`
                  : "No sync record"
              }
              icon={<RefreshCw size={26} />}
              tone="orange"
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto] xl:items-end">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Global Margin %
                </label>

                <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
                  <input
                    type="number"
                    value={marginPercent}
                    onChange={(event) => setMarginPercent(event.target.value)}
                    className="min-w-0 flex-1 px-4 py-3 text-sm font-black text-slate-800 outline-none"
                  />

                  <div className="flex w-14 items-center justify-center border-l border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                    %
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={saveMargin}
                disabled={savingMargin}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingMargin ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                {savingMargin ? "Saving..." : "Save Margin"}
              </button>

              <button
                type="button"
                onClick={syncLiveRates}
                disabled={syncingRates}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncingRates ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                {syncingRates ? "Syncing..." : "Sync Live Rates"}
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Plus size={17} />
                Add Currency
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-blue-700">
              Panel rate = market rate minus the configured margin percentage. PHP remains the fixed base currency.
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[1fr_220px_auto]">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search currency code or name..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
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
                  setSearch("");
                  setStatusFilter("all");
                  loadCurrencies();
                  loadMarginSetting();
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Currency</th>
                    <th className="px-5 py-4 text-left">Market Rate (PHP)</th>
                    <th className="px-5 py-4 text-left">Panel Rate (PHP)</th>
                    <th className="px-5 py-4 text-left">Margin Difference</th>
                    <th className="px-5 py-4 text-left">Last Sync</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCurrencies.map((currency) => {
                    const difference =
                      Number(currency.market_rate || 0) - Number(currency.panel_rate || 0);
                    const marginRate =
                      Number(currency.market_rate || 0) > 0
                        ? (difference / Number(currency.market_rate || 1)) * 100
                        : 0;

                    return (
                      <tr key={currency.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top">
                          <CurrencyBadge
                            code={currency.currency_code}
                            name={currency.currency_name}
                          />
                        </td>

                        <td className="px-5 py-5 align-top font-black text-slate-800">
                          {formatNumber(currency.market_rate)}
                        </td>

                        <td className="px-5 py-5 align-top font-black text-blue-600">
                          {formatNumber(currency.panel_rate)}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-emerald-600">
                            -{formatNumber(difference)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-600">
                            ({marginRate.toFixed(2)}%)
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-slate-700">
                            {formatDate(currency.last_synced_at)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {formatTime(currency.last_synced_at)}
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge enabled={currency.is_enabled} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openViewModal(currency)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="View currency"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(currency)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-white text-blue-700 transition hover:bg-blue-50"
                              title="Edit currency"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleCurrency(currency)}
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition ${
                                currency.is_enabled
                                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              }`}
                              title={currency.is_enabled ? "Disable currency" : "Enable currency"}
                            >
                              {currency.is_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCurrencies.length <= 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                            <Globe2 size={26} />
                          </div>

                          <h3 className="mt-4 text-lg font-black text-slate-950">
                            No currencies found
                          </h3>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Try clearing your search or add a new currency.
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
                Showing <span className="font-black text-slate-800">{filteredCurrencies.length}</span>{" "}
                of <span className="font-black text-slate-800">{currencies.length}</span> currencies
              </p>

              <p>{loading ? "Loading currencies..." : "Currencies loaded"}</p>
            </div>
          </div>
        </div>

        {(modalMode === "add" || modalMode === "edit") && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {modalMode === "edit" ? "Manage Currency" : "Add New Currency"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Configure currency details and rate settings. Flags are displayed automatically by currency code.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingCurrency}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[1fr_360px]">
                <div className="space-y-5 p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Currency Code <span className="text-red-500">*</span>
                      </label>

                      <input
                        value={currencyCode}
                        onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
                        placeholder="e.g. JPY"
                        maxLength={6}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold uppercase text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Currency Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        value={currencyName}
                        onChange={(event) => setCurrencyName(event.target.value)}
                        placeholder="e.g. Japanese Yen"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Symbol
                      </label>

                      <input
                        value={getCurrencySymbol(currencyCode)}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Market Rate (PHP) <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        value={marketRate}
                        onChange={(event) => setMarketRate(event.target.value)}
                        placeholder="e.g. 0.3750"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Margin %
                      </label>

                      <div className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <input
                          value={marginPercent}
                          onChange={(event) => setMarginPercent(event.target.value)}
                          type="number"
                          className="min-w-0 flex-1 px-4 py-3 text-sm font-bold text-slate-800 outline-none"
                        />
                        <div className="flex w-14 items-center justify-center border-l border-slate-200 bg-slate-50 text-sm font-black text-slate-500">
                          %
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Panel Rate Preview (PHP)
                      </label>

                      <input
                        value={formatNumber(previewPanelRate)}
                        readOnly
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">Status</p>

                    <button
                      type="button"
                      onClick={() => setIsEnabled((current) => !current)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                        isEnabled
                          ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-50"
                          : "border-red-300 bg-red-50 ring-4 ring-red-50"
                      }`}
                    >
                      <div>
                        <p className="font-black text-slate-900">
                          {isEnabled ? "Enabled" : "Disabled"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {isEnabled
                            ? "Currency is visible and available to users."
                            : "Currency is hidden from users."}
                        </p>
                      </div>

                      {isEnabled ? (
                        <ToggleRight size={30} className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={30} className="text-red-500" />
                      )}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                    Currency flags are automatically shown using the currency code. No upload or extra storage bucket is needed.
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700">Currency Preview</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      This is how the currency will appear.
                    </p>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl ring-1 ring-blue-100">
                          {getCurrencyFlag(currencyCode)}
                        </div>

                        <div>
                          <h4 className="text-xl font-black text-slate-950">
                            {normalizeCode(currencyCode) || "CODE"} — {currencyName || "Currency Name"}
                          </h4>
                          <div className="mt-2">
                            <StatusBadge enabled={isEnabled} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <InfoBox label="Symbol" value={getCurrencySymbol(currencyCode)} />
                        <InfoBox label="Market Rate (PHP)" value={formatNumber(marketRate || 0)} />
                        <InfoBox label="Margin" value={`${Number(marginPercent || 0).toFixed(2)}%`} />
                        <InfoBox
                          label="Panel Rate (PHP)"
                          value={formatNumber(previewPanelRate)}
                          valueClassName="text-blue-600"
                        />
                        <InfoBox
                          label="Margin Difference"
                          value={`-${formatNumber(selectedMarginDifference)}`}
                          valueClassName="text-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingCurrency}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={modalMode === "edit" ? updateCurrency : addCurrency}
                  disabled={savingCurrency}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingCurrency ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {savingCurrency ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Save Currency"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalMode === "view" && selectedCurrency && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Currency Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review exchange rate and panel rate information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl ring-1 ring-blue-100">
                    {getCurrencyFlag(selectedCurrency.currency_code)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">
                      {selectedCurrency.currency_code} — {selectedCurrency.currency_name}
                    </h4>

                    <div className="mt-2">
                      <StatusBadge enabled={selectedCurrency.is_enabled} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox label="Currency Code" value={selectedCurrency.currency_code} />
                  <InfoBox label="Symbol" value={getCurrencySymbol(selectedCurrency.currency_code)} />
                  <InfoBox label="Market Rate (PHP)" value={formatNumber(selectedCurrency.market_rate)} />
                  <InfoBox
                    label="Panel Rate (PHP)"
                    value={formatNumber(selectedCurrency.panel_rate)}
                    valueClassName="text-blue-600"
                  />
                  <InfoBox label="Last Sync Date" value={formatDate(selectedCurrency.last_synced_at)} />
                  <InfoBox label="Last Sync Time" value={formatTime(selectedCurrency.last_synced_at) || "—"} />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedCurrency;
                      closeModal();
                      openEditModal(current);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <Edit3 size={17} />
                    Edit Currency
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

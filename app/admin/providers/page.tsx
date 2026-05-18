"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  Filter,
  KeyRound,
  Layers3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Save,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  Wifi,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Provider = {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  status: string;
  mode: string;
  balance: number | null;
  auto_disable_low_balance?: boolean | null;
  low_balance_threshold?: number | null;
  created_at?: string | null;
};

type ImportedService = {
  provider_service_id: string;
  name: string;
  category: string;
  price: number;
  min: number;
  max: number;
  type: string;
  refill: boolean;
  cancel: boolean;
};

type PanelService = {
  id: string;
  provider_id: string | null;
  provider_name: string | null;
};

type StatusFilter = "all" | "active" | "inactive";
type ModeFilter = "all" | "auto" | "manual";
type ProviderModalMode = "add" | "edit" | "view" | null;

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const modeOptions: { label: string; value: ModeFilter }[] = [
  { label: "All Modes", value: "all" },
  { label: "Auto", value: "auto" },
  { label: "Manual", value: "manual" },
];

function normalizeStatus(status?: string | null) {
  return String(status || "inactive").toLowerCase().trim();
}

function normalizeMode(mode?: string | null) {
  return String(mode || "manual").toLowerCase().trim();
}

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatUsd(value: number | string | null | undefined) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
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

function shortProviderId(id: string) {
  return `#${String(id).slice(0, 6).toUpperCase()}`;
}

function shortText(value?: string | null, length = 34) {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}...` : value;
}

function getProviderInitial(name?: string | null) {
  return String(name || "P").charAt(0).toUpperCase();
}

function getPanelPricePhp(service: ImportedService, usdRate: number, markupPercent: string) {
  const base = Number(service.price || 0) * Number(usdRate || 0);
  const markup = Number(markupPercent || 0) / 100;

  return base * (1 + markup);
}

function ProviderAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white shadow-sm">
      {getProviderInitial(name)}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const active = normalizeStatus(status) === "active";

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

function ModeBadge({ mode }: { mode?: string | null }) {
  const auto = normalizeMode(mode) === "auto";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
        auto
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-blue-50 text-blue-700 ring-blue-100"
      }`}
    >
      {auto ? "Auto" : "Manual"}
    </span>
  );
}

function ToggleSwitch({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
        enabled ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
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
          <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  title,
  children,
  onClick,
  disabled,
  tone = "slate",
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "slate" | "blue" | "green" | "red" | "purple";
}) {
  const toneClass = {
    slate: "border-slate-200 text-slate-600 hover:bg-slate-50",
    blue: "border-blue-200 text-blue-700 hover:bg-blue-50",
    green: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    red: "border-red-200 text-red-700 hover:bg-red-50",
    purple: "border-purple-200 text-purple-700 hover:bg-purple-50",
  }[tone];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
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

function HealthItem({
  icon,
  title,
  subtitle,
  value,
  iconClassName,
  valueClassName,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  value: string;
  iconClassName: string;
  valueClassName: string;
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

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [panelServices, setPanelServices] = useState<PanelService[]>([]);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState("1000");
  const [autoDisableLowBalance, setAutoDisableLowBalance] = useState(false);
  const [status, setStatus] = useState("active");
  const [mode, setMode] = useState("manual");

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [modalMode, setModalMode] = useState<ProviderModalMode>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [importModal, setImportModal] = useState(false);
  const [importProvider, setImportProvider] = useState<Provider | null>(null);
  const [importedServices, setImportedServices] = useState<ImportedService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [importSearch, setImportSearch] = useState("");
  const [markupPercent, setMarkupPercent] = useState("30");
  const [importing, setImporting] = useState(false);

  const [usdMarketRate, setUsdMarketRate] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");

  async function loadProviders() {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setProviders((data || []) as Provider[]);
  }

async function loadPanelServices() {
  let allServices: PanelService[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const to = from + batchSize - 1;

    const { data, error } = await supabase
      .from("services")
      .select("id, provider_id, provider_name")
      .range(from, to);

    if (error) {
      setMessage(error.message);
      break;
    }

    const batch = (data || []) as PanelService[];

    allServices = [...allServices, ...batch];

    if (batch.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  setPanelServices(allServices);
}

  async function loadUsdMarketRate() {
    const { data } = await supabase
      .from("exchange_rates")
      .select("market_rate")
      .eq("currency_code", "USD")
      .single();

    setUsdMarketRate(Number(data?.market_rate || 0));
  }

  useEffect(() => {
    loadProviders();
    loadPanelServices();
    loadUsdMarketRate();

    const interval = setInterval(() => {
      loadProviders();
      loadPanelServices();
      loadUsdMarketRate();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  function clearForm() {
    setSelectedProvider(null);
    setName("");
    setApiUrl("");
    setApiKey("");
    setLowBalanceThreshold("1000");
    setAutoDisableLowBalance(false);
    setStatus("active");
    setMode("manual");
  }

  function openAddModal() {
    clearForm();
    setModalMode("add");
    setMessage("");
  }

  function openEditModal(provider: Provider) {
    setSelectedProvider(provider);
    setName(provider.name || "");
    setApiUrl(provider.api_url || "");
    setApiKey(provider.api_key || "");
    setLowBalanceThreshold(String(provider.low_balance_threshold || 1000));
    setAutoDisableLowBalance(Boolean(provider.auto_disable_low_balance));
    setStatus(provider.status || "active");
    setMode(provider.mode || "manual");
    setModalMode("edit");
    setMessage("");
  }

  function openViewModal(provider: Provider) {
    setSelectedProvider(provider);
    setModalMode("view");
    setMessage("");
  }

  function closeModal() {
    setModalMode(null);
    clearForm();
  }

  function validateProviderForm() {
    if (!name.trim() || !apiUrl.trim() || !apiKey.trim()) {
      setMessage("Please complete provider name, API URL, and API key.");
      return false;
    }

    if (Number(lowBalanceThreshold || 0) < 0) {
      setMessage("Low balance threshold cannot be negative.");
      return false;
    }

    return true;
  }

  async function addProvider() {
    if (loading) return;
    if (!validateProviderForm()) return;

    setLoading(true);

    const { error } = await supabase.from("providers").insert({
      name: name.trim(),
      api_url: apiUrl.trim(),
      api_key: apiKey.trim(),
      status,
      mode,
      balance: 0,
      auto_disable_low_balance: autoDisableLowBalance,
      low_balance_threshold: Number(lowBalanceThreshold || 0),
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Provider added successfully.");
    closeModal();
    loadProviders();
  }

  async function updateProvider() {
    if (loading) return;
    if (!selectedProvider) return;
    if (!validateProviderForm()) return;

    setLoading(true);

    const { error } = await supabase
      .from("providers")
      .update({
        name: name.trim(),
        api_url: apiUrl.trim(),
        api_key: apiKey.trim(),
        status,
        mode,
        auto_disable_low_balance: autoDisableLowBalance,
        low_balance_threshold: Number(lowBalanceThreshold || 0),
      })
      .eq("id", selectedProvider.id);

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Provider updated successfully.");
    closeModal();
    loadProviders();
  }

  async function toggleProviderStatus(provider: Provider) {
    const nextStatus = normalizeStatus(provider.status) === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("providers")
      .update({ status: nextStatus })
      .eq("id", provider.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadProviders();
  }

  async function toggleProviderMode(provider: Provider) {
    const nextMode = normalizeMode(provider.mode) === "manual" ? "auto" : "manual";

    const { error } = await supabase
      .from("providers")
      .update({ mode: nextMode })
      .eq("id", provider.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadProviders();
  }

  function updateLocalProvider(providerId: string, updates: Partial<Provider>) {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === providerId ? { ...provider, ...updates } : provider,
      ),
    );
  }

  async function updateProviderSafety(provider: Provider) {
    const { error } = await supabase
      .from("providers")
      .update({
        auto_disable_low_balance: Boolean(provider.auto_disable_low_balance),
        low_balance_threshold: Number(provider.low_balance_threshold || 0),
      })
      .eq("id", provider.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Provider safety settings saved.");
    loadProviders();
  }

  async function testProvider(provider: Provider) {
    if (actionLoadingId) return;

    setActionLoadingId(provider.id);
    setMessage(`Testing ${provider.name} API connection...`);

    try {
      const response = await fetch("/api/admin/providers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: provider.id,
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Provider test completed.");
      loadProviders();
    } catch {
      setMessage("Failed to test provider.");
    }

    setActionLoadingId(null);
  }

  async function importServices(provider: Provider) {
    if (actionLoadingId) return;

    setActionLoadingId(provider.id);
    setMessage(`Fetching services from ${provider.name}...`);

    try {
      const response = await fetch("/api/admin/providers/import-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: provider.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to import services.");
        setActionLoadingId(null);
        return;
      }

      setImportProvider(provider);
      setImportedServices(result.services || []);
      setSelectedServices([]);
      setImportSearch("");
      setImportModal(true);
      setMessage(`${result.services?.length || 0} services fetched from ${provider.name}.`);
    } catch {
      setMessage("Failed to import services.");
    }

    setActionLoadingId(null);
  }

  async function bulkImportSelectedServices() {
    if (!importProvider) return;

    const selected = filteredImportedServices.filter((service) =>
      selectedServices.includes(service.provider_service_id),
    );

    if (selected.length <= 0) {
      setMessage("Please select at least one service.");
      return;
    }

    setImporting(true);
    setMessage(`Importing ${selected.length} services...`);

    try {
      const response = await fetch("/api/admin/providers/bulk-import-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: importProvider.id,
          services: selected,
          markupPercent: Number(markupPercent || 0),
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Bulk import completed.");

      if (result.success) {
        setImportModal(false);
        setImportedServices([]);
        setSelectedServices([]);
        loadPanelServices();
        loadProviders();
      }
    } catch {
      setMessage("Failed to bulk import services.");
    }

    setImporting(false);
  }

  function toggleSelectedService(serviceId: string) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredImportedServices.map((service) => service.provider_service_id);

    const allVisibleSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedServices.includes(id));

    if (allVisibleSelected) {
      setSelectedServices((current) => current.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedServices((current) => Array.from(new Set([...current, ...visibleIds])));
    }
  }

  function getImportedCount(provider: Provider) {
    return panelServices.filter((service) => {
      if (provider.id && service.provider_id === provider.id) return true;
      return service.provider_name === provider.name;
    }).length;
  }

  const filteredProviders = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return providers.filter((provider) => {
      const matchesSearch =
        !keyword ||
        String(provider.name || "").toLowerCase().includes(keyword) ||
        String(provider.api_url || "").toLowerCase().includes(keyword) ||
        String(provider.id || "").toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? normalizeStatus(provider.status) === "active"
            : normalizeStatus(provider.status) !== "active";

      const matchesMode =
        modeFilter === "all"
          ? true
          : modeFilter === "auto"
            ? normalizeMode(provider.mode) === "auto"
            : normalizeMode(provider.mode) !== "auto";

      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [modeFilter, providers, search, statusFilter]);

  const filteredImportedServices = useMemo(() => {
    const keyword = importSearch.toLowerCase().trim();

    return importedServices.filter((service) => {
      return (
        !keyword ||
        String(service.name || "").toLowerCase().includes(keyword) ||
        String(service.category || "").toLowerCase().includes(keyword) ||
        String(service.provider_service_id || "").toLowerCase().includes(keyword)
      );
    });
  }, [importSearch, importedServices]);

  const stats = useMemo(() => {
    const active = providers.filter((provider) => normalizeStatus(provider.status) === "active").length;
    const autoMode = providers.filter((provider) => normalizeMode(provider.mode) === "auto").length;
    const totalBalance = providers.reduce((sum, provider) => sum + Number(provider.balance || 0), 0);
    const lowBalanceCount = providers.filter(
      (provider) => Number(provider.balance || 0) <= Number(provider.low_balance_threshold || 0),
    ).length;

    return {
      total: providers.length,
      active,
      autoMode,
      totalBalance,
      lowBalanceCount,
      importedServices: panelServices.length,
    };
  }, [panelServices.length, providers]);

  const quickInsights = useMemo(() => {
    const providerCounts = providers.map((provider) => ({
      provider,
      count: getImportedCount(provider),
    }));

    const mostUsed = providerCounts.sort((a, b) => b.count - a.count)[0];

    return {
      mostUsedProvider: mostUsed?.provider.name || "—",
      mostUsedPercent:
        panelServices.length > 0 && mostUsed
          ? Math.round((mostUsed.count / panelServices.length) * 100)
          : 0,
    };
  }, [providers, panelServices]);

  const allVisibleSelected =
    filteredImportedServices.length > 0 &&
    filteredImportedServices.every((service) =>
      selectedServices.includes(service.provider_service_id),
    );

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Providers
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage provider APIs, balances, service imports, and automation settings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  loadProviders();
                  loadPanelServices();
                  loadUsdMarketRate();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Provider
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Providers"
              value={formatNumber(stats.total)}
              subtitle="All configured providers"
              icon={<Server size={26} />}
              tone="blue"
            />

            <StatCard
              title="Active Providers"
              value={formatNumber(stats.active)}
              subtitle="Currently active providers"
              icon={<ShieldCheck size={26} />}
              tone="green"
            />

            <StatCard
              title="Auto Mode"
              value={formatNumber(stats.autoMode)}
              subtitle="Providers in auto mode"
              icon={<Zap size={26} />}
              tone="orange"
            />

            <StatCard
              title="Imported Services"
              value={formatNumber(stats.importedServices)}
              subtitle="Total imported services"
              icon={<Layers3 size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="grid gap-4 border-b border-slate-100 p-5 md:grid-cols-[1.1fr_0.75fr_0.75fr_auto]">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="text-slate-400" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search providers..."
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

                  <select
                    value={modeFilter}
                    onChange={(event) => setModeFilter(event.target.value as ModeFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {modeOptions.map((item) => (
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
                      setModeFilter("all");
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Filter size={17} />
                    Filters
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Provider</th>
                        <th className="px-5 py-4 text-left">API URL</th>
                        <th className="px-5 py-4 text-left">Balance</th>
                        <th className="px-5 py-4 text-left">Low Balance Alert</th>
                        <th className="px-5 py-4 text-left">Mode</th>
                        <th className="px-5 py-4 text-left">Status</th>
                        <th className="px-5 py-4 text-left">Imported</th>
                        <th className="px-5 py-4 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProviders.map((provider) => {
                        const lowBalance =
                          Number(provider.balance || 0) <= Number(provider.low_balance_threshold || 0);
                        const testingThis = actionLoadingId === provider.id;

                        return (
                          <tr key={provider.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                            <td className="px-5 py-5 align-top">
                              <div className="flex items-start gap-3">
                                <ProviderAvatar name={provider.name} />
                                <div className="min-w-0">
                                  <p className="max-w-[180px] truncate font-black text-slate-900">
                                    {provider.name}
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-slate-400">
                                    {shortProviderId(provider.id)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <a
                                href={provider.api_url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="max-w-[220px] truncate text-sm font-bold text-blue-600 hover:text-blue-700"
                              >
                                {shortText(provider.api_url, 32)}
                              </a>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p
                                className={`font-black ${
                                  lowBalance ? "text-orange-600" : "text-emerald-600"
                                }`}
                              >
                                {formatMoney(provider.balance)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-700">
                                {formatMoney(provider.low_balance_threshold || 0)}
                              </p>
                              <p
                                className={`mt-1 text-xs font-bold ${
                                  provider.auto_disable_low_balance ? "text-emerald-600" : "text-slate-400"
                                }`}
                              >
                                {provider.auto_disable_low_balance ? "Enabled" : "Disabled"}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <ModeBadge mode={provider.mode} />
                            </td>

                            <td className="px-5 py-5 align-top">
                              <StatusBadge status={provider.status} />
                            </td>

                            <td className="px-5 py-5 align-top font-black text-slate-800">
                              {formatNumber(getImportedCount(provider))}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-2">
                                <ActionButton
                                  title="View provider"
                                  onClick={() => openViewModal(provider)}
                                >
                                  <Eye size={16} />
                                </ActionButton>

                                <ActionButton
                                  title="Test API"
                                  onClick={() => testProvider(provider)}
                                  disabled={Boolean(actionLoadingId)}
                                  tone="green"
                                >
                                  {testingThis ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                                </ActionButton>

                                <ActionButton
                                  title="Import services"
                                  onClick={() => importServices(provider)}
                                  disabled={Boolean(actionLoadingId)}
                                  tone="purple"
                                >
                                  {testingThis ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                </ActionButton>

                                <ActionButton
                                  title="Edit provider"
                                  onClick={() => openEditModal(provider)}
                                  tone="blue"
                                >
                                  <Edit3 size={16} />
                                </ActionButton>

                                <button
                                  type="button"
                                  onClick={() => toggleProviderStatus(provider)}
                                  title={normalizeStatus(provider.status) === "active" ? "Disable provider" : "Enable provider"}
                                  className="ml-1"
                                >
                                  <ToggleSwitch enabled={normalizeStatus(provider.status) === "active"} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredProviders.length <= 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                <Server size={26} />
                              </div>

                              <h3 className="mt-4 text-lg font-black text-slate-950">
                                No providers found
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                Try clearing filters or add your first provider.
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
                    Showing <span className="font-black text-slate-800">{filteredProviders.length}</span>{" "}
                    of <span className="font-black text-slate-800">{providers.length}</span> providers
                  </p>

                  <p>Auto-refreshing every 15 seconds</p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Auto mode providers can automatically sync and import new services based on your settings.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setModeFilter("auto");
                    }}
                    className="inline-flex items-center gap-2 font-black"
                  >
                    View Auto Providers
                    <Settings size={15} />
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Activity size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black text-slate-950">Provider Health</h3>
                </div>

                <div className="space-y-4">
                  <HealthItem
                    icon={<Wifi size={18} />}
                    title="API Connected"
                    subtitle="Providers with active status"
                    value={`${stats.active} / ${stats.total}`}
                    iconClassName="bg-emerald-50 text-emerald-700"
                    valueClassName="text-emerald-600"
                  />

                  <HealthItem
                    icon={<Zap size={18} />}
                    title="Auto Disabled"
                    subtitle="Providers in manual mode"
                    value={String(Math.max(stats.total - stats.autoMode, 0))}
                    iconClassName="bg-orange-50 text-orange-700"
                    valueClassName="text-orange-600"
                  />

                  <HealthItem
                    icon={<AlertTriangle size={18} />}
                    title="Low Balance Alerts"
                    subtitle="Providers below alert threshold"
                    value={String(stats.lowBalanceCount)}
                    iconClassName="bg-red-50 text-red-700"
                    valueClassName="text-red-600"
                  />

                  <HealthItem
                    icon={<ShieldCheck size={18} />}
                    title="Last Test Result"
                    subtitle="API tests use provider endpoint"
                    value="Ready"
                    iconClassName="bg-blue-50 text-blue-700"
                    valueClassName="text-blue-600"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black text-slate-950">Quick Insights</h3>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-black text-blue-700">Most Used Provider</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="truncate text-lg font-black text-slate-950">
                        {quickInsights.mostUsedProvider}
                      </p>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                        {quickInsights.mostUsedPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-700">Total Imported Services</p>
                    <p className="mt-1 text-xl font-black text-slate-950">
                      {formatNumber(stats.importedServices)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-sm font-black text-orange-700">Low Balance Warnings</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xl font-black text-slate-950">
                        {formatNumber(stats.lowBalanceCount)} Providers
                      </p>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>
                  <button
                    type="button"
                    onClick={() => {
                      loadProviders();
                      loadPanelServices();
                    }}
                    className="text-sm font-black text-blue-700"
                  >
                    Refresh
                  </button>
                </div>

                <div className="space-y-4">
                  {providers.slice(0, 5).map((provider) => (
                    <div key={provider.id} className="flex items-start gap-3">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          normalizeStatus(provider.status) === "active" ? "bg-emerald-500" : "bg-orange-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800">
                          {provider.name} {normalizeStatus(provider.status) === "active" ? "is active" : "is inactive"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {formatNumber(getImportedCount(provider))} imported services
                        </p>
                      </div>
                    </div>
                  ))}

                  {providers.length <= 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No recent provider activity yet.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {(modalMode === "add" || modalMode === "edit") && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {modalMode === "edit" ? "Manage Provider" : "Add Provider"}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Configure provider API credentials, automation mode, and low balance protection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[1fr_340px]">
                <div className="space-y-5 p-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">Provider Information</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Add API endpoint and credentials from your SMM provider.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Provider Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. JustAnotherPanel"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Low Balance Threshold
                      </label>

                      <input
                        type="number"
                        value={lowBalanceThreshold}
                        onChange={(event) => setLowBalanceThreshold(event.target.value)}
                        placeholder="1000"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      API URL <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={apiUrl}
                      onChange={(event) => setApiUrl(event.target.value)}
                      placeholder="https://example.com/api/v2"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      API Key <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="Enter provider API key"
                      type="password"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setMode("auto")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        mode === "auto"
                          ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${mode === "auto" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="font-black text-slate-900">Auto Mode</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Provider can be used for automated order processing.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode("manual")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        mode !== "auto"
                          ? "border-blue-300 bg-blue-50 ring-4 ring-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${mode !== "auto" ? "bg-blue-600" : "bg-slate-300"}`} />
                        <span className="font-black text-slate-900">Manual Mode</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Provider is saved but not automated by default.
                      </p>
                    </button>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-black text-slate-700">Status</p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setStatus("active")}
                        className={`rounded-2xl border p-4 text-left transition ${
                          status === "active"
                            ? "border-emerald-300 bg-emerald-50 ring-4 ring-emerald-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`h-2.5 w-2.5 rounded-full ${status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                          <span className="font-black text-slate-900">Active</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Provider is available in admin systems.
                        </p>
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
                          <span className={`h-2.5 w-2.5 rounded-full ${status !== "active" ? "bg-red-500" : "bg-slate-300"}`} />
                          <span className="font-black text-slate-900">Inactive</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          Provider is disabled from normal operations.
                        </p>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAutoDisableLowBalance((current) => !current)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                      autoDisableLowBalance
                        ? "border-orange-300 bg-orange-50 ring-4 ring-orange-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-black text-slate-900">Auto-disable on low balance</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Recommended if provider should stop receiving orders below threshold.
                      </p>
                    </div>

                    <ToggleSwitch enabled={autoDisableLowBalance} />
                  </button>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700">Provider Preview</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Summary of your provider configuration.
                    </p>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-4">
                        <ProviderAvatar name={name || "Provider"} />
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-black text-slate-950">
                            {name || "Provider Name"}
                          </h4>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {shortText(apiUrl || "API URL", 26)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <InfoBlock label="Status" value={<StatusBadge status={status} />} />
                        <InfoBlock label="Mode" value={<ModeBadge mode={mode} />} />
                        <InfoBlock label="Low Balance Threshold" value={formatMoney(lowBalanceThreshold || 0)} />
                        <InfoBlock
                          label="Auto-disable"
                          value={autoDisableLowBalance ? "Enabled" : "Disabled"}
                          valueClassName={autoDisableLowBalance ? "text-orange-600" : "text-slate-700"}
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
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={modalMode === "edit" ? updateProvider : addProvider}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                  {loading ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Save Provider"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalMode === "view" && selectedProvider && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Provider Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review API, balance, automation, and import status.
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

              <div className="space-y-6 p-6">
                <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <ProviderAvatar name={selectedProvider.name} />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">{selectedProvider.name}</h4>
                    <a
                      href={selectedProvider.api_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block max-w-full truncate text-sm font-semibold text-blue-600"
                    >
                      {selectedProvider.api_url || "No API URL"}
                    </a>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={selectedProvider.status} />
                      <ModeBadge mode={selectedProvider.mode} />
                    </div>
                  </div>

                  <p className="shrink-0 text-2xl font-black text-emerald-600">
                    {formatMoney(selectedProvider.balance)}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <InfoBlock label="Provider ID" value={shortProviderId(selectedProvider.id)} />
                  <InfoBlock label="Balance" value={formatMoney(selectedProvider.balance)} valueClassName="text-emerald-600" />
                  <InfoBlock label="Imported Services" value={formatNumber(getImportedCount(selectedProvider))} />
                  <InfoBlock label="Low Balance Threshold" value={formatMoney(selectedProvider.low_balance_threshold || 0)} />
                  <InfoBlock label="Auto-disable Low Balance" value={selectedProvider.auto_disable_low_balance ? "Enabled" : "Disabled"} />
                  <InfoBlock label="Created" value={`${formatDate(selectedProvider.created_at)} · ${formatTime(selectedProvider.created_at)}`} />
                </div>

                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => testProvider(selectedProvider)}
                    disabled={Boolean(actionLoadingId)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {actionLoadingId === selectedProvider.id ? <Loader2 size={17} className="animate-spin" /> : <Activity size={17} />}
                    Test API
                  </button>

                  <button
                    type="button"
                    onClick={() => importServices(selectedProvider)}
                    disabled={Boolean(actionLoadingId)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-200 bg-white px-5 py-3 text-sm font-black text-purple-700 transition hover:bg-purple-50 disabled:opacity-50"
                  >
                    {actionLoadingId === selectedProvider.id ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                    Import Services
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedProvider;
                      closeModal();
                      openEditModal(current);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <Edit3 size={17} />
                    Edit Provider
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {importModal && importProvider && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-7xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Import Services</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {importProvider.name} · {importedServices.length} services fetched · {selectedServices.length} selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setImportModal(false)}
                  disabled={importing}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="border-b border-slate-100 p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto]">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="text-slate-400" />

                    <input
                      value={importSearch}
                      onChange={(event) => setImportSearch(event.target.value)}
                      placeholder="Search imported services..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-black uppercase text-slate-400">USD Market Rate</p>
                    <p className="mt-1 text-sm font-black text-slate-800">
                      ₱{Number(usdMarketRate || 0).toFixed(2)}
                    </p>
                  </div>

                  <input
                    type="number"
                    value={markupPercent}
                    onChange={(event) => setMarkupPercent(event.target.value)}
                    placeholder="Markup %"
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  />

                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
                  >
                    {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[58vh] overflow-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-5 py-4 text-left">Provider Service ID</th>
                      <th className="px-5 py-4 text-left">Service Name</th>
                      <th className="px-5 py-4 text-left">Category</th>
                      <th className="px-5 py-4 text-left">Provider Price USD</th>
                      <th className="px-5 py-4 text-left">Panel Price PHP</th>
                      <th className="px-5 py-4 text-left">Min / Max</th>
                      <th className="px-5 py-4 text-left">Type</th>
                      <th className="px-5 py-4 text-left">Refill</th>
                      <th className="px-5 py-4 text-left">Cancel</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredImportedServices.map((service) => (
                      <tr key={service.provider_service_id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-4 align-top">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.provider_service_id)}
                            onChange={() => toggleSelectedService(service.provider_service_id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="px-5 py-4 align-top font-black text-blue-700">
                          {service.provider_service_id}
                        </td>

                        <td className="px-5 py-4 align-top">
                          <p className="max-w-[360px] font-black text-slate-800">{service.name}</p>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 ring-1 ring-slate-200">
                            {service.category || "Uncategorized"}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-top font-black text-slate-700">
                          {formatUsd(service.price)}
                        </td>

                        <td className="px-5 py-4 align-top font-black text-emerald-600">
                          {formatMoney(getPanelPricePhp(service, usdMarketRate, markupPercent))}
                        </td>

                        <td className="px-5 py-4 align-top font-semibold text-slate-600">
                          {formatNumber(service.min)} / {formatNumber(service.max)}
                        </td>

                        <td className="px-5 py-4 align-top font-semibold capitalize text-slate-600">
                          {service.type || "default"}
                        </td>

                        <td className="px-5 py-4 align-top">
                          {service.refill ? (
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          ) : (
                            <XCircle size={18} className="text-slate-300" />
                          )}
                        </td>

                        <td className="px-5 py-4 align-top">
                          {service.cancel ? (
                            <CheckCircle2 size={18} className="text-emerald-600" />
                          ) : (
                            <XCircle size={18} className="text-slate-300" />
                          )}
                        </td>
                      </tr>
                    ))}

                    {filteredImportedServices.length <= 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <UploadCloud size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No imported services found
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              Try clearing the search keyword.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setImportModal(false)}
                  disabled={importing}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={bulkImportSelectedServices}
                  disabled={importing || selectedServices.length <= 0}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                  {importing ? "Importing..." : `Import ${selectedServices.length} Selected`}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

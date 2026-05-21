"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { useConfirm } from "@/components/ConfirmProvider";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Eye,
  Filter,
  Import,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  FaDiscord,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaSpotify,
  FaTelegramPlane,
  FaTiktok,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  provider_service_id: string;
  provider_name: string;
  provider_id: string | null;
  auto_order: boolean;
  status: string;
  created_at: string;
  is_highlighted?: boolean | null;
  highlight_badge?: string | null;
  highlight_sort?: number | null;
};

type Provider = {
  id: string;
  name: string;
  status: string;
  mode: string;
};

type StatusFilter = "all" | "active" | "inactive";
type AutoOrderFilter = "all" | "auto" | "manual";
type ServiceModalMode = "add" | "edit" | "view" | null;

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const autoOrderOptions: { label: string; value: AutoOrderFilter }[] = [
  { label: "All Order Types", value: "all" },
  { label: "Auto Order", value: "auto" },
  { label: "Manual Order", value: "manual" },
];

function normalizeStatus(status?: string | null) {
  return String(status || "active").toLowerCase().trim();
}

function formatMoney(value: number | string | null | undefined) {
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

function shortServiceId(id: string) {
  return `ID: ${String(id).slice(0, 6).toUpperCase()}`;
}

function getPlatformName(value?: string | null) {
  const name = String(value || "").toLowerCase();

  if (name.includes("instagram") || name.includes("ig ")) return "Instagram";
  if (name.includes("tiktok")) return "TikTok";
  if (name.includes("youtube") || name.includes("yt ")) return "YouTube";
  if (name.includes("facebook") || name.includes("fb ")) return "Facebook";
  if (name.includes("telegram")) return "Telegram";
  if (name.includes("spotify")) return "Spotify";
  if (name.includes("twitter") || name.includes(" x ") || name.startsWith("x ")) return "Twitter / X";
  if (name.includes("twitch")) return "Twitch";
  if (name.includes("discord")) return "Discord";

  return "Other";
}

function PlatformIcon({ service }: { service?: string | null }) {
  const name = String(service || "").toLowerCase();

  let icon: ReactNode = <FaGlobe />;
  let className = "bg-slate-50 text-slate-700 ring-slate-100";

  if (name.includes("instagram") || name.includes("ig ")) {
    icon = <FaInstagram />;
    className = "bg-pink-50 text-pink-600 ring-pink-100";
  } else if (name.includes("tiktok")) {
    icon = <FaTiktok />;
    className = "bg-slate-950 text-white ring-slate-900";
  } else if (name.includes("youtube") || name.includes("yt ")) {
    icon = <FaYoutube />;
    className = "bg-red-50 text-red-600 ring-red-100";
  } else if (name.includes("facebook") || name.includes("fb ")) {
    icon = <FaFacebookF />;
    className = "bg-blue-50 text-blue-600 ring-blue-100";
  } else if (name.includes("telegram")) {
    icon = <FaTelegramPlane />;
    className = "bg-sky-50 text-sky-600 ring-sky-100";
  } else if (name.includes("spotify")) {
    icon = <FaSpotify />;
    className = "bg-emerald-50 text-emerald-600 ring-emerald-100";
  } else if (name.includes("twitter") || name.includes(" x ") || name.startsWith("x ")) {
    icon = <FaTwitter />;
    className = "bg-slate-950 text-white ring-slate-900";
  } else if (name.includes("twitch")) {
    icon = <FaTwitch />;
    className = "bg-purple-50 text-purple-600 ring-purple-100";
  } else if (name.includes("discord")) {
    icon = <FaDiscord />;
    className = "bg-indigo-50 text-indigo-600 ring-indigo-100";
  }

  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ${className}`}>
      {icon}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const active = normalizeStatus(status) === "active";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function HighlightBadge({ service }: { service: Service }) {
  if (!service.is_highlighted) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">
        Not Highlighted
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700 ring-1 ring-yellow-100">
      {service.highlight_badge || "HOT"}
    </span>
  );
}


function AutoOrderSwitch({ enabled }: { enabled: boolean }) {
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

function CategoryBadge({ category }: { category?: string | null }) {
  const label = category || "Uncategorized";
  const platform = getPlatformName(label);

  const className =
    platform === "Instagram"
      ? "bg-pink-50 text-pink-700 ring-pink-100"
      : platform === "TikTok"
        ? "bg-slate-100 text-slate-800 ring-slate-200"
        : platform === "YouTube"
          ? "bg-red-50 text-red-700 ring-red-100"
          : platform === "Facebook"
            ? "bg-blue-50 text-blue-700 ring-blue-100"
            : platform === "Telegram"
              ? "bg-sky-50 text-sky-700 ring-sky-100"
              : platform === "Spotify"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {label}
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
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 min-w-0 truncate text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{subtitle}</p>
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
  tone?: "slate" | "blue" | "red";
}) {
  const toneClass = {
    slate: "border-slate-200 text-slate-600 hover:bg-slate-50",
    blue: "border-blue-200 text-blue-700 hover:bg-blue-50",
    red: "border-red-200 text-red-700 hover:bg-red-50",
  }[tone];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className={`mt-2 min-w-0 break-words text-sm font-black ${valueClassName}`}>{value}</div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [message, setMessage] = useState("");

  const [savingService, setSavingService] = useState(false);
  const [importingServices, setImportingServices] = useState(false);
  const [deletingServices, setDeletingServices] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalMode, setModalMode] = useState<ServiceModalMode>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [providerServiceId, setProviderServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [autoOrder, setAutoOrder] = useState(false);
  const [status, setStatus] = useState("active");

  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [autoOrderFilter, setAutoOrderFilter] = useState<AutoOrderFilter>("all");

  const [bulkProviderId, setBulkProviderId] = useState("");

  const { confirmAction } = useConfirm();

async function loadServices() {
  let allServices: Service[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const to = from + batchSize - 1;

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    const batch = (data || []) as Service[];

    allServices = [...allServices, ...batch];

    if (batch.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  setServices(allServices);
}

  async function loadProviders() {
    const { data, error } = await supabase
      .from("providers")
      .select("id, name, status, mode")
      .order("name");

    if (error) {
      setMessage(error.message);
      return;
    }

    setProviders((data || []) as Provider[]);
  }

  useEffect(() => {
    loadServices();
    loadProviders();

    const interval = setInterval(() => {
      loadServices();
      loadProviders();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  function getSelectedProviderName() {
    const provider = providers.find((item) => item.id === providerId);
    return provider?.name || "manual";
  }

  function getProviderName(id?: string | null, fallback?: string | null) {
    if (!id) return fallback || "Manual";
    return providers.find((provider) => provider.id === id)?.name || fallback || "Manual";
  }

  function getAutoHighlightBadge(service: Service) {
    const text = `${service.name || ""} ${service.category || ""} ${
      service.description || ""
    }`.toLowerCase();

    if (text.includes("cheap") || Number(service.price_per_1000 || 0) <= 5) {
      return "CHEAP";
    }

    if (text.includes("fast") || text.includes("instant")) {
      return "FAST";
    }

    if (text.includes("refill")) {
      return "REFILL";
    }

    if (
      text.includes("hq") ||
      text.includes("quality") ||
      text.includes("real")
    ) {
      return "HIGH QUALITY";
    }

    if (text.includes("popular") || text.includes("hot")) {
      return "HOT";
    }

    return "HOT";
  }

  async function toggleHighlight(service: Service) {
    const nextValue = !service.is_highlighted;

    const { error } = await supabase
      .from("services")
      .update({
        is_highlighted: nextValue,
        highlight_badge: nextValue ? getAutoHighlightBadge(service) : null,
        highlight_sort: nextValue ? Number(service.highlight_sort || 0) : 0,
      })
      .eq("id", service.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(nextValue ? "Service highlighted." : "Service unhighlighted.");
    loadServices();
  }

  function resetForm() {
    setName("");
    setCategory("");
    setDescription("");
    setPrice("");
    setMinQuantity("");
    setMaxQuantity("");
    setProviderServiceId("");
    setProviderId("");
    setAutoOrder(false);
    setStatus("active");
  }

  function openAddModal() {
    resetForm();
    setSelectedService(null);
    setModalMode("add");
    setMessage("");
  }

  function openViewModal(service: Service) {
    setSelectedService(service);
    setModalMode("view");
    setMessage("");
  }

  function openManage(service: Service) {
    setSelectedService(service);
    setName(service.name || "");
    setCategory(service.category || "");
    setDescription(service.description || "");
    setPrice(String(service.price_per_1000 || ""));
    setMinQuantity(String(service.min_quantity || ""));
    setMaxQuantity(String(service.max_quantity || ""));
    setProviderServiceId(service.provider_service_id || "");
    setProviderId(service.provider_id || "");
    setAutoOrder(Boolean(service.auto_order));
    setStatus(service.status || "active");
    setModalMode("edit");
    setMessage("");
  }

  function closeModal() {
    setSelectedService(null);
    setModalMode(null);
    resetForm();
  }

  function toggleSelectService(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSelectAll() {
    if (filteredServices.length <= 0) return;

    const filteredIds = filteredServices.map((service) => service.id);
    const allFilteredSelected = filteredIds.every((id) => selectedIds.includes(id));

    if (allFilteredSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((current) => Array.from(new Set([...current, ...filteredIds])));
    }
  }

  function validateServiceForm() {
    if (!name.trim() || !category.trim() || !price || !minQuantity || !maxQuantity) {
      setMessage("Please complete all required fields.");
      return false;
    }

    if (Number(price) < 0) {
      setMessage("Price cannot be negative.");
      return false;
    }

    if (Number(minQuantity) < 0 || Number(maxQuantity) < 0) {
      setMessage("Minimum and maximum quantity cannot be negative.");
      return false;
    }

    if (Number(minQuantity) > Number(maxQuantity)) {
      setMessage("Minimum quantity cannot be greater than maximum quantity.");
      return false;
    }

    return true;
  }

  async function addService() {
    if (savingService) return;
    if (!validateServiceForm()) return;

    setSavingService(true);

    const { error } = await supabase.from("services").insert({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      price_per_1000: Number(price),
      min_quantity: Number(minQuantity),
      max_quantity: Number(maxQuantity),
      provider_service_id: providerServiceId.trim(),
      provider_id: providerId || null,
      provider_name: getSelectedProviderName(),
      auto_order: autoOrder,
      status,
    });

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    setMessage("Service added successfully.");
    setSavingService(false);
    closeModal();
    loadServices();
  }

  async function updateService() {
    if (savingService) return;
    if (!selectedService) return;
    if (!validateServiceForm()) return;

    setSavingService(true);

    const { error } = await supabase
      .from("services")
      .update({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price_per_1000: Number(price),
        min_quantity: Number(minQuantity),
        max_quantity: Number(maxQuantity),
        provider_service_id: providerServiceId.trim(),
        provider_id: providerId || null,
        provider_name: getSelectedProviderName(),
        auto_order: autoOrder,
        status,
      })
      .eq("id", selectedService.id);

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    setMessage("Service updated successfully.");
    setSavingService(false);
    closeModal();
    loadServices();
  }

  async function deleteService(service: Service) {
    if (deletingServices) return;

    const confirmDelete = await confirmAction({
      title: "Delete Service",
      message: `Delete "${service.name}"? This action cannot be undone.`,
      confirmText: "Delete Service",
      variant: "danger",
    });

    if (!confirmDelete) return;

    setDeletingServices(true);

    const { error } = await supabase.from("services").delete().eq("id", service.id);

    if (error) {
      setMessage(error.message);
      setDeletingServices(false);
      return;
    }

    setMessage("Service deleted.");
    setSelectedIds((current) => current.filter((id) => id !== service.id));
    setDeletingServices(false);
    loadServices();
  }

  async function deleteSelectedServices() {
    if (deletingServices) return;

    if (selectedIds.length <= 0) {
      setMessage("Please select at least one service.");
      return;
    }

    const confirmDelete = await confirmAction({
      title: "Delete Selected Services",
      message: `Delete ${selectedIds.length} selected services? This action cannot be undone.`,
      confirmText: "Delete Services",
      variant: "danger",
    });

    if (!confirmDelete) return;

    setDeletingServices(true);

    try {
      const response = await fetch("/api/admin/services/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to delete selected services.");
        setDeletingServices(false);
        return;
      }

      setMessage(result.message || "Selected services deleted.");
      setSelectedIds([]);
      setDeletingServices(false);
      loadServices();
    } catch {
      setMessage("Failed to delete selected services.");
      setDeletingServices(false);
    }
  }

  async function deleteAllServices() {
    if (deletingServices) return;

    const confirmDelete = await confirmAction({
      title: "Delete All Services",
      message: "Delete ALL services? This action cannot be undone.",
      confirmText: "Delete All",
      variant: "danger",
    });

    if (!confirmDelete) return;

    const doubleConfirm = await confirmAction({
      title: "Final Confirmation",
      message: "Are you 100% sure? This will remove every service from your panel.",
      confirmText: "Yes, Delete Everything",
      variant: "danger",
    });

    if (!doubleConfirm) return;

    setDeletingServices(true);

    try {
      const response = await fetch("/api/admin/services/delete-all", {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to delete all services.");
        setDeletingServices(false);
        return;
      }

      setMessage(result.message || "All services deleted.");
      setSelectedIds([]);
      setDeletingServices(false);
      loadServices();
    } catch {
      setMessage("Failed to delete all services.");
      setDeletingServices(false);
    }
  }

  async function bulkImportServices() {
    if (importingServices) return;

    if (!bulkProviderId) {
      setMessage("Please select a provider to import from.");
      return;
    }

    const confirmImport = await confirmAction({
      title: "Bulk Import Services",
      message: "Import services from this provider? Existing duplicate provider service IDs may be skipped by your API.",
      confirmText: "Start Import",
    });

    if (!confirmImport) return;

    setImportingServices(true);
    setMessage("Importing services...");

    try {
      const response = await fetch("/api/admin/services/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: bulkProviderId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message || "Failed to import services.");
        setImportingServices(false);
        return;
      }

      setMessage(result.message || "Services imported successfully.");
      setShowBulkImportModal(false);
      setBulkProviderId("");
      setImportingServices(false);
      loadServices();
    } catch {
      setMessage("Failed to import services. Please check your import API route.");
      setImportingServices(false);
    }
  }

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(services.map((service) => service.category).filter(Boolean))).sort();
  }, [services]);

  const stats = useMemo(() => {
    const active = services.filter((service) => normalizeStatus(service.status) === "active").length;
    const inactive = services.filter((service) => normalizeStatus(service.status) !== "active").length;
    const auto = services.filter((service) => service.auto_order).length;
    const highlighted = services.filter((service) => service.is_highlighted).length;
    const activePercent = services.length > 0 ? (active / services.length) * 100 : 0;
    const autoPercent = services.length > 0 ? (auto / services.length) * 100 : 0;
    const averagePrice =
      services.length > 0
        ? services.reduce((sum, service) => sum + Number(service.price_per_1000 || 0), 0) / services.length
        : 0;

    const providerMap = new Map<string, number>();
    services.forEach((service) => {
      const provider = service.provider_name || "Manual";
      providerMap.set(provider, (providerMap.get(provider) || 0) + 1);
    });

    const mostUsedProvider = Array.from(providerMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return {
      total: services.length,
      active,
      inactive,
      auto,
      highlighted,
      activePercent,
      autoPercent,
      averagePrice,
      mostUsedProvider,
      providerCount: providers.length,
    };
  }, [providers.length, services]);

  const topCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();

    services.forEach((service) => {
      const key = service.category || "Uncategorized";
      categoryMap.set(key, (categoryMap.get(key) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [services]);

  const filteredServices = useMemo(() => {
    const query = search.toLowerCase().trim();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        String(service.name || "").toLowerCase().includes(query) ||
        String(service.id || "").toLowerCase().includes(query) ||
        String(service.category || "").toLowerCase().includes(query) ||
        String(service.provider_name || "").toLowerCase().includes(query) ||
        String(service.provider_service_id || "").toLowerCase().includes(query);

      const matchesProvider =
        providerFilter === "all"
          ? true
          : providerFilter === "manual"
            ? !service.provider_id
            : service.provider_id === providerFilter;

      const matchesCategory = categoryFilter === "all" ? true : service.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? normalizeStatus(service.status) === "active"
            : normalizeStatus(service.status) !== "active";

      const matchesAuto =
        autoOrderFilter === "all"
          ? true
          : autoOrderFilter === "auto"
            ? service.auto_order
            : !service.auto_order;

      return matchesSearch && matchesProvider && matchesCategory && matchesStatus && matchesAuto;
    });
  }, [autoOrderFilter, categoryFilter, providerFilter, search, services, statusFilter]);

  const allFilteredSelected =
    filteredServices.length > 0 && filteredServices.every((service) => selectedIds.includes(service.id));

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Services
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage all services, pricing, categories, and provider settings.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
              <button
                type="button"
                onClick={() => {
                  loadServices();
                  loadProviders();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => setShowBulkImportModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                <Import size={17} />
                Bulk Import
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus size={17} />
                Add Service
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Services"
              value={formatNumber(stats.total)}
              subtitle="All time services"
              icon={<Package size={26} />}
              tone="blue"
            />

            <StatCard
              title="Active Services"
              value={formatNumber(stats.active)}
              subtitle={`${stats.activePercent.toFixed(2)}% active`}
              icon={<CheckCircle2 size={26} />}
              tone="green"
            />

            <StatCard
              title="Auto Order Services"
              value={formatNumber(stats.auto)}
              subtitle={`${stats.autoPercent.toFixed(2)}% auto order`}
              icon={<Zap size={26} />}
              tone="orange"
            />

            <StatCard
              title="Providers"
              value={formatNumber(stats.providerCount)}
              subtitle="Connected providers"
              icon={<Activity size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="grid min-w-0 grid-cols-1 gap-4 border-b border-slate-100 p-5 xl:grid-cols-[1.2fr_0.65fr_0.65fr_0.55fr_0.55fr_auto]">
                <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services by name or ID..."
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={providerFilter}
                  onChange={(event) => setProviderFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                >
                  <option value="all">All Providers</option>
                  <option value="manual">Manual</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                >
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  value={autoOrderFilter}
                  onChange={(event) => setAutoOrderFilter(event.target.value as AutoOrderFilter)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                >
                  {autoOrderOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setProviderFilter("all");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setAutoOrderFilter("all");
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:w-auto"
                >
                  <Filter size={17} />
                </button>
              </div>

              {selectedIds.length > 0 && (
                <div className="flex flex-col gap-3 border-b border-orange-100 bg-orange-50 px-5 py-4 text-sm font-bold text-orange-700 sm:flex-row sm:items-center sm:justify-between">
                  <p>{selectedIds.length} services selected.</p>

                  <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                    <button
                      type="button"
                      onClick={deleteSelectedServices}
                      disabled={deletingServices}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto"
                    >
                      {deletingServices ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Delete Selected
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-xs font-black text-orange-700 transition hover:bg-orange-50 sm:w-auto"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1320px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-5 py-4 text-left">Service</th>
                      <th className="px-5 py-4 text-left">Category</th>
                      <th className="px-5 py-4 text-left">Provider</th>
                      <th className="px-5 py-4 text-left">Provider Service ID</th>
                      <th className="px-5 py-4 text-left">Price / 1000</th>
                      <th className="px-5 py-4 text-left">Min / Max</th>
                      <th className="px-5 py-4 text-left">Auto Order</th>
                      <th className="px-5 py-4 text-left">Highlight</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredServices.map((service) => (
                      <tr key={service.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(service.id)}
                            onChange={() => toggleSelectService(service.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-3">
                            <PlatformIcon service={`${service.name} ${service.category}`} />
                            <div className="min-w-0">
                              <p className="max-w-[250px] truncate font-black text-slate-900">{service.name}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {shortServiceId(service.id)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <CategoryBadge category={service.category} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700 ring-1 ring-blue-100">
                              {(service.provider_name || "M").charAt(0).toUpperCase()}
                            </span>
                            <p className="max-w-[150px] truncate font-black text-slate-700">
                              {getProviderName(service.provider_id, service.provider_name)}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top font-semibold text-slate-500">
                          {service.provider_service_id || "—"}
                        </td>

                        <td className="px-5 py-5 align-top font-black text-slate-900">
                          {formatMoney(service.price_per_1000)}
                        </td>

                        <td className="px-5 py-5 align-top font-semibold text-slate-600">
                          {formatNumber(service.min_quantity)} / {formatNumber(service.max_quantity)}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <AutoOrderSwitch enabled={service.auto_order} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <HighlightBadge service={service} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge status={service.status} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <ActionButton title="View service" onClick={() => openViewModal(service)}>
                              <Eye size={16} />
                            </ActionButton>

                            <ActionButton
                              title={service.is_highlighted ? "Unhighlight service" : "Highlight service"}
                              onClick={() => toggleHighlight(service)}
                              tone={service.is_highlighted ? "red" : "blue"}
                            >
                              <Zap size={16} />
                            </ActionButton>

                            <ActionButton title="Edit service" onClick={() => openManage(service)} tone="blue">
                              <Edit3 size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Delete service"
                              onClick={() => deleteService(service)}
                              disabled={deletingServices}
                              tone="red"
                            >
                              <Trash2 size={16} />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredServices.length <= 0 && (
                      <tr>
                        <td colSpan={11} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <Package size={26} />
                            </div>
                            <h3 className="mt-4 text-lg font-black text-slate-950">No services found</h3>
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
                  Showing <span className="font-black text-slate-800">{filteredServices.length}</span>{" "}
                  of <span className="font-black text-slate-800">{services.length}</span> services
                </p>

                <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
                  <button
                    type="button"
                    onClick={deleteAllServices}
                    disabled={deletingServices || services.length <= 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {deletingServices ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete All
                  </button>

                  <p>Auto-refreshing every 15 seconds</p>
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Services Summary</h3>

                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div
                    className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#22c55e 0% ${stats.activePercent}%, #ef4444 ${stats.activePercent}% 100%)`,
                    }}
                  >
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                      <p className="text-lg font-black text-slate-950">{formatNumber(stats.total)}</p>
                      <p className="text-xs font-bold text-slate-500">Total</p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-600">
                        <span className="h-3 w-3 rounded-full bg-emerald-500" />
                        Active
                      </span>
                      <span className="font-black text-slate-800">
                        {formatNumber(stats.active)} ({stats.activePercent.toFixed(2)}%)
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-bold text-slate-600">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        Inactive
                      </span>
                      <span className="font-black text-slate-800">
                        {formatNumber(stats.inactive)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Top Categories</h3>

                <div className="mt-5 space-y-4">
                  {topCategories.map((item) => (
                    <div key={item.category} className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <PlatformIcon service={item.category} />
                        <p className="truncate text-sm font-black text-slate-800">{item.category}</p>
                      </div>

                      <p className="shrink-0 font-black text-slate-700">{formatNumber(item.count)}</p>
                    </div>
                  ))}

                  {topCategories.length <= 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No categories yet.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Quick Insights</h3>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm font-black text-emerald-700">Average Price / 1000</p>
                    <p className="mt-1 truncate text-xl font-black text-slate-950">{formatMoney(stats.averagePrice)}</p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-black text-blue-700">Most Used Provider</p>
                    <p className="mt-1 truncate text-xl font-black text-slate-950">{stats.mostUsedProvider}</p>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-sm font-black text-orange-700">Auto Order Rate</p>
                    <p className="mt-1 truncate text-xl font-black text-slate-950">{stats.autoPercent.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {(modalMode === "add" || modalMode === "edit") && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                    {modalMode === "edit" ? "Manage Service" : "Add Service"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Configure service details, pricing, provider settings, and auto-order behavior.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  disabled={savingService}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 space-y-5 p-5 sm:p-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-950">Service Information</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Main customer-facing service information.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Service Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="e.g. TikTok Followers"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        placeholder="e.g. TikTok"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Price / 1000 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        placeholder="120"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Min Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={minQuantity}
                        onChange={(event) => setMinQuantity(event.target.value)}
                        placeholder="100"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Max Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={maxQuantity}
                        onChange={(event) => setMaxQuantity(event.target.value)}
                        placeholder="100000"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">Description</label>
                    <textarea
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      rows={4}
                      placeholder="Describe the service rules, expected delivery, requirements, and notes..."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-lg font-black text-slate-950">Provider Settings</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Connect this service to a provider or keep it manual.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">Provider</label>
                      <select
                        value={providerId}
                        onChange={(event) => setProviderId(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="">Manual</option>
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">Provider Service ID</label>
                      <input
                        value={providerServiceId}
                        onChange={(event) => setProviderServiceId(event.target.value)}
                        placeholder="e.g. 12345"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setAutoOrder(true)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        autoOrder ? "border-blue-300 bg-blue-50 ring-4 ring-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${autoOrder ? "bg-blue-600" : "bg-slate-300"}`} />
                        <span className="font-black text-slate-900">Auto Order</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Send order automatically to provider.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoOrder(false)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        !autoOrder ? "border-slate-300 bg-slate-50 ring-4 ring-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${!autoOrder ? "bg-slate-600" : "bg-slate-300"}`} />
                        <span className="font-black text-slate-900">Manual Order</span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Admin will process manually.
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
                          Service is visible to customers.
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
                          Service is hidden from customers.
                        </p>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 lg:border-l lg:border-t-0">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700">Service Preview</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      This is how your service configuration looks.
                    </p>

                    <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <PlatformIcon service={`${name} ${category}`} />
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-lg font-black text-slate-950">
                            {name || "Service Name"}
                          </h4>
                          <div className="mt-2">
                            <CategoryBadge category={category || "Category"} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <InfoBlock label="Price / 1000" value={formatMoney(price || 0)} valueClassName="text-blue-600" />
                        <InfoBlock label="Min / Max" value={`${formatNumber(minQuantity || 0)} / ${formatNumber(maxQuantity || 0)}`} />
                        <InfoBlock label="Provider" value={getSelectedProviderName()} />
                        <InfoBlock label="Provider Service ID" value={providerServiceId || "—"} />
                        <InfoBlock label="Auto Order" value={autoOrder ? "Enabled" : "Disabled"} valueClassName={autoOrder ? "text-blue-600" : "text-slate-700"} />
                        <InfoBlock label="Status" value={<StatusBadge status={status} />} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingService}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={modalMode === "edit" ? updateService : addService}
                  disabled={savingService}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                >
                  {savingService ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
                  {savingService ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Save Service"}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalMode === "view" && selectedService && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">Service Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review service pricing, provider settings, and order rules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 space-y-6 overflow-y-auto p-5 sm:p-6">
                <div className="flex min-w-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-start">
                  <PlatformIcon service={`${selectedService.name} ${selectedService.category}`} />
                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-xl font-black text-slate-950">{selectedService.name}</h4>
                    <p className="mt-1 line-clamp-3 text-sm font-semibold text-slate-500">{selectedService.description || "No description added."}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <CategoryBadge category={selectedService.category} />
                      <StatusBadge status={selectedService.status} />
                    </div>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <InfoBlock label="Service ID" value={selectedService.id} />
                  <InfoBlock label="Price / 1000" value={formatMoney(selectedService.price_per_1000)} valueClassName="text-blue-600" />
                  <InfoBlock label="Min / Max" value={`${formatNumber(selectedService.min_quantity)} / ${formatNumber(selectedService.max_quantity)}`} />
                  <InfoBlock label="Provider" value={getProviderName(selectedService.provider_id, selectedService.provider_name)} />
                  <InfoBlock label="Provider Service ID" value={selectedService.provider_service_id || "—"} />
                  <InfoBlock label="Auto Order" value={selectedService.auto_order ? "Enabled" : "Disabled"} />
                  <InfoBlock
                    label="Highlight"
                    value={
                      selectedService.is_highlighted
                        ? selectedService.highlight_badge || "HOT"
                        : "Not Highlighted"
                    }
                  />
                  <InfoBlock label="Category" value={selectedService.category || "—"} />
                  <InfoBlock label="Status" value={<StatusBadge status={selectedService.status} />} />
                  <InfoBlock label="Created" value={formatDate(selectedService.created_at)} />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedService;
                      closeModal();
                      openManage(current);
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    <Edit3 size={17} />
                    Edit Service
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBulkImportModal && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">Bulk Import Services</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Import services from your provider API.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                  disabled={importingServices}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 space-y-5 overflow-y-auto p-5 sm:p-6">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">Provider</label>
                  <select
                    value={bulkProviderId}
                    onChange={(event) => setBulkProviderId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
                  >
                    <option value="">Select provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                  This will use your existing provider import API. If your endpoint name is different,
                  tell me the error and we will connect the button to your exact route.
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  disabled={importingServices}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={bulkImportServices}
                  disabled={importingServices}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                >
                  {importingServices ? <Loader2 size={17} className="animate-spin" /> : <Import size={17} />}
                  {importingServices ? "Importing..." : "Start Import"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

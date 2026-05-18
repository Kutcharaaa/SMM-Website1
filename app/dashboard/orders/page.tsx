"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Grid3X3,
  Heart,
  Info,
  Link as LinkIcon,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Order = {
  id: string;
  service_name: string;
  link: string;
  quantity: number;
  price: number;
  start_count: number;
  current_count: number;
  status: string;
  created_at: string;
  order_source?: string | null;
};

type Service = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  provider_service_id?: string | null;
  provider_name?: string | null;
  status?: string | null;
};

type Profile = {
  balance: number;
};

const networks = [
  { name: "Instagram", icon: "📸" },
  { name: "Facebook", icon: "📘" },
  { name: "YouTube", icon: "▶️" },
  { name: "TikTok", icon: "🎵" },
  { name: "Telegram", icon: "✈️" },
  { name: "Spotify", icon: "🎧" },
  { name: "Twitter", icon: "𝕏" },
  { name: "Twitch", icon: "🎮" },
  { name: "Discord", icon: "💬" },
  { name: "Google", icon: "G" },
  { name: "Website", icon: "🌐" },
  { name: "Reviews", icon: "⭐" },
  { name: "Others", icon: "＋" },
  { name: "Everything", icon: "☰" },
];

function normalizeServiceText(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function serviceMatchesNetwork(service: Service, selectedNetwork: string) {
  if (selectedNetwork === "Everything") return true;

  const text = normalizeServiceText(
    `${service.name || ""} ${service.category || ""} ${
      service.description || ""
    } ${service.provider_name || ""} ${service.provider_service_id || ""}`,
  );

  const aliases: Record<string, string[]> = {
    Instagram: ["instagram", "insta", "ig"],
    Facebook: ["facebook", "fb"],
    YouTube: ["youtube", "yt", "youtubeshorts"],
    TikTok: [
      "tiktok",
      "tiktokshop",
      "tiktokservice",
      "tiktokservices",
      "tiktokfollowers",
      "tiktoklikes",
      "tiktokviews",
      "tiktokshares",
      "tiktokcomments",
      "tiktoklive",
      "tik",
      "tok",
    ],
    Telegram: ["telegram", "tg"],
    Spotify: ["spotify"],
    Twitter: ["twitter", "x", "twitterx"],
    Twitch: ["twitch"],
    Discord: ["discord"],
    Google: ["google", "googlereviews"],
    Website: ["website", "site", "websitereviews"],
    Reviews: ["reviews", "review"],
  };

  const selectedAliases = aliases[selectedNetwork] || [selectedNetwork];

  return selectedAliases.some((alias) =>
    text.includes(normalizeServiceText(alias)),
  );
}

function getPublicServiceId(service: Service | null) {
  if (!service) return "N/A";
  return service.provider_service_id || service.id.slice(0, 8);
}

function getOrderSource(order: Order) {
  return (order.order_source || "dashboard").toLowerCase() === "api"
    ? "api"
    : "dashboard";
}

function getStatusStyle(status: string) {
  const clean = String(status || "").toLowerCase();

  if (clean === "completed") return "bg-green-50 text-green-600";
  if (clean === "cancelled" || clean === "canceled")
    return "bg-red-50 text-red-600";
  if (clean === "processing") return "bg-blue-50 text-blue-600";
  if (clean === "partial") return "bg-purple-50 text-purple-600";

  return "bg-yellow-50 text-yellow-600";
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={24} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-2xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isApi = source === "api";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${
        isApi ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
      }`}
    >
      {isApi ? "API" : "Dashboard"}
    </span>
  );
}

function SideDetail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="max-w-[210px] truncate text-right text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
        {step}
      </span>
      <h4 className="text-lg font-black text-slate-950">{title}</h4>
    </div>
  );
}

function PlatformIcon({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg">
      {getPlatformSvg(name)}
    </span>
  );
}

function PlatformSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function getPlatformSvg(name: string) {
  const clean = String(name || "").toLowerCase();

  if (clean.includes("tiktok")) {
    return (
      <PlatformSvg>
        <path d="M16.7 3.2c.5 2.2 1.8 3.9 4.1 4.5v3.3c-1.6 0-3.1-.5-4.2-1.3v5.8c0 3.4-2.7 6.1-6.1 6.1S4.4 18.9 4.4 15.5s2.7-6.1 6.1-6.1c.4 0 .8 0 1.2.1v3.5c-.4-.2-.8-.3-1.2-.3-1.5 0-2.7 1.2-2.7 2.7s1.2 2.7 2.7 2.7 2.7-1.2 2.7-2.7V3.2h3.5Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("facebook")) {
    return (
      <PlatformSvg>
        <path d="M14 8h2V5h-2.4C10.9 5 10 6.7 10 8.5V10H8v3h2v6h3v-6h2.4l.6-3h-3V8.8c0-.5.2-.8 1-.8Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("youtube")) {
    return (
      <PlatformSvg>
        <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 4 12 4 12 4s-3.8 0-6.7.2c-.4.1-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9 2 10.8v1.7c0 1.8.4 3.6.4 3.6s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 6.4.2 6.4.2s3.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.4-1.8.4-3.6v-1.7c0-1.8-.4-3.6-.4-3.6ZM10 14.5v-6l5.3 3-5.3 3Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("instagram")) {
    return (
      <PlatformSvg>
        <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9Zm4.5 3.2A4.8 4.8 0 1 1 12 16.8 4.8 4.8 0 0 1 12 7.2Zm0 2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Zm5-2.4a1.1 1.1 0 1 1-1.1 1.1A1.1 1.1 0 0 1 17 6.8Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("telegram")) {
    return (
      <PlatformSvg>
        <path d="M21.6 3.4 2.9 10.6c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.5c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.4-2.3 5 3.7c.9.5 1.6.3 1.8-.9l3.2-15.2c.4-1.4-.5-2-1.8-1.4ZM8.3 13.2l10.6-6.7c.5-.3.9-.1.5.2l-9.1 8.2-.4 3.6-1.6-5.3Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("spotify")) {
    return (
      <PlatformSvg>
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.6 14.4c-.2.3-.5.4-.8.2-2.2-1.3-5-1.6-8.3-.9-.3.1-.6-.1-.7-.5-.1-.3.1-.6.5-.7 3.6-.8 6.8-.4 9.2 1.1.3.2.4.5.2.8Zm1.2-2.7c-.2.4-.6.5-1 .3-2.5-1.5-6.4-2-9.4-1.1-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 3.4-1 7.7-.5 10.6 1.3.4.2.5.6.3 1Zm.1-2.8C15 9.1 10 8.9 7.2 9.8c-.5.1-.9-.1-1.1-.6-.1-.5.1-.9.6-1.1 3.2-1 8.8-.8 12.2 1.2.4.3.6.8.3 1.2-.3.4-.8.6-1.2.3Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("twitter")) {
    return (
      <PlatformSvg>
        <path d="M4 3h4.2l4.6 6 5-6H21l-6.7 8 7.1 10h-4.2l-5.1-7-5.8 7H3l7.5-9L4 3Zm2.3 2 11.9 14h1L7.4 5H6.3Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("twitch")) {
    return (
      <PlatformSvg>
        <path d="M4 3h17v11.5L16.5 19H13l-2.5 2.5H8V19H4V3Zm2 2v12h4v2l2-2h4l3-3V5H6Zm5 3h2v5h-2V8Zm5 0h2v5h-2V8Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("discord")) {
    return (
      <PlatformSvg>
        <path d="M18.6 5.3A15 15 0 0 0 15 4.2l-.4.8a13.5 13.5 0 0 0-5.2 0L9 4.2a15 15 0 0 0-3.6 1.1C3.1 8.7 2.5 12 2.8 15.3a14.6 14.6 0 0 0 4.5 2.3l.9-1.5a9.2 9.2 0 0 1-1.4-.7l.3-.2a10.8 10.8 0 0 0 9.8 0l.3.2a9.2 9.2 0 0 1-1.4.7l.9 1.5a14.6 14.6 0 0 0 4.5-2.3c.4-3.8-.7-7-3.2-10ZM8.8 13.5c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Zm6.4 0c-.9 0-1.6-.8-1.6-1.7s.7-1.7 1.6-1.7 1.6.8 1.6 1.7-.7 1.7-1.6 1.7Z" />
      </PlatformSvg>
    );
  }

  if (clean.includes("google")) {
    return (
      <span className="font-black text-blue-600">G</span>
    );
  }

  if (clean.includes("others")) return <span className="font-black">+</span>;
  if (clean.includes("everything")) return <span className="font-black">☰</span>;

  return (
    <PlatformSvg>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2c1.3 1.4 2.1 3.9 2.2 7H9.8C9.9 7.9 10.7 5.4 12 4Zm-2.2 9h4.4c-.1 3.1-.9 5.6-2.2 7-1.3-1.4-2.1-3.9-2.2-7Zm6.4-2c-.1-2.4-.6-4.5-1.5-6A8 8 0 0 1 20 11h-3.8ZM4 11a8 8 0 0 1 5.3-6c-.9 1.5-1.4 3.6-1.5 6H4Zm3.8 2c.1 2.4.6 4.5 1.5 6A8 8 0 0 1 4 13h3.8Zm6.9 6c.9-1.5 1.4-3.6 1.5-6H20a8 8 0 0 1-5.3 6Z" />
    </PlatformSvg>
  );
}

function ServiceFilterChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center gap-2 rounded-xl border px-4 text-xs font-black transition ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function OrdersPage() {
  const { showToast } = useToast();
  const { formatAmount } = useDisplayCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [network, setNetwork] = useState("Everything");
  const [category, setCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>([]);
  const [serviceFilter, setServiceFilter] = useState("all");

  async function loadOrders() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message, "error");
      setLoading(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLoading(false);
  }

async function loadOrderData() {
  let allServices: Service[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const to = from + batchSize - 1;

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("category")
      .range(from, to);

    if (error) {
      showToast(error.message, "error");
      break;
    }

    const batch = (data || []) as Service[];

    allServices = [...allServices, ...batch];

    if (batch.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  const activeServices = allServices.filter((service) => {
    const cleanStatus = String(service.status || "active")
      .toLowerCase()
      .trim();

    return (
      cleanStatus === "active" ||
      cleanStatus === "enabled" ||
      cleanStatus === "available" ||
      cleanStatus === ""
    );
  });

  setServices(activeServices);

  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) return;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", authData.user.id)
    .single();

  if (profileData) setProfile(profileData as Profile);
}

  useEffect(() => {
    async function refreshOrders() {
      try {
        await fetch("/api/orders/sync-status", {
          method: "POST",
          headers: {
            "x-internal-sync": "true",
          },
        });
      } catch (error) {
        console.error("SYNC_ERROR:", error);
      }

      await loadOrders();
      await loadOrderData();
    }

    refreshOrders();

    const savedFavorites = window.localStorage.getItem("favorite_services");

    if (savedFavorites) {
      try {
        setFavoriteServiceIds(JSON.parse(savedFavorites));
      } catch {
        setFavoriteServiceIds([]);
      }
    }

    const interval = setInterval(() => {
      refreshOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const processingOrders = orders.filter((o) => o.status === "processing").length;
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.price || 0),
    0,
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const keyword = orderSearch.toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(keyword) ||
        order.service_name?.toLowerCase().includes(keyword) ||
        order.link?.toLowerCase().includes(keyword) ||
        getOrderSource(order).toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ? true : order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  const networkServices = useMemo(() => {
    if (network === "Everything") return services;

    if (network === "Others") {
      return services.filter((service) => {
        return !networks
          .filter(
            (item) => item.name !== "Others" && item.name !== "Everything",
          )
          .some((item) => serviceMatchesNetwork(service, item.name));
      });
    }

    return services.filter((service) => serviceMatchesNetwork(service, network));
  }, [services, network]);

  const categories = useMemo(() => {
    return [...new Set(networkServices.map((service) => service.category))]
      .filter(Boolean)
      .sort();
  }, [networkServices]);

  const filteredServices = useMemo(() => {
    const keyword = serviceSearch.toLowerCase().trim();

    // Important: when the user types in search, search across ALL active services first.
    // This prevents the selected platform filter from hiding imported provider services
    // with category formats like "Tik Tok", "TIKTOK", or provider-specific names.
    let rows = (keyword ? services : networkServices).filter((service) => {
      if (!category) return true;
      return normalizeServiceText(service.category) === normalizeServiceText(category);
    });

    if (keyword) {
      rows = rows.filter((service) => {
        const normalizedKeyword = normalizeServiceText(keyword);

        const searchableText = normalizeServiceText(
          `${getPublicServiceId(service)} ${service.name || ""} ${
            service.category || ""
          } ${service.description || ""} ${service.provider_service_id || ""} ${
            service.provider_name || ""
          }`,
        );

        return searchableText.includes(normalizedKeyword);
      });
    }

    if (serviceFilter === "favorites") {
      rows = rows.filter((service) => favoriteServiceIds.includes(service.id));
    }

    if (serviceFilter === "fast") {
      rows = rows.filter((service) => {
        const text = `${service.name} ${service.description || ""}`.toLowerCase();
        return text.includes("fast") || text.includes("instant");
      });
    }

    if (serviceFilter === "refill") {
      rows = rows.filter((service) => {
        const text = `${service.name} ${service.description || ""}`.toLowerCase();
        return text.includes("refill");
      });
    }

    if (serviceFilter === "quality") {
      rows = rows.filter((service) => {
        const text = `${service.name} ${service.description || ""}`.toLowerCase();
        return (
          text.includes("hq") ||
          text.includes("quality") ||
          text.includes("real")
        );
      });
    }

    return rows.sort((a, b) => {
      if (serviceFilter !== "cheapest") {
        const aFavorite = favoriteServiceIds.includes(a.id) ? 0 : 1;
        const bFavorite = favoriteServiceIds.includes(b.id) ? 0 : 1;

        if (aFavorite !== bFavorite) return aFavorite - bFavorite;
      }

      return Number(a.price_per_1000 || 0) - Number(b.price_per_1000 || 0);
    });
  }, [
    services,
    networkServices,
    category,
    serviceSearch,
    favoriteServiceIds,
    serviceFilter,
  ]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || null;

  const cheapestPrice =
    filteredServices.length > 0
      ? Math.min(...filteredServices.map((s) => Number(s.price_per_1000 || 0)))
      : 0;

  const estimatedCharge = selectedService
    ? (Number(quantity || 0) / 1000) * Number(selectedService.price_per_1000)
    : 0;

  const canPlaceOrder = Boolean(
    selectedService && link && quantity && Number(quantity) > 0,
  );

  function getServiceTags(service: Service) {
    const text = `${service.name} ${service.description || ""}`.toLowerCase();
    const tags: string[] = [];

    if (Number(service.price_per_1000) === cheapestPrice) tags.push("CHEAP");
    if (text.includes("refill")) tags.push("REFILL");
    if (text.includes("instant") || text.includes("fast")) tags.push("FAST");
    if (text.includes("hq") || text.includes("quality")) tags.push("HQ");
    if (text.includes("real")) tags.push("REAL");

    return tags.slice(0, 3);
  }

  function getDetail(label: string) {
    if (!selectedService) return "N/A";

    const regex = new RegExp(`\\[${label}:?\\s*([^\\]]+)\\]`, "i");
    const match = selectedService.name.match(regex);

    return match?.[1] || "N/A";
  }

  function resetOrderForm() {
    setNetwork("Everything");
    setCategory("");
    setSelectedServiceId("");
    setServiceSearch("");
    setLink("");
    setQuantity("");
    setNotes("");
    setServiceFilter("all");
  }

  function toggleFavoriteService(serviceId: string) {
    setFavoriteServiceIds((current) => {
      const next = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];

      window.localStorage.setItem("favorite_services", JSON.stringify(next));
      return next;
    });
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.", "success");
  }

  async function handleOrder() {
    if (placingOrder) return;

    setPlacingOrder(true);

    if (!selectedService) {
      showToast("Please select a service.", "warning");
      setPlacingOrder(false);
      return;
    }

    if (!link) {
      showToast("Please enter a link.", "warning");
      setPlacingOrder(false);
      return;
    }

    const qty = Number(quantity);

    if (
      qty < selectedService.min_quantity ||
      qty > selectedService.max_quantity
    ) {
      showToast(
        `Quantity must be between ${selectedService.min_quantity} and ${selectedService.max_quantity}.`,
        "warning",
      );
      setPlacingOrder(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      showToast("User not authenticated.", "error");
      setPlacingOrder(false);
      return;
    }

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: authData.user.id,
          serviceId: selectedService.id,
          link,
          quantity: qty,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        showToast(result.message, "error");
        setPlacingOrder(false);
        return;
      }

      showToast(result.message || "Order placed successfully.", "success");

      resetOrderForm();
      setOrderModalOpen(false);
      setPlacingOrder(false);

      loadOrders();
      loadOrderData();
    } catch {
      showToast("Failed to create order.", "error");
      setPlacingOrder(false);
    }
  }

  const sideOrder = selectedOrder;

  const sideProgress =
    sideOrder && Number(sideOrder.quantity || 0) > 0
      ? Math.min(
          100,
          (Number(sideOrder.current_count || 0) /
            Number(sideOrder.quantity || 1)) *
            100,
        )
      : 0;

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="-m-8 grid min-h-screen bg-[#f6f9fc] lg:grid-cols-[1fr_390px]">
          <section className="p-6 lg:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-950">Orders</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Track and monitor all your orders in real-time.
                </p>
              </div>

              <button
                onClick={() => setOrderModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Plus size={18} />
                New Order
              </button>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Package}
                title="Total Orders"
                value={String(totalOrders)}
                subtitle="All time orders"
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                icon={CheckCircle2}
                title="Completed"
                value={String(completedOrders)}
                subtitle={`${totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : "0"}% of total`}
                color="bg-green-50 text-green-600"
              />

              <StatCard
                icon={RefreshCw}
                title="Processing"
                value={String(processingOrders)}
                subtitle={`${totalOrders > 0 ? ((processingOrders / totalOrders) * 100).toFixed(1) : "0"}% of total`}
                color="bg-orange-50 text-orange-500"
              />

              <StatCard
                icon={Wallet}
                title="Total Spent"
                value={formatAmount(totalSpent)}
                subtitle="All time spending"
                color="bg-purple-50 text-purple-600"
              />
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search by service, link, source, or order ID..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm font-semibold outline-none transition focus:border-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 xl:w-52"
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={loadOrders}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                >
                  <RefreshCw size={19} />
                </button>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-5 text-left font-black">Order ID</th>
                      <th className="p-5 text-left font-black">Service</th>
                      <th className="p-5 text-left font-black">Source</th>
                      <th className="p-5 text-left font-black">Quantity</th>
                      <th className="p-5 text-left font-black">Charge</th>
                      <th className="p-5 text-left font-black">Progress</th>
                      <th className="p-5 text-left font-black">Status</th>
                      <th className="p-5 text-left font-black">Date</th>
                      <th className="p-5 text-left font-black">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-slate-500">
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length <= 0 ? (
                      <tr>
                        <td colSpan={9} className="p-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <ShoppingBag size={50} />
                            </div>

                            <h3 className="mt-6 text-xl font-black text-slate-950">
                              No orders found
                            </h3>

                            <p className="mt-2 text-sm font-medium text-slate-500">
                              You haven&apos;t placed any orders yet.
                            </p>

                            <button
                              onClick={() => setOrderModalOpen(true)}
                              className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                            >
                              <Plus size={18} />
                              New Order
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const progress =
                          Number(order.quantity || 0) > 0
                            ? Math.min(
                                100,
                                (Number(order.current_count || 0) /
                                  Number(order.quantity || 1)) *
                                  100,
                              )
                            : 0;

                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`cursor-pointer border-t border-slate-100 transition hover:bg-blue-50/40 ${
                              selectedOrder?.id === order.id ? "bg-blue-50/60" : ""
                            }`}
                          >
                            <td className="p-5 font-black text-blue-600">
                              #{order.id.slice(0, 8)}
                            </td>

                            <td className="p-5">
                              <p className="max-w-xs truncate font-black text-slate-950">
                                {order.service_name}
                              </p>
                              <p className="mt-1 max-w-xs truncate text-xs font-medium text-slate-500">
                                {order.link}
                              </p>
                            </td>

                            <td className="p-5">
                              <SourceBadge source={getOrderSource(order)} />
                            </td>

                            <td className="p-5 font-bold text-slate-700">
                              {Number(order.quantity || 0).toLocaleString()}
                            </td>

                            <td className="p-5 font-black text-blue-600">
                              {formatAmount(order.price)}
                            </td>

                            <td className="p-5">
                              <div className="w-32">
                                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                  <span>{Number(order.current_count || 0).toLocaleString()}</span>
                                  <span>{progress.toFixed(0)}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    style={{ width: `${progress}%` }}
                                    className={`h-full rounded-full ${
                                      order.status === "completed" ? "bg-green-500" : "bg-blue-600"
                                    }`}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="p-5">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                                  order.status,
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>

                            <td className="p-5 text-slate-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>

                            <td className="p-5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition hover:border-blue-400 hover:bg-blue-50"
                              >
                                <Eye size={17} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Showing {filteredOrders.length} of {orders.length} orders
                </p>
              </div>
            </div>
          </section>

          <aside className="hidden border-l border-slate-200 bg-white p-6 lg:block">
            <div className="sticky top-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-950">Order Details</h3>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {sideOrder ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-500">Order ID</p>

                        <div className="mt-2 flex items-center gap-2">
                          <p className="font-black text-slate-950">
                            #{sideOrder.id.slice(0, 8)}
                          </p>

                          <button onClick={() => copyText(sideOrder.id)}>
                            <Copy size={15} className="text-slate-400" />
                          </button>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                          sideOrder.status,
                        )}`}
                      >
                        {sideOrder.status}
                      </span>
                    </div>

                    <div className="mt-4">
                      <SourceBadge source={getOrderSource(sideOrder)} />
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-100 p-4">
                      <h4 className="font-black text-slate-950">
                        {sideOrder.service_name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Service order details
                      </p>

                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-sm font-bold text-slate-500">Link</p>

                        <div className="mt-2 flex items-center gap-2">
                          <p className="max-w-[260px] truncate text-sm font-bold text-blue-600">
                            {sideOrder.link}
                          </p>

                          <button onClick={() => copyText(sideOrder.link)}>
                            <Copy size={15} className="text-slate-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <SideDetail
                        label="Source"
                        value={getOrderSource(sideOrder) === "api" ? "API" : "Dashboard"}
                      />

                      <SideDetail
                        label="Quantity"
                        value={Number(sideOrder.quantity || 0).toLocaleString()}
                      />

                      <SideDetail label="Charge" value={formatAmount(sideOrder.price)} />

                      <SideDetail label="Start Count" value={String(sideOrder.start_count || 0)} />

                      <SideDetail
                        label="Current Count"
                        value={String(sideOrder.current_count || 0)}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-500">Progress</p>

                          <p className="text-sm font-black text-slate-700">
                            {Number(sideOrder.current_count || 0).toLocaleString()} /{" "}
                            {Number(sideOrder.quantity || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              style={{ width: `${sideProgress}%` }}
                              className={`h-full rounded-full ${
                                sideOrder.status === "completed" ? "bg-green-500" : "bg-blue-600"
                              }`}
                            />
                          </div>

                          <span className="text-xs font-black text-slate-500">
                            {sideProgress.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <SideDetail
                        label="Order Date"
                        value={new Date(sideOrder.created_at).toLocaleString()}
                      />

                      <SideDetail label="Note" value="No note provided" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-5 text-sm font-semibold text-slate-600">
                    Keep this page open to receive live updates on your order progress.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      Close
                    </button>

                    <a
                      href={sideOrder.link}
                      target="_blank"
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      Go to Service
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                  Select an order to view details.
                </div>
              )}
            </div>
          </aside>
        </div>

        {orderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
            <div className="flex max-h-[94vh] w-full max-w-[1280px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ShoppingCart size={28} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Create New Order
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Choose a service and place your order in a few simple steps.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[1fr_420px]">
                <div className="min-h-0 overflow-y-auto p-6 pb-10">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="1" title="Choose Platform" />

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
                      {networks
                        .filter(
                          (item) =>
                            item.name !== "Website" && item.name !== "Reviews",
                        )
                        .map((item) => {
                          const active = network === item.name;

                          return (
                            <button
                              key={item.name}
                              onClick={() => {
                                setNetwork(active ? "Everything" : item.name);
                                setCategory("");
                                setSelectedServiceId("");
                                setServiceSearch("");
                              }}
                              className={`relative flex h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border bg-white text-sm font-black transition ${
                                active
                                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                  : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                              }`}
                            >
                              {active && (
                                <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                                  <Check size={14} strokeWidth={3} />
                                </span>
                              )}

                              <PlatformIcon name={item.name} />
                              <span>{item.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="2" title="Find Your Service" />

                    <div className="mt-5 flex flex-col gap-3 xl:flex-row">
                      <div className="relative flex-1">
                        <Search
                          size={20}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          value={serviceSearch}
                          onChange={(e) => {
                            setServiceSearch(e.target.value);
                            setSelectedServiceId("");
                          }}
                          placeholder="Search by Service ID, name, category, or provider service ID..."
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />

                        {serviceSearch && (
                          <button
                            onClick={() => setServiceSearch("")}
                            className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>

                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSelectedServiceId("");
                        }}
                        className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 xl:w-72"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <button className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                        <Filter size={18} />
                        Filter
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <ServiceFilterChip
                        active={serviceFilter === "favorites"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "favorites" ? "all" : "favorites",
                          )
                        }
                        icon={Star}
                        label="Favorites"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "all"}
                        onClick={() => setServiceFilter("all")}
                        icon={Grid3X3}
                        label="All Services"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "cheapest"}
                        onClick={() => setServiceFilter("cheapest")}
                        icon={Tag}
                        label="Cheapest"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "fast"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "fast" ? "all" : "fast",
                          )
                        }
                        icon={Zap}
                        label="Fast"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "refill"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "refill" ? "all" : "refill",
                          )
                        }
                        icon={RotateCcw}
                        label="Refill"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "quality"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "quality" ? "all" : "quality",
                          )
                        }
                        icon={ShieldCheck}
                        label="High Quality"
                      />
                    </div>

                    <div className="mt-5 max-h-[330px] space-y-3 overflow-y-auto pr-1">
                      {filteredServices.length <= 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <Search size={28} />
                          </div>
                          <h5 className="mt-4 text-lg font-black text-slate-950">
                            No matching services found
                          </h5>
                          <p className="mt-2 text-sm font-semibold text-slate-500">
                            Search directly by service ID or service name.
                          </p>
                        </div>
                      ) : (
                        filteredServices.map((service) => {
                          const active = selectedServiceId === service.id;
                          const tags = getServiceTags(service);
                          const favorite = favoriteServiceIds.includes(service.id);

                          return (
                            <button
                              key={service.id}
                              onClick={() => setSelectedServiceId(service.id)}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-blue-600 bg-blue-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                              }`}
                            >
                              <div className="flex gap-4">
                                <div
                                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                                    active
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <ShoppingCart size={22} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                                      ID {getPublicServiceId(service)}
                                    </span>

                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-black text-blue-600"
                                      >
                                        {tag}
                                      </span>
                                    ))}

                                    {active && (
                                      <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-black text-green-600">
                                        SELECTED
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-2 line-clamp-2 font-black text-slate-950">
                                    {service.name}
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-slate-500">
                                    {service.category}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-600">
                                    <span>
                                      {formatAmount(service.price_per_1000)}
                                      /1k
                                    </span>
                                    <span>
                                      Min {Number(service.min_quantity || 0).toLocaleString()}
                                    </span>
                                    <span>
                                      Max {Number(service.max_quantity || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                <span
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    toggleFavoriteService(service.id);
                                  }}
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                                    favorite
                                      ? "border-red-200 bg-red-50 text-red-500"
                                      : "border-slate-200 text-slate-400 hover:text-red-500"
                                  }`}
                                >
                                  <Heart
                                    size={18}
                                    fill={favorite ? "currentColor" : "none"}
                                  />
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="3" title="Order Details" />

                    <div className="mt-5 grid gap-4">
                      <div>
                        <label className="text-sm font-black text-slate-700">
                          Link
                        </label>
                        <div className="relative mt-2">
                          <LinkIcon
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://..."
                            className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-black text-slate-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder={
                            selectedService
                              ? `${selectedService.min_quantity} - ${selectedService.max_quantity}`
                              : "Enter quantity"
                          }
                          className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-black text-slate-700">
                          Notes (optional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add special instructions if needed..."
                          rows={3}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="hidden border-l border-slate-200 bg-slate-50 p-6 xl:block">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-black text-slate-950">
                      Order Summary
                    </h4>

                    <div className="mt-5 space-y-4">
                      <SideDetail
                        label="Selected Service"
                        value={selectedService?.name || "No service selected"}
                      />
                      <SideDetail
                        label="Service ID"
                        value={getPublicServiceId(selectedService)}
                      />
                      <SideDetail
                        label="Category"
                        value={selectedService?.category || "N/A"}
                      />
                      <SideDetail
                        label="Min / Max"
                        value={
                          selectedService
                            ? `${Number(
                                selectedService.min_quantity || 0,
                              ).toLocaleString()} / ${Number(
                                selectedService.max_quantity || 0,
                              ).toLocaleString()}`
                            : "N/A"
                        }
                      />
                      <SideDetail
                        label="Rate"
                        value={
                          selectedService
                            ? `${formatAmount(selectedService.price_per_1000)} / 1,000`
                            : "N/A"
                        }
                      />
                      <SideDetail
                        label="Estimated Charge"
                        value={formatAmount(estimatedCharge)}
                      />
                      <SideDetail
                        label="Wallet Balance"
                        value={formatAmount(profile?.balance || 0)}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                      {selectedService
                        ? "Review your order before placing it."
                        : "Select a service to see details here."}
                    </div>

                    <button
                      onClick={handleOrder}
                      disabled={!canPlaceOrder || placingOrder}
                      className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {placingOrder ? "Placing Order..." : "Place Order"}
                      <Sparkles size={18} />
                    </button>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </DashboardGuard>
  );
}

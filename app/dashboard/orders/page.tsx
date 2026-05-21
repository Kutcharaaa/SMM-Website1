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
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getServiceSearchText(service: Service) {
  return normalizeServiceText(
    `${service.name || ""} ${service.category || ""} ${
      service.description || ""
    } ${service.provider_name || ""} ${service.provider_service_id || ""}`,
  );
}

function textHasPlatformAlias(text: string, aliases: string[]) {
  const cleanText = ` ${normalizeServiceText(text)} `;
  const tokens = cleanText.trim().split(/\s+/).filter(Boolean);

  return aliases.some((alias) => {
    const cleanAlias = normalizeServiceText(alias);

    if (!cleanAlias) return false;

    // Short aliases like IG, FB, YT, TG, and X must match exact words only.
    // This prevents wrong matches like "high" matching IG or "max" matching X.
    if (cleanAlias.length <= 2) {
      return tokens.includes(cleanAlias);
    }

    return cleanText.includes(` ${cleanAlias} `);
  });
}

function serviceMatchesNetwork(service: Service, selectedNetwork: string) {
  if (selectedNetwork === "Everything") return true;

  const text = getServiceSearchText(service);

  const aliases: Record<string, string[]> = {
    Instagram: ["instagram", "insta", "ig"],
    Facebook: ["facebook", "fb"],
    YouTube: ["youtube", "yt", "youtube shorts"],
    TikTok: ["tiktok", "tik tok"],
    Telegram: ["telegram", "tg"],
    Spotify: ["spotify"],
    Twitter: ["twitter", "twitter x", "x"],
    Twitch: ["twitch"],
    Discord: ["discord"],
    Google: ["google"],
    Website: ["website", "web site", "website traffic", "site traffic"],
    Reviews: ["reviews", "review"],
  };

  if (selectedNetwork === "Others") {
    return !networks
      .filter((item) => item.name !== "Others" && item.name !== "Everything")
      .some((item) =>
        textHasPlatformAlias(text, aliases[item.name] || [item.name]),
      );
  }

  return textHasPlatformAlias(
    text,
    aliases[selectedNetwork] || [selectedNetwork],
  );
}

function getPublicServiceId(service: Service | null) {
  if (!service) return "N/A";
  return service.provider_service_id || service.id.slice(0, 8);
}

function isCustomCommentService(service: Service | null) {
  if (!service) return false;

  const text = `${service.name || ""} ${service.category || ""} ${
    service.description || ""
  }`.toLowerCase();

  return (
    text.includes("custom comments") ||
    text.includes("comments custom") ||
    text.includes("custom comment") ||
    text.includes("comment custom") ||
    text.includes("custom comment package") ||
    text.includes("comments package")
  );
}

function getCommentLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getCommentQuantity(value: string) {
  return getCommentLines(value).length;
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={24} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 truncate text-2xl font-black text-slate-950">
            {value}
          </h3>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {subtitle}
          </p>
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
    <div className="flex min-w-0 items-center justify-between gap-4">
      <p className="shrink-0 text-sm font-bold text-slate-500">{label}</p>
      <p className="min-w-0 max-w-[210px] truncate text-right text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white">
        {step}
      </span>
      <h4 className="min-w-0 truncate text-lg font-black text-slate-950">
        {title}
      </h4>
    </div>
  );
}

function PlatformIcon({ name }: { name: string }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
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

  if (clean.includes("google")) return <span className="font-black text-blue-600">G</span>;
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
      className={`flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs font-black transition ${
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

function OrderDetailsCard({
  order,
  progress,
  formatAmount,
  copyText,
  onClose,
}: {
  order: Order;
  progress: number;
  formatAmount: (amount: number) => string;
  copyText: (text: string) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              Order ID
            </p>

            <h4 className="mt-1 truncate text-xl font-black text-slate-950">
              #{order.id.slice(0, 8)}
            </h4>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
              order.status,
            )}`}
          >
            {order.status || "pending"}
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            Service
          </p>

          <p className="mt-2 text-sm font-black leading-6 text-slate-900">
            {order.service_name || "Unknown Service"}
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Link
              </p>

              <p className="mt-2 truncate text-sm font-semibold text-slate-600">
                {order.link || "No link"}
              </p>
            </div>

            {order.link && (
              <button
                type="button"
                onClick={() => copyText(order.link)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm transition hover:text-blue-600"
              >
                <Copy size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <SideDetail
            label="Source"
            value={getOrderSource(order) === "api" ? "API" : "Dashboard"}
          />

          <SideDetail
            label="Quantity"
            value={Number(order.quantity || 0).toLocaleString()}
          />

          <SideDetail label="Charge" value={formatAmount(order.price || 0)} />

          <SideDetail
            label="Start Count"
            value={String(order.start_count || 0)}
          />

          <SideDetail
            label="Current Count"
            value={String(order.current_count || 0)}
          />

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-500">Progress</p>

              <p className="text-right text-sm font-black text-slate-700">
                {Number(order.current_count || 0).toLocaleString()} /{" "}
                {Number(order.quantity || 0).toLocaleString()}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${progress}%` }}
                  className={`h-full rounded-full ${
                    order.status === "completed" ? "bg-green-500" : "bg-blue-600"
                  }`}
                />
              </div>

              <span className="text-xs font-black text-slate-500">
                {progress.toFixed(0)}%
              </span>
            </div>
          </div>

          <SideDetail
            label="Order Date"
            value={new Date(order.created_at).toLocaleString()}
          />

          <SideDetail label="Note" value="No note provided" />
        </div>
      </div>

      <div className="rounded-2xl bg-blue-50 p-5 text-sm font-semibold text-slate-600">
        Keep this page open to receive live updates on your order progress.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
        >
          Close
        </button>

        <a
          href={order.link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
        >
          Go to Service
          <ExternalLink size={15} />
        </a>
      </div>
    </div>
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
  const [customComments, setCustomComments] = useState("");
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

      if (batch.length < batchSize) break;

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
  const completedOrders = orders.filter(
    (order) => String(order.status).toLowerCase() === "completed",
  ).length;
  const processingOrders = orders.filter(
    (order) => String(order.status).toLowerCase() === "processing",
  ).length;
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
        statusFilter === "all"
          ? true
          : String(order.status || "").toLowerCase() === statusFilter;

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
    const normalizedKeyword = normalizeServiceText(keyword);

    // Always start from selected platform services.
    // Before, search used ALL services, so platform buttons were ignored while searching.
    let rows = [...networkServices];

    if (category) {
      rows = rows.filter(
        (service) =>
          normalizeServiceText(service.category) ===
          normalizeServiceText(category),
      );
    }

    if (normalizedKeyword) {
      rows = rows.filter((service) => {
        const searchableText = normalizeServiceText(
          `${getPublicServiceId(service)} ${service.id || ""} ${
            service.name || ""
          } ${service.category || ""} ${service.description || ""} ${
            service.provider_service_id || ""
          } ${service.provider_name || ""}`,
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
    networkServices,
    category,
    serviceSearch,
    favoriteServiceIds,
    serviceFilter,
  ]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || null;

  const isSelectedCustomCommentService = isCustomCommentService(selectedService);
  const customCommentQuantity = getCommentQuantity(customComments);
  const orderQuantity = isSelectedCustomCommentService
    ? customCommentQuantity
    : Number(quantity || 0);

  const cheapestPrice =
    filteredServices.length > 0
      ? Math.min(...filteredServices.map((service) => Number(service.price_per_1000 || 0)))
      : 0;

  const estimatedCharge = selectedService
    ? (Number(orderQuantity || 0) / 1000) *
      Number(selectedService.price_per_1000)
    : 0;

  const canPlaceOrder = Boolean(
    selectedService && link && orderQuantity && Number(orderQuantity) > 0,
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
    setCustomComments("");
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

    const customCommentMode = isCustomCommentService(selectedService);
    const cleanedComments = getCommentLines(customComments).join("\n");
    const qty = customCommentMode
      ? getCommentQuantity(customComments)
      : Number(quantity);

    if (customCommentMode && qty <= 0) {
      showToast(
        "Please enter at least one comment. Use 1 comment per line.",
        "warning",
      );
      setPlacingOrder(false);
      return;
    }

    if (!customCommentMode && (!quantity || qty <= 0)) {
      showToast("Please enter a valid quantity.", "warning");
      setPlacingOrder(false);
      return;
    }

    if (qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      showToast(
        `Quantity must be between ${selectedService.min_quantity} and ${selectedService.max_quantity}.`,
        "warning",
      );
      setPlacingOrder(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showToast("Please login again before placing an order.", "error");
      setPlacingOrder(false);
      return;
    }

    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          link,
          quantity: qty,
          comments: customCommentMode ? cleanedComments : undefined,
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
        <div className="grid min-h-screen min-w-0 bg-[#f6f9fc] lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 p-0 sm:p-2 lg:p-0">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-black text-slate-950">Orders</h1>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Track and monitor all your orders in real-time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOrderModalOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-fit"
              >
                <Plus size={18} />
                New Order
              </button>
            </div>

            <div className="mt-8 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
                subtitle={`${
                  totalOrders > 0
                    ? ((completedOrders / totalOrders) * 100).toFixed(1)
                    : "0"
                }% of total`}
                color="bg-green-50 text-green-600"
              />

              <StatCard
                icon={RefreshCw}
                title="Processing"
                value={String(processingOrders)}
                subtitle={`${
                  totalOrders > 0
                    ? ((processingOrders / totalOrders) * 100).toFixed(1)
                    : "0"
                }% of total`}
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
              <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative min-w-0 flex-1">
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
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 xl:w-52"
                >
                  <option value="all">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  type="button"
                  onClick={loadOrders}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-100 xl:w-12"
                >
                  <RefreshCw size={19} />
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-slate-950">
                    Order History
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {filteredOrders.length} order
                    {filteredOrders.length === 1 ? "" : "s"} found
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={18} />
                </div>
              </div>

              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-5 text-left font-black">Order ID</th>
                      <th className="p-5 text-left font-black">Service</th>
                      <th className="p-5 text-left font-black">Source</th>
                      <th className="p-5 text-left font-black">Quantity</th>
                      <th className="p-5 text-left font-black">Charge</th>
                      <th className="p-5 text-left font-black">Status</th>
                      <th className="p-5 text-left font-black">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-500">
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length <= 0 ? (
                      <tr>
                        <td colSpan={7} className="p-10 text-center text-slate-500">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={`border-t border-slate-100 transition hover:bg-slate-50 ${
                            selectedOrder?.id === order.id ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <td className="whitespace-nowrap p-5 font-black text-slate-700">
                            #{order.id.slice(0, 8)}
                          </td>

                          <td className="max-w-[320px] p-5">
                            <p className="truncate font-black text-slate-900">
                              {order.service_name || "Unknown Service"}
                            </p>
                            <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                              {order.link}
                            </p>
                          </td>

                          <td className="whitespace-nowrap p-5">
                            <SourceBadge source={getOrderSource(order)} />
                          </td>

                          <td className="whitespace-nowrap p-5 font-semibold text-slate-500">
                            {Number(order.quantity || 0).toLocaleString()}
                          </td>

                          <td className="whitespace-nowrap p-5 font-black text-slate-900">
                            {formatAmount(order.price || 0)}
                          </td>

                          <td className="whitespace-nowrap p-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                                order.status,
                              )}`}
                            >
                              {order.status || "pending"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap p-5">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-blue-600 transition hover:bg-blue-100"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-4 xl:hidden">
                {loading ? (
                  <div className="rounded-2xl border border-slate-100 p-8 text-center text-sm font-semibold text-slate-500">
                    Loading orders...
                  </div>
                ) : filteredOrders.length <= 0 ? (
                  <div className="rounded-2xl border border-slate-100 p-8 text-center text-sm font-semibold text-slate-500">
                    No orders found.
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-slate-400">
                            #{order.id.slice(0, 8)}
                          </p>

                          <h4 className="mt-2 line-clamp-2 text-sm font-black text-slate-950">
                            {order.service_name || "Unknown Service"}
                          </h4>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                            order.status,
                          )}`}
                        >
                          {order.status || "pending"}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="font-bold text-slate-400">Quantity</p>
                          <p className="mt-1 font-black text-slate-800">
                            {Number(order.quantity || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="font-bold text-slate-400">Charge</p>
                          <p className="mt-1 font-black text-slate-800">
                            {formatAmount(order.price || 0)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <SourceBadge source={getOrderSource(order)} />

                        <span className="text-xs font-black text-blue-600">
                          View Details
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="hidden border-l border-slate-200 bg-slate-50 p-6 lg:block">
            <div className="sticky top-28">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <Info size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Order Details
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    Select an order to view details.
                  </p>
                </div>
              </div>

              {sideOrder ? (
                <OrderDetailsCard
                  order={sideOrder}
                  progress={sideProgress}
                  formatAmount={formatAmount}
                  copyText={copyText}
                  onClose={() => setSelectedOrder(null)}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Select an order to view details.
                </div>
              )}
            </div>
          </aside>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm lg:hidden">
            <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    Order Details
                  </h3>
                  <p className="text-sm font-semibold text-slate-500">
                    View order progress and information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <OrderDetailsCard
                order={selectedOrder}
                progress={sideProgress}
                formatAmount={formatAmount}
                copyText={copyText}
                onClose={() => setSelectedOrder(null)}
              />
            </div>
          </div>
        )}

        {orderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
            <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:items-center sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                    Create New Order
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Choose a platform, select service, then place your order.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOrderModalOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_370px]">
                <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="1" title="Choose Platform" />

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7">
                      {networks.map((item) => (
<button
  key={item.name}
  type="button"
  onClick={() => {
    setNetwork(item.name);
    setCategory("");
    setSelectedServiceId("");
    setServiceSearch("");
    setServiceFilter("all");
  }}
  className={`flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition ${
    network === item.name
      ? "border-blue-600 bg-blue-50 text-blue-700"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
  }`}
>
  <PlatformIcon name={item.name} />

  <span className="min-w-0 whitespace-nowrap text-[11px] font-black sm:text-xs">
    {item.name}
  </span>
</button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="2" title="Select Service" />

                    <div className="mt-5 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <select
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setSelectedServiceId("");
                        }}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <Search
                          size={18}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Search service name or ID..."
                          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      <ServiceFilterChip
                        active={serviceFilter === "all"}
                        onClick={() => setServiceFilter("all")}
                        icon={Grid3X3}
                        label="All"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "favorites"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "favorites" ? "all" : "favorites",
                          )
                        }
                        icon={Heart}
                        label="Favorites"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "cheapest"}
                        onClick={() =>
                          setServiceFilter(
                            serviceFilter === "cheapest" ? "all" : "cheapest",
                          )
                        }
                        icon={Tag}
                        label="Cheapest"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "fast"}
                        onClick={() =>
                          setServiceFilter(serviceFilter === "fast" ? "all" : "fast")
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
                              type="button"
                              onClick={() => {
                                setSelectedServiceId(service.id);
                                setCustomComments("");
                                setQuantity("");
                              }}
                              className={`w-full rounded-2xl border p-4 text-left transition ${
                                active
                                  ? "border-blue-600 bg-blue-50 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                              }`}
                            >
                              <div className="flex min-w-0 gap-4">
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

                                    <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-black text-green-600">
                                      {formatAmount(service.price_per_1000)} / 1K
                                    </span>
                                  </div>

                                  <h5 className="mt-3 line-clamp-2 text-sm font-black text-slate-950">
                                    {service.name}
                                  </h5>

                                  <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">
                                    {service.category || "Uncategorized"}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                                    <span>Min: {service.min_quantity}</span>
                                    <span>Max: {service.max_quantity}</span>
                                  </div>
                                </div>

                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavoriteService(service.id);
                                  }}
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                    favorite
                                      ? "bg-red-50 text-red-500"
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  <Heart
                                    size={17}
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
                            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {isSelectedCustomCommentService ? (
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-black text-slate-700">
                              Comments
                            </label>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                              {customCommentQuantity} line
                              {customCommentQuantity === 1 ? "" : "s"}
                            </span>
                          </div>

                          <textarea
                            value={customComments}
                            onChange={(e) => setCustomComments(e.target.value)}
                            rows={6}
                            placeholder={"Enter comments here...\n1 comment per line"}
                            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-blue-500"
                          />

                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Quantity is automatically counted from your comment
                            lines. Empty lines are ignored.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="text-sm font-black text-slate-700">
                              Quantity
                            </label>

                            <input
                              type="number"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="Example: 1000"
                              className="mt-2 h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-black text-slate-700">
                              Notes
                            </label>

                            <input
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Optional"
                              className="mt-2 h-[52px] w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedService && (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                        <div className="grid gap-3 text-sm sm:grid-cols-3">
                          <SideDetail
                            label="Min"
                            value={selectedService.min_quantity}
                          />
                          <SideDetail
                            label="Max"
                            value={selectedService.max_quantity}
                          />
                          <SideDetail label="Speed" value={getDetail("Speed")} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm xl:hidden">
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
                        label={isSelectedCustomCommentService ? "Comment Lines" : "Quantity"}
                        value={orderQuantity ? Number(orderQuantity).toLocaleString() : "N/A"}
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
                      type="button"
                      onClick={handleOrder}
                      disabled={!canPlaceOrder || placingOrder}
                      className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {placingOrder ? "Placing Order..." : "Place Order"}
                      <Sparkles size={18} />
                    </button>
                  </div>
                </div>

                <aside className="hidden border-l border-slate-200 bg-slate-50 p-6 xl:block">
                  <div className="sticky top-0 space-y-5">
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
                          label={isSelectedCustomCommentService ? "Comment Lines" : "Quantity"}
                          value={orderQuantity ? Number(orderQuantity).toLocaleString() : "N/A"}
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
                        type="button"
                        onClick={handleOrder}
                        disabled={!canPlaceOrder || placingOrder}
                        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {placingOrder ? "Placing Order..." : "Place Order"}
                        <Sparkles size={18} />
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Info size={20} />
                        </div>

                        <div>
                          <h4 className="font-black text-slate-950">
                            Quick Tips
                          </h4>
                          <p className="text-xs font-semibold text-slate-500">
                            Make sure your link is public before ordering.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {[
                          "Do not order the same link twice at the same time.",
                          "Use the minimum and maximum quantity correctly.",
                          "Read service notes before placing an order.",
                        ].map((tip) => (
                          <div key={tip} className="flex gap-3">
                            <Check
                              size={16}
                              className="mt-0.5 shrink-0 text-blue-600"
                            />
                            <p className="text-sm font-semibold leading-6 text-slate-600">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
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
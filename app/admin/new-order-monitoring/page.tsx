"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { useConfirm } from "@/components/ConfirmProvider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Diamond,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Siren,
  SlidersHorizontal,
  TimerReset,
  TriangleAlert,
  X,
  XCircle,
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

type Order = {
  id: string;
  user_id: string;
  service_name: string | null;
  link: string | null;
  quantity: number | string | null;
  price: number | string | null;
  start_count: number | string | null;
  current_count: number | string | null;
  status: string | null;
  created_at: string;
  provider_order_id?: string | null;
  provider_name?: string | null;
  provider_error?: string | null;
  error_message?: string | null;
  provider_message?: string | null;
  reseller_points_awarded?: boolean | null;
};

type AttentionFilter =
  | "all"
  | "no_provider"
  | "api_error"
  | "stuck_pending"
  | "stuck_processing"
  | "high_value"
  | "created_today"
  | "partial";

type Priority = "high" | "medium" | "low";

type AttentionIssue = {
  type:
    | "No Provider ID"
    | "API Error"
    | "Stuck Pending"
    | "Stuck Processing"
    | "High Value"
    | "Failed Today"
    | "Partial"
    | "Needs Refund Review"
    | "New Pending";
  priority: Priority;
  description: string;
};

const filters: { label: string; value: AttentionFilter }[] = [
  { label: "All", value: "all" },
  { label: "No Provider ID", value: "no_provider" },
  { label: "API Error", value: "api_error" },
  { label: "Stuck Pending", value: "stuck_pending" },
  { label: "Stuck Processing", value: "stuck_processing" },
  { label: "High Value", value: "high_value" },
  { label: "Created Today", value: "created_today" },
  { label: "Partial", value: "partial" },
];

function normalizeStatus(status?: string | null) {
  return String(status || "pending").toLowerCase().trim();
}

function isCancelled(status?: string | null) {
  const clean = normalizeStatus(status);
  return clean === "cancelled" || clean === "canceled";
}

function isPending(order: Order) {
  return normalizeStatus(order.status) === "pending";
}

function isProcessing(order: Order) {
  return normalizeStatus(order.status) === "processing";
}

function isFailed(order: Order) {
  return normalizeStatus(order.status) === "failed";
}

function isPartial(order: Order) {
  return normalizeStatus(order.status) === "partial";
}

function isToday(dateValue: string | null | undefined) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function minutesSince(dateValue: string | null | undefined) {
  if (!dateValue) return 0;

  return Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000);
}

function hoursSince(dateValue: string | null | undefined) {
  return minutesSince(dateValue) / 60;
}

function hasProviderError(order: Order) {
  return Boolean(order.provider_error || order.error_message || order.provider_message) || isFailed(order);
}

function hasNoProviderId(order: Order) {
  return !order.provider_order_id && (isPending(order) || isProcessing(order));
}

function isStuckPending(order: Order) {
  return isPending(order) && minutesSince(order.created_at) >= 30;
}

function isStuckProcessing(order: Order) {
  return isProcessing(order) && hoursSince(order.created_at) >= 24;
}

function isHighValue(order: Order) {
  return Number(order.price || 0) >= 1000;
}

function needsRefundReview(order: Order) {
  return isFailed(order) || isCancelled(order.status) || isPartial(order);
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

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTime(value?: string | null) {
  if (!value) return "—";

  const mins = minutesSince(value);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
}

function shortOrderId(id: string) {
  return `#${String(id).slice(0, 6).toUpperCase()}`;
}

function shortUserId(id: string) {
  return `User ${String(id).slice(0, 6).toUpperCase()}`;
}

function getOrderIssue(order: Order): AttentionIssue {
  if (hasNoProviderId(order)) {
    return {
      type: "No Provider ID",
      priority: "high",
      description: "Order was created but no provider order ID was saved.",
    };
  }

  if (hasProviderError(order)) {
    return {
      type: "API Error",
      priority: "high",
      description:
        order.provider_error ||
        order.error_message ||
        order.provider_message ||
        "Provider failed or returned an error.",
    };
  }

  if (isStuckProcessing(order)) {
    return {
      type: "Stuck Processing",
      priority: "medium",
      description: "Order has been processing for more than 24 hours.",
    };
  }

  if (isStuckPending(order)) {
    return {
      type: "Stuck Pending",
      priority: "medium",
      description: "Order has been pending for more than 30 minutes.",
    };
  }

  if (isHighValue(order)) {
    return {
      type: "High Value",
      priority: "low",
      description: "High value order. Recommended for admin review.",
    };
  }

  if (isPartial(order)) {
    return {
      type: "Partial",
      priority: "low",
      description: "Order is partially completed and may need review.",
    };
  }

  if (needsRefundReview(order)) {
    return {
      type: "Needs Refund Review",
      priority: "medium",
      description: "Order may require a refund/ticket review.",
    };
  }

  return {
    type: "New Pending",
    priority: "low",
    description: "New order waiting for processing.",
  };
}

function getPriorityClass(priority: Priority) {
  if (priority === "high") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (priority === "medium") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function getIssueClass(issue: AttentionIssue["type"]) {
  if (issue === "No Provider ID") return "text-orange-600";
  if (issue === "API Error") return "text-red-600";
  if (issue === "Stuck Pending") return "text-orange-600";
  if (issue === "Stuck Processing") return "text-purple-600";
  if (issue === "Failed Today") return "text-red-600";
  if (issue === "Partial") return "text-blue-600";
  if (issue === "Needs Refund Review") return "text-orange-600";
  if (issue === "High Value") return "text-blue-600";
  return "text-emerald-600";
}

function getStatusBadgeClass(status?: string | null) {
  const clean = normalizeStatus(status);

  if (clean === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (clean === "processing") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (clean === "partial") return "bg-purple-50 text-purple-700 ring-purple-100";
  if (clean === "pending") return "bg-orange-50 text-orange-700 ring-orange-100";
  if (clean === "refunded") return "bg-slate-100 text-slate-700 ring-slate-200";
  if (clean === "failed" || isCancelled(clean)) return "bg-red-50 text-red-700 ring-red-100";

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusBadgeClass(
        status,
      )}`}
    >
      {isCancelled(status) ? "cancelled" : normalizeStatus(status)}
    </span>
  );
}

function PlatformIcon({ serviceName }: { serviceName?: string | null }) {
  const name = String(serviceName || "").toLowerCase();

  let icon: ReactNode = <FaGlobe />;
  let label = "Website";
  let className = "bg-slate-50 text-slate-700 ring-slate-100";

  if (name.includes("instagram") || name.includes("ig ")) {
    icon = <FaInstagram />;
    label = "Instagram";
    className = "bg-pink-50 text-pink-600 ring-pink-100";
  } else if (name.includes("tiktok")) {
    icon = <FaTiktok />;
    label = "TikTok";
    className = "bg-slate-950 text-white ring-slate-900";
  } else if (name.includes("youtube") || name.includes("yt ")) {
    icon = <FaYoutube />;
    label = "YouTube";
    className = "bg-red-50 text-red-600 ring-red-100";
  } else if (name.includes("facebook") || name.includes("fb ")) {
    icon = <FaFacebookF />;
    label = "Facebook";
    className = "bg-blue-50 text-blue-600 ring-blue-100";
  } else if (name.includes("telegram")) {
    icon = <FaTelegramPlane />;
    label = "Telegram";
    className = "bg-sky-50 text-sky-600 ring-sky-100";
  } else if (name.includes("spotify")) {
    icon = <FaSpotify />;
    label = "Spotify";
    className = "bg-emerald-50 text-emerald-600 ring-emerald-100";
  } else if (name.includes("twitter") || name.includes(" x ") || name.startsWith("x ")) {
    icon = <FaTwitter />;
    label = "Twitter/X";
    className = "bg-sky-50 text-sky-600 ring-sky-100";
  } else if (name.includes("twitch")) {
    icon = <FaTwitch />;
    label = "Twitch";
    className = "bg-purple-50 text-purple-600 ring-purple-100";
  } else if (name.includes("discord")) {
    icon = <FaDiscord />;
    label = "Discord";
    className = "bg-indigo-50 text-indigo-600 ring-indigo-100";
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ${className}`}
      >
        {icon}
      </div>

      <span className="text-sm font-bold text-slate-700">{label}</span>
    </div>
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
  tone: "green" | "orange" | "red" | "purple" | "blue";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
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

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
      <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h3 className="text-2xl font-black text-slate-950">{title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>

        {footer && <div className="border-t border-slate-200 p-6">{footer}</div>}
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className={`mt-2 text-sm font-black ${valueClassName}`}>{value}</div>
    </div>
  );
}

export default function NewOrderMonitoringPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeFilter, setActiveFilter] = useState<AttentionFilter>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { confirmAction } = useConfirm();

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setOrders((data || []) as Order[]);
    setLastUpdated(
      new Date().toLocaleTimeString("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  async function syncAllStatuses() {
    if (syncingAll) return;

    setSyncingAll(true);
    setMessage("Syncing all order statuses...");

    try {
      const response = await fetch("/api/orders/sync-status", {
        method: "POST",
      });

      const result = await response.json();

      setMessage(result.message || "All order statuses synced.");
      setSyncingAll(false);
      loadOrders();
    } catch {
      setMessage("Failed to sync order statuses.");
      setSyncingAll(false);
    }
  }

  async function syncSingleOrder(order: Order) {
    if (actionLoadingId) return;

    setActionLoadingId(order.id);
    setMessage(`Syncing ${shortOrderId(order.id)}...`);

    try {
      const response = await fetch("/api/orders/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "sync",
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Order synced.");
      setActionLoadingId(null);
      loadOrders();
    } catch {
      setMessage("Failed to sync this order.");
      setActionLoadingId(null);
    }
  }

  async function retrySend(order: Order) {
    if (actionLoadingId) return;

    const confirmRetry = await confirmAction({
      title: "Retry Send / Sync Order",
      message:
        "This will use your existing provider action endpoint to retry/sync this order. Continue?",
      confirmText: "Retry / Sync",
    });

    if (!confirmRetry) return;

    setActionLoadingId(order.id);
    setMessage(`Retrying ${shortOrderId(order.id)}...`);

    try {
      const response = await fetch("/api/orders/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "sync",
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Retry/sync completed.");
      setActionLoadingId(null);
      loadOrders();
    } catch {
      setMessage("Failed to retry/sync this order.");
      setActionLoadingId(null);
    }
  }

  const monitoringStats = useMemo(() => {
    const newPending = orders.filter((order) => isPending(order) && isToday(order.created_at)).length;
    const noProviderId = orders.filter((order) => hasNoProviderId(order)).length;
    const apiErrors = orders.filter((order) => hasProviderError(order)).length;
    const stuckOrders = orders.filter((order) => isStuckPending(order) || isStuckProcessing(order)).length;
    const highValue = orders.filter((order) => isHighValue(order)).length;
    const failedToday = orders.filter((order) => isFailed(order) && isToday(order.created_at)).length;
    const partial = orders.filter((order) => isPartial(order)).length;
    const refundReview = orders.filter((order) => needsRefundReview(order)).length;

    return {
      newPending,
      noProviderId,
      apiErrors,
      stuckOrders,
      highValue,
      failedToday,
      partial,
      refundReview,
    };
  }, [orders]);

  const attentionOrders = useMemo(() => {
    const query = search.toLowerCase().trim();

    return orders
      .filter((order) => {
        const important =
          isPending(order) ||
          hasNoProviderId(order) ||
          hasProviderError(order) ||
          isStuckPending(order) ||
          isStuckProcessing(order) ||
          isHighValue(order) ||
          isPartial(order) ||
          needsRefundReview(order);

        if (!important) return false;

        const matchesSearch =
          !query ||
          String(order.id).toLowerCase().includes(query) ||
          String(order.user_id).toLowerCase().includes(query) ||
          String(order.service_name || "").toLowerCase().includes(query) ||
          String(order.link || "").toLowerCase().includes(query) ||
          String(order.provider_name || "").toLowerCase().includes(query) ||
          String(order.provider_order_id || "").toLowerCase().includes(query);

        const matchesFilter =
          activeFilter === "all"
            ? true
            : activeFilter === "no_provider"
              ? hasNoProviderId(order)
              : activeFilter === "api_error"
                ? hasProviderError(order)
                : activeFilter === "stuck_pending"
                  ? isStuckPending(order)
                  : activeFilter === "stuck_processing"
                    ? isStuckProcessing(order)
                    : activeFilter === "high_value"
                      ? isHighValue(order)
                      : activeFilter === "created_today"
                        ? isToday(order.created_at)
                        : isPartial(order);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const issueA = getOrderIssue(a);
        const issueB = getOrderIssue(b);

        const priorityScore = {
          high: 3,
          medium: 2,
          low: 1,
        };

        const scoreDiff = priorityScore[issueB.priority] - priorityScore[issueA.priority];

        if (scoreDiff !== 0) return scoreDiff;

        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [activeFilter, orders, search]);

  const providerStatusItems = useMemo(() => {
    const providerMap = new Map<
      string,
      {
        total: number;
        failed: number;
        noProviderId: number;
      }
    >();

    orders.forEach((order) => {
      const provider = order.provider_name || "Manual / No Provider";

      const current = providerMap.get(provider) || {
        total: 0,
        failed: 0,
        noProviderId: 0,
      };

      current.total += 1;

      if (hasProviderError(order)) current.failed += 1;
      if (!order.provider_order_id) current.noProviderId += 1;

      providerMap.set(provider, current);
    });

    return Array.from(providerMap.entries())
      .map(([provider, data]) => {
        const issueCount = data.failed + data.noProviderId;
        const status = issueCount === 0 ? "Connected" : issueCount >= 3 ? "Degraded" : "Warning";

        return {
          provider,
          ...data,
          status,
        };
      })
      .slice(0, 5);
  }, [orders]);

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                New Order Monitoring
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Live control center for new, stuck, failed, and provider-related orders.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadOrders}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={syncAllStatuses}
                disabled={syncingAll}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncingAll ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                {syncingAll ? "Syncing..." : "Sync All Status"}
              </button>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Auto Refresh: 15s
              </div>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="New Pending Orders"
              value={formatNumber(monitoringStats.newPending)}
              subtitle="Orders awaiting processing"
              icon={<ShoppingCart size={26} />}
              tone="green"
            />

            <StatCard
              title="No Provider ID"
              value={formatNumber(monitoringStats.noProviderId)}
              subtitle="Missing provider assignment"
              icon={<ShieldAlert size={26} />}
              tone="orange"
            />

            <StatCard
              title="API Errors"
              value={formatNumber(monitoringStats.apiErrors)}
              subtitle="Recent API error responses"
              icon={<TriangleAlert size={26} />}
              tone="red"
            />

            <StatCard
              title="Stuck Orders"
              value={formatNumber(monitoringStats.stuckOrders)}
              subtitle="Orders stuck in system"
              icon={<Clock3 size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="High Value Orders"
              value={formatNumber(monitoringStats.highValue)}
              subtitle="Orders above ₱1,000"
              icon={<Diamond size={26} />}
              tone="blue"
            />

            <StatCard
              title="Failed Today"
              value={formatNumber(monitoringStats.failedToday)}
              subtitle="Orders failed today"
              icon={<XCircle size={26} />}
              tone="red"
            />

            <StatCard
              title="Partial Orders"
              value={formatNumber(monitoringStats.partial)}
              subtitle="Partially completed orders"
              icon={<TimerReset size={26} />}
              tone="blue"
            />

            <StatCard
              title="Needs Refund Review"
              value={formatNumber(monitoringStats.refundReview)}
              subtitle="Refund review required"
              icon={<Siren size={26} />}
              tone="orange"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-950">Live Attention Feed</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Showing important orders only. Last updated {lastUpdated || "—"}.
                  </p>
                </div>

                <div className="flex h-11 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm lg:w-[330px]">
                  <Search size={18} className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search orders..."
                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="border-b border-slate-100 p-4">
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => {
                    const active = activeFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setActiveFilter(filter.value)}
                        className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Priority</th>
                      <th className="px-5 py-4 text-left">Order ID</th>
                      <th className="px-5 py-4 text-left">Platform</th>
                      <th className="px-5 py-4 text-left">Service</th>
                      <th className="px-5 py-4 text-left">Issue</th>
                      <th className="px-5 py-4 text-left">Price</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Provider</th>
                      <th className="px-5 py-4 text-left">Created</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {attentionOrders.map((order) => {
                      const issue = getOrderIssue(order);
                      const loadingThisOrder = actionLoadingId === order.id;

                      return (
                        <tr key={order.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                          <td className="px-5 py-5 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getPriorityClass(
                                issue.priority,
                              )}`}
                            >
                              {issue.priority}
                            </span>
                          </td>

                          <td className="px-5 py-5 align-top font-black text-emerald-700">
                            {shortOrderId(order.id)}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <PlatformIcon serviceName={order.service_name} />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="max-w-[220px] truncate font-black text-slate-800">
                              {order.service_name || "Unknown Service"}
                            </p>
                            <a
                              href={order.link || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block max-w-[220px] truncate text-xs font-bold text-blue-600 hover:text-blue-700"
                            >
                              {order.link || "No link"}
                            </a>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className={`font-black ${getIssueClass(issue.type)}`}>{issue.type}</p>
                            <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-400">
                              {issue.description}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top font-black text-emerald-600">
                            {formatMoney(order.price)}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">{order.provider_name || "—"}</p>
                            <p className="mt-1 max-w-[130px] truncate text-xs font-semibold text-slate-400">
                              {order.provider_order_id ? `ID: ${order.provider_order_id}` : "No provider ID"}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">{relativeTime(order.created_at)}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {formatDate(order.created_at)} · {formatTime(order.created_at)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                              >
                                <Eye size={14} />
                                View
                              </button>

                              {hasNoProviderId(order) || hasProviderError(order) ? (
                                <button
                                  type="button"
                                  onClick={() => retrySend(order)}
                                  disabled={Boolean(actionLoadingId)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {loadingThisOrder ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                  Retry Send
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => syncSingleOrder(order)}
                                  disabled={Boolean(actionLoadingId)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {loadingThisOrder ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                  Sync
                                </button>
                              )}

                              <Link
                                href={`/admin/orders?search=${order.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
                              >
                                Open Full Order
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {attentionOrders.length <= 0 && (
                      <tr>
                        <td colSpan={10} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                              <ShieldCheck size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No urgent orders found
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              Your order queue looks healthy for the selected filter.
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
                  Showing{" "}
                  <span className="font-black text-slate-800">{attentionOrders.length}</span>{" "}
                  important orders
                </p>

                <Link href="/admin/orders" className="inline-flex items-center gap-2 font-black text-emerald-700">
                  View all orders <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-950">Order Health</h3>
                  </div>

                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-100">
                    Live
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Pending too long
                    </span>
                    <span className="font-black text-red-600">{monitoringStats.stuckOrders}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-orange-500" />
                      Missing provider ID
                    </span>
                    <span className="font-black text-orange-600">{monitoringStats.noProviderId}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Failed provider responses
                    </span>
                    <span className="font-black text-red-600">{monitoringStats.apiErrors}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 font-semibold text-slate-600">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      High value new orders
                    </span>
                    <span className="font-black text-blue-600">{monitoringStats.highValue}</span>
                  </div>
                </div>

                <p className="mt-5 text-xs font-semibold text-slate-400">
                  Last updated: {lastUpdated || "—"}
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Filter size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Quick Filters</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFilter("no_provider")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">No Provider ID</span>
                    <span className="mt-1 block text-orange-600">{monitoringStats.noProviderId}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("api_error")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">API Error</span>
                    <span className="mt-1 block text-red-600">{monitoringStats.apiErrors}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("stuck_pending")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">Stuck Pending</span>
                    <span className="mt-1 block text-orange-600">
                      {orders.filter((order) => isStuckPending(order)).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("stuck_processing")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">Stuck Processing</span>
                    <span className="mt-1 block text-purple-600">
                      {orders.filter((order) => isStuckProcessing(order)).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("high_value")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">High Value</span>
                    <span className="mt-1 block text-blue-600">{monitoringStats.highValue}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("created_today")}
                    className="rounded-2xl bg-slate-50 px-3 py-3 text-left text-xs font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    <span className="block">Created Today</span>
                    <span className="mt-1 block text-emerald-600">
                      {orders.filter((order) => isToday(order.created_at)).length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("all");
                    setSearch("");
                  }}
                  className="mt-3 flex w-full items-center justify-center rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                >
                  Clear All Filters
                </button>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Provider Status</h3>
                </div>

                <div className="space-y-3">
                  {providerStatusItems.map((item) => {
                    const connected = item.status === "Connected";
                    const degraded = item.status === "Degraded";

                    return (
                      <div key={item.provider} className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-black text-slate-800">{item.provider}</p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                              connected
                                ? "bg-emerald-100 text-emerald-700"
                                : degraded
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {item.total} orders · {item.failed} failed · {item.noProviderId} missing IDs
                        </p>
                      </div>
                    );
                  })}

                  {providerStatusItems.length <= 0 && (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No provider data yet.
                    </p>
                  )}
                </div>

                <Link
                  href="/admin/providers"
                  className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  View providers
                  <ArrowRight size={15} />
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {selectedOrder && (
          <ModalShell
            title="Order Monitoring Details"
            subtitle="Review issue, provider data, and quick actions for this order."
            onClose={() => setSelectedOrder(null)}
            footer={
              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => syncSingleOrder(selectedOrder)}
                  disabled={Boolean(actionLoadingId)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoadingId === selectedOrder.id ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                  Sync Status
                </button>

                <Link
                  href={`/admin/orders?search=${selectedOrder.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Open Full Order
                  <ArrowRight size={17} />
                </Link>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <PlatformIcon serviceName={selectedOrder.service_name} />

                  <div className="min-w-0">
                    <h4 className="text-lg font-black text-slate-950">
                      {selectedOrder.service_name || "Unknown Service"}
                    </h4>

                    <a
                      href={selectedOrder.link || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block break-all text-sm font-bold text-blue-600 hover:text-blue-700"
                    >
                      {selectedOrder.link || "No link"}
                    </a>
                  </div>
                </div>

                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-orange-700">
                  Detected Issue
                </p>

                <h4 className={`mt-2 text-lg font-black ${getIssueClass(getOrderIssue(selectedOrder).type)}`}>
                  {getOrderIssue(selectedOrder).type}
                </h4>

                <p className="mt-1 text-sm font-semibold leading-6 text-orange-800">
                  {getOrderIssue(selectedOrder).description}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <InfoBlock label="Order ID" value={selectedOrder.id} />
                <InfoBlock label="User" value={shortUserId(selectedOrder.user_id)} />
                <InfoBlock label="Price" value={formatMoney(selectedOrder.price)} valueClassName="text-emerald-600" />
                <InfoBlock label="Quantity" value={formatNumber(selectedOrder.quantity)} />
                <InfoBlock label="Start Count" value={formatNumber(selectedOrder.start_count)} />
                <InfoBlock label="Current Count" value={formatNumber(selectedOrder.current_count)} />
                <InfoBlock label="Provider" value={selectedOrder.provider_name || "Manual / No Provider"} />
                <InfoBlock label="Provider Order ID" value={selectedOrder.provider_order_id || "No provider ID"} />
                <InfoBlock label="Created" value={`${formatDate(selectedOrder.created_at)} · ${formatTime(selectedOrder.created_at)}`} />
              </div>

              {(selectedOrder.provider_error || selectedOrder.error_message || selectedOrder.provider_message) && (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">
                    Provider Error Message
                  </p>

                  <p className="mt-2 break-words text-sm font-bold leading-6 text-red-800">
                    {selectedOrder.provider_error ||
                      selectedOrder.error_message ||
                      selectedOrder.provider_message}
                  </p>
                </div>
              )}
            </div>
          </ModalShell>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

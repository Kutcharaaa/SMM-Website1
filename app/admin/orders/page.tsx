"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { useConfirm } from "@/components/ConfirmProvider";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  Package,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  SlidersHorizontal,
  Undo2,
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
  service_name: string;
  link: string;
  quantity: number;
  price: number;
  start_count: number;
  current_count: number;
  status: string;
  created_at: string;
  provider_order_id?: string | null;
  provider_name?: string | null;
  reseller_points_awarded?: boolean;
};

type StatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled"
  | "refunded";

type ModalMode = "view" | "manage" | "refund" | null;

const statusTabs: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Partial", value: "partial" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const statusOptions = [
  "pending",
  "processing",
  "completed",
  "partial",
  "cancelled",
  "failed",
  "refunded",
];

function normalizeStatus(status?: string | null) {
  return String(status || "pending").toLowerCase().trim();
}

function isCancelledStatus(status?: string | null) {
  const clean = normalizeStatus(status);
  return clean === "cancelled" || clean === "canceled";
}

function isActiveStatus(status?: string | null) {
  const clean = normalizeStatus(status);
  return clean === "pending" || clean === "processing" || clean === "partial";
}

function isRefundAllowed(order: Order | null, refundEnabled: boolean) {
  if (!order || !refundEnabled) return false;
  return normalizeStatus(order.status) === "pending";
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

function shortOrderId(id: string) {
  return `#${String(id).slice(0, 6).toUpperCase()}`;
}

function shortUserId(id: string) {
  return `User ${String(id).slice(0, 6).toUpperCase()}`;
}

function getRemains(order: Order) {
  const quantity = Number(order.quantity || 0);
  const current = Number(order.current_count || 0);
  return Math.max(quantity - current, 0);
}

function getProgressPercent(order: Order) {
  const quantity = Number(order.quantity || 0);
  const current = Number(order.current_count || 0);

  if (quantity <= 0) return 0;

  return Math.min(100, Math.max(0, (current / quantity) * 100));
}

function getStatusBadgeClass(status?: string | null) {
  const clean = normalizeStatus(status);

  if (clean === "completed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (clean === "processing") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (clean === "partial") {
    return "bg-purple-50 text-purple-700 ring-purple-100";
  }

  if (clean === "pending") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (clean === "refunded") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  if (clean === "failed" || isCancelledStatus(clean)) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusBadgeClass(
        status,
      )}`}
    >
      {isCancelledStatus(status) ? "cancelled" : normalizeStatus(status)}
    </span>
  );
}

function PlatformIcon({ serviceName }: { serviceName?: string | null }) {
  const name = String(serviceName || "").toLowerCase();

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
  } else if (
    name.includes("twitter") ||
    name.includes(" x ") ||
    name.startsWith("x ")
  ) {
    icon = <FaTwitter />;
    className = "bg-sky-50 text-sky-600 ring-sky-100";
  } else if (name.includes("twitch")) {
    icon = <FaTwitch />;
    className = "bg-purple-50 text-purple-600 ring-purple-100";
  } else if (name.includes("discord")) {
    icon = <FaDiscord />;
    className = "bg-indigo-50 text-indigo-600 ring-indigo-100";
  }

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ${className}`}
    >
      {icon}
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
  tone: "blue" | "green" | "orange" | "red" | "purple" | "slate";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];

  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 min-w-0 truncate text-2xl font-black tracking-tight text-slate-950">
            {value}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
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
  tone?: "slate" | "green" | "blue" | "red";
}) {
  const toneClass = {
    slate:
      "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    green:
      "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
    blue: "border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50",
    red: "border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50",
  }[tone];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
      <div className="my-4 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
              {title}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 p-5 sm:p-6">
            {footer}
          </div>
        )}
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
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div
        className={`mt-2 min-w-0 break-words text-sm font-black ${valueClassName}`}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const [newStatus, setNewStatus] = useState("");
  const [startCount, setStartCount] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);

  const [refundEnabled, setRefundEnabled] = useState(true);
  const [message, setMessage] = useState("");

  const [syncingOrders, setSyncingOrders] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState(false);
  const [providerActionLoading, setProviderActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<
    "all" | "high_value" | "no_provider" | "old_pending"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const { confirmAction } = useConfirm();

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setOrders((data || []) as Order[]);

    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "refund_enabled")
      .single();

    setRefundEnabled(setting?.value === "true");
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function openModal(order: Order, mode: Exclude<ModalMode, null>) {
    setSelectedOrder(order);
    setModalMode(mode);
    setNewStatus(order.status);
    setStartCount(Number(order.start_count || 0));
    setCurrentCount(Number(order.current_count || 0));
    setMessage("");
  }

  function closeModal() {
    setSelectedOrder(null);
    setModalMode(null);
    setNewStatus("");
  }

  async function syncOrderStatuses() {
    if (syncingOrders) return;

    setSyncingOrders(true);
    setMessage("Syncing order statuses...");

    try {
      const response = await fetch("/api/orders/sync-status", {
        method: "POST",
      });

      const result = await response.json();

      setMessage(result.message || "Orders synced.");
      setSyncingOrders(false);
      loadOrders();
    } catch {
      setMessage("Failed to sync orders.");
      setSyncingOrders(false);
    }
  }

  async function handleProviderAction(action: "sync" | "cancel" | "refill") {
    if (providerActionLoading) return;

    setProviderActionLoading(true);

    if (!selectedOrder) {
      setProviderActionLoading(false);
      return;
    }

    if (action === "cancel") {
      const confirmCancel = await confirmAction({
        title: "Cancel Provider Order",
        message:
          "Are you sure you want to send a cancel request to the provider?",
        confirmText: "Cancel Provider Order",
        variant: "danger",
      });

      if (!confirmCancel) {
        setProviderActionLoading(false);
        return;
      }
    }

    setMessage(`Processing ${action} request...`);

    try {
      const response = await fetch("/api/orders/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action,
        }),
      });

      const result = await response.json();

      setMessage(result.message || "Action completed.");
      setProviderActionLoading(false);
      loadOrders();
    } catch {
      setMessage("Failed to process provider action.");
      setProviderActionLoading(false);
    }
  }

  function getResellerLevel(totalSpent: number) {
    if (totalSpent >= 500000) return "Ascend Partner";
    if (totalSpent >= 250000) return "Elite Partner";
    if (totalSpent >= 150000) return "Master Reseller";
    if (totalSpent >= 60000) return "Pro Reseller";
    if (totalSpent >= 20000) return "Power Reseller";
    return "New Reseller";
  }

  async function awardResellerRewards(order: Order) {
    if (order.reseller_points_awarded) return;

    const orderPrice = Number(order.price || 0);

    if (orderPrice <= 0) return;

    const pointsEarned = Math.floor(orderPrice / 200);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_spent, reseller_points")
      .eq("id", order.user_id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    const newTotalSpent = Number(profile?.total_spent || 0) + orderPrice;
    const newPoints = Number(profile?.reseller_points || 0) + pointsEarned;
    const newLevel = getResellerLevel(newTotalSpent);

    await supabase
      .from("profiles")
      .update({
        total_spent: newTotalSpent,
        reseller_points: newPoints,
        reseller_level: newLevel,
      })
      .eq("id", order.user_id);

    await supabase
      .from("orders")
      .update({
        reseller_points_awarded: true,
      })
      .eq("id", order.id);
  }

  async function updateOrderStatus() {
    if (savingOrder) return;

    setSavingOrder(true);

    if (!selectedOrder || !newStatus) {
      setSavingOrder(false);
      return;
    }

    const confirmUpdate = await confirmAction({
      title: "Update Order Status",
      message: `Change this order status to "${newStatus}"?`,
      confirmText: "Update Status",
    });

    if (!confirmUpdate) {
      setSavingOrder(false);
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        start_count: startCount,
        current_count: currentCount,
      })
      .eq("id", selectedOrder.id);

    if (error) {
      setMessage(error.message);
      setSavingOrder(false);
      return;
    }

    if (
      newStatus === "completed" &&
      selectedOrder.status !== "completed" &&
      !selectedOrder.reseller_points_awarded
    ) {
      await awardResellerRewards(selectedOrder);
    }

    await supabase.from("notifications").insert({
      user_id: selectedOrder.user_id,
      title: "Order Status Updated",
      message: `Your order for ${selectedOrder.service_name} is now ${newStatus}.`,
      type: "order_status_updated",
      is_read: false,
    });

    setMessage("Order updated successfully.");
    setSavingOrder(false);
    closeModal();
    loadOrders();
  }

  async function refundOrder() {
    if (refundingOrder) return;

    setRefundingOrder(true);

    if (!selectedOrder) {
      setRefundingOrder(false);
      return;
    }

    if (!refundEnabled) {
      setMessage("Refunds are currently disabled.");
      setRefundingOrder(false);
      return;
    }

    if (selectedOrder.status !== "pending") {
      setMessage("Only pending orders can be refunded.");
      setRefundingOrder(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", selectedOrder.user_id)
      .single();

    if (profileError) {
      setMessage(profileError.message);
      setRefundingOrder(false);
      return;
    }

    const currentBalance = Number(profile?.balance || 0);
    const refundAmount = Number(selectedOrder.price || 0);
    const newBalance = currentBalance + refundAmount;

    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
      })
      .eq("id", selectedOrder.user_id);

    if (balanceError) {
      setMessage(balanceError.message);
      setRefundingOrder(false);
      return;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
      })
      .eq("id", selectedOrder.id);

    if (orderError) {
      setMessage(orderError.message);
      setRefundingOrder(false);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: selectedOrder.user_id,
      title: "Order Refunded",
      message: `Your pending order was cancelled and ₱${refundAmount.toFixed(
        2,
      )} was refunded to your wallet.`,
      type: "order_refunded",
      is_read: false,
    });

    setMessage("Order refunded successfully.");
    setRefundingOrder(false);
    closeModal();
    loadOrders();
  }

  const serviceOptions = useMemo(() => {
    return Array.from(
      new Set(orders.map((order) => order.service_name).filter(Boolean)),
    ).sort();
  }, [orders]);

  const stats = useMemo(() => {
    const completed = orders.filter(
      (order) => normalizeStatus(order.status) === "completed",
    ).length;

    const pending = orders.filter(
      (order) => normalizeStatus(order.status) === "pending",
    ).length;

    const processing = orders.filter(
      (order) => normalizeStatus(order.status) === "processing",
    ).length;

    const partial = orders.filter(
      (order) => normalizeStatus(order.status) === "partial",
    ).length;

    const failed = orders.filter(
      (order) => normalizeStatus(order.status) === "failed",
    ).length;

    const cancelled = orders.filter((order) =>
      isCancelledStatus(order.status),
    ).length;

    const refunded = orders.filter(
      (order) => normalizeStatus(order.status) === "refunded",
    ).length;

    const active = orders.filter((order) => isActiveStatus(order.status)).length;

    return {
      total: orders.length,
      active,
      completed,
      failed,
      pending,
      processing,
      partial,
      cancelled,
      refunded,
    };
  }, [orders]);

  const oldPendingCount = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      return (
        normalizeStatus(order.status) === "pending" &&
        now - new Date(order.created_at).getTime() > dayMs
      );
    }).length;
  }, [orders]);

  const highValueCount = useMemo(() => {
    return orders.filter((order) => Number(order.price || 0) >= 1000).length;
  }, [orders]);

  const withoutProviderCount = useMemo(() => {
    return orders.filter((order) => !order.provider_order_id).length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();

    return orders.filter((order) => {
      const cleanStatus = normalizeStatus(order.status);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "cancelled"
            ? isCancelledStatus(order.status)
            : cleanStatus === statusFilter;

      const matchesService =
        serviceFilter === "all" ? true : order.service_name === serviceFilter;

      const matchesSearch =
        !query ||
        String(order.id).toLowerCase().includes(query) ||
        String(order.user_id).toLowerCase().includes(query) ||
        String(order.service_name || "").toLowerCase().includes(query) ||
        String(order.link || "").toLowerCase().includes(query) ||
        String(order.provider_name || "").toLowerCase().includes(query) ||
        String(order.provider_order_id || "").toLowerCase().includes(query);

      const matchesQuick =
        quickFilter === "all"
          ? true
          : quickFilter === "high_value"
            ? Number(order.price || 0) >= 1000
            : quickFilter === "no_provider"
              ? !order.provider_order_id
              : normalizeStatus(order.status) === "pending" &&
                Date.now() - new Date(order.created_at).getTime() >
                  24 * 60 * 60 * 1000;

      return matchesStatus && matchesService && matchesSearch && matchesQuick;
    });
  }, [orders, quickFilter, search, serviceFilter, statusFilter]);

  const pageSizeOptions = [10, 20, 50, 100, 1000];
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ordersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * ordersPerPage;
  const pageEndIndex = pageStartIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(pageStartIndex, pageEndIndex);
  const showingFrom =
    filteredOrders.length <= 0 ? 0 : Math.min(pageStartIndex + 1, filteredOrders.length);
  const showingTo = Math.min(pageEndIndex, filteredOrders.length);

  useEffect(() => {
    setCurrentPage(1);
  }, [quickFilter, search, serviceFilter, statusFilter, ordersPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function exportOrdersToPDF() {
    const logoUrl = "/logo.png";

    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + Number(order.price || 0),
      0,
    );

    const completedCount = filteredOrders.filter(
      (order) => normalizeStatus(order.status) === "completed",
    ).length;

    const activeCount = filteredOrders.filter((order) =>
      isActiveStatus(order.status),
    ).length;

    const rowsHtml = filteredOrders
      .map((order) => {
        return `
          <tr>
            <td>${shortOrderId(order.id)}</td>
            <td>${shortUserId(order.user_id)}</td>
            <td>${order.service_name || "Unknown Service"}</td>
            <td>${Number(order.quantity || 0).toLocaleString("en-PH")}</td>
            <td>${formatMoney(order.price)}</td>
            <td><span class="status ${normalizeStatus(order.status)}">${normalizeStatus(
              order.status,
            )}</span></td>
            <td>${order.provider_name || "Manual"}</td>
            <td>${order.provider_order_id || "No Provider ID"}</td>
            <td>${formatDate(order.created_at)} ${formatTime(order.created_at)}</td>
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
          <title>Orders Report</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 32px;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              background: #ffffff;
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 24px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 24px;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .logo {
              width: 160px;
              max-height: 70px;
              object-fit: contain;
            }

            h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 900;
              letter-spacing: -0.04em;
            }

            .muted {
              color: #64748b;
              font-size: 13px;
              font-weight: 700;
              line-height: 1.7;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 14px;
              margin-bottom: 24px;
            }

            .card {
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              padding: 16px;
              background: #f8fafc;
            }

            .card span {
              display: block;
              font-size: 11px;
              font-weight: 900;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .card strong {
              display: block;
              margin-top: 8px;
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
              border: 1px solid #e2e8f0;
            }

            th {
              background: #f8fafc;
              color: #64748b;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.08em;
              font-weight: 900;
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
              text-align: left;
            }

            td {
              padding: 12px;
              border-bottom: 1px solid #e2e8f0;
              font-weight: 700;
              color: #334155;
              vertical-align: top;
            }

            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 900;
              text-transform: capitalize;
            }

            .status.completed {
              color: #047857;
              background: #ecfdf5;
            }

            .status.pending,
            .status.processing,
            .status.partial {
              color: #c2410c;
              background: #fff7ed;
            }

            .status.failed,
            .status.cancelled,
            .status.canceled {
              color: #dc2626;
              background: #fef2f2;
            }

            .status.refunded {
              color: #475569;
              background: #f1f5f9;
            }

            .footer {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 11px;
              font-weight: 700;
              display: flex;
              justify-content: space-between;
              gap: 20px;
            }

            @media print {
              body {
                padding: 18px;
              }

              table {
                font-size: 10px;
              }

              th,
              td {
                padding: 8px;
              }
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">
              <img src="${logoUrl}" class="logo" />
              <div>
                <h1>Orders Report</h1>
                <p class="muted">Ascend Service · Generated ${reportDate}</p>
              </div>
            </div>

            <div class="muted">
              <div>Total Records: ${filteredOrders.length}</div>
              <div>Status Filter: ${statusFilter}</div>
              <div>Service Filter: ${serviceFilter}</div>
              <div>Quick Filter: ${quickFilter}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card">
              <span>Total Orders</span>
              <strong>${filteredOrders.length}</strong>
            </div>

            <div class="card">
              <span>Active Orders</span>
              <strong>${activeCount}</strong>
            </div>

            <div class="card">
              <span>Completed</span>
              <strong>${completedCount}</strong>
            </div>

            <div class="card">
              <span>Total Revenue</span>
              <strong>${formatMoney(totalRevenue)}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Service</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Provider ID</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              ${
                rowsHtml ||
                `<tr>
                  <td colspan="9" style="text-align:center; padding: 32px;">
                    No order records found.
                  </td>
                </tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Elevate Your Social Presence</span>
            <span>This report was generated from the Admin Orders page.</span>
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
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Orders
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Monitor, manage, update, refund, and review all customer orders.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
              <button
                type="button"
                onClick={loadOrders}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={syncOrderStatuses}
                disabled={syncingOrders}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {syncingOrders ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                {syncingOrders ? "Syncing..." : "Sync Status"}
              </button>

              <button
                type="button"
                onClick={exportOrdersToPDF}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <FileText size={17} />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
              <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="shrink-0 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search orders by ID, service, provider, user, or link..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {statusTabs.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label} Status
                  </option>
                ))}
              </select>

              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                <option value="all">All Services</option>
                {serviceOptions.map((service) => (
                  <option key={service || "unknown"} value={service || ""}>
                    {service}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setServiceFilter("all");
                  setQuickFilter("all");
                }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:w-auto"
              >
                <Filter size={17} />
                Clear
              </button>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={formatNumber(stats.total)}
              subtitle="All time orders"
              icon={<ShoppingCart size={23} />}
              tone="blue"
            />

            <StatCard
              title="Active Orders"
              value={formatNumber(stats.active)}
              subtitle="Pending / Processing / Partial"
              icon={<Clock3 size={23} />}
              tone="orange"
            />

            <StatCard
              title="Completed Orders"
              value={formatNumber(stats.completed)}
              subtitle="Successfully completed"
              icon={<CheckCircle2 size={23} />}
              tone="green"
            />

            <StatCard
              title="Failed Orders"
              value={formatNumber(stats.failed)}
              subtitle="Failed by provider"
              icon={<XCircle size={23} />}
              tone="red"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Pending Orders"
              value={formatNumber(stats.pending)}
              subtitle="Waiting to start"
              icon={<Clock3 size={23} />}
              tone="orange"
            />

            <StatCard
              title="Processing Orders"
              value={formatNumber(stats.processing)}
              subtitle="Currently in progress"
              icon={<RefreshCw size={23} />}
              tone="blue"
            />

            <StatCard
              title="Partial Orders"
              value={formatNumber(stats.partial)}
              subtitle="Partially completed"
              icon={<Package size={23} />}
              tone="purple"
            />

            <StatCard
              title="Refunded Orders"
              value={formatNumber(stats.refunded)}
              subtitle="Refunded orders"
              icon={<Undo2 size={23} />}
              tone="slate"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
                  {statusTabs.map((tab) => {
                    const active = statusFilter === tab.value;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Order ID</th>
                      <th className="px-5 py-4 text-left">User</th>
                      <th className="px-5 py-4 text-left">Service</th>
                      <th className="px-5 py-4 text-left">Link</th>
                      <th className="px-5 py-4 text-left">Quantity</th>
                      <th className="px-5 py-4 text-left">Start</th>
                      <th className="px-5 py-4 text-left">Remains</th>
                      <th className="px-5 py-4 text-left">Price</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Provider</th>
                      <th className="px-5 py-4 text-left">Created</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedOrders.map((order) => {
                      const progress = getProgressPercent(order);

                      return (
                        <tr
                          key={order.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-5 align-top font-black text-emerald-700">
                            {shortOrderId(order.id)}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">
                              {shortUserId(order.user_id)}
                            </p>

                            <p className="mt-1 max-w-[140px] truncate text-xs font-semibold text-slate-400">
                              {order.user_id}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex items-start gap-3">
                              <PlatformIcon serviceName={order.service_name} />

                              <div className="min-w-0">
                                <p className="max-w-[230px] truncate font-black text-slate-800">
                                  {order.service_name || "Unknown Service"}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-400">
                                  {formatNumber(order.quantity)} quantity
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <a
                              href={order.link}
                              target="_blank"
                              rel="noreferrer"
                              className="block max-w-[180px] truncate text-sm font-bold text-blue-600 hover:text-blue-700"
                            >
                              {order.link || "—"}
                            </a>
                          </td>

                          <td className="px-5 py-5 align-top font-black text-slate-700">
                            {formatNumber(order.quantity)}
                          </td>

                          <td className="px-5 py-5 align-top font-semibold text-slate-500">
                            {formatNumber(order.start_count)}
                          </td>

                          <td className="px-5 py-5 align-top font-semibold text-slate-500">
                            {formatNumber(getRemains(order))}
                          </td>

                          <td className="px-5 py-5 align-top font-black text-emerald-600">
                            {formatMoney(order.price)}
                          </td>

                          <td className="px-5 py-5 align-top">
                            <StatusBadge status={order.status} />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">
                              {order.provider_name || "Manual"}
                            </p>

                            <p className="mt-1 max-w-[130px] truncate text-xs font-semibold text-slate-400">
                              {order.provider_order_id
                                ? `ID: ${order.provider_order_id}`
                                : "No provider ID"}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">
                              {formatDate(order.created_at)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {formatTime(order.created_at)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex items-center gap-2">
                              <ActionButton
                                title="View order"
                                onClick={() => openModal(order, "view")}
                              >
                                <Eye size={16} />
                              </ActionButton>

                              <ActionButton
                                title="Update order"
                                onClick={() => openModal(order, "manage")}
                                tone="green"
                              >
                                <Pencil size={16} />
                              </ActionButton>

                              <ActionButton
                                title={
                                  isRefundAllowed(order, refundEnabled)
                                    ? "Refund order"
                                    : "Refund only available for pending orders"
                                }
                                onClick={() => openModal(order, "refund")}
                                disabled={!isRefundAllowed(order, refundEnabled)}
                                tone="red"
                              >
                                <RotateCcw size={16} />
                              </ActionButton>
                            </div>

                            <div className="mt-3 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOrders.length <= 0 && (
                      <tr>
                        <td colSpan={12} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <Package size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No orders found
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

              <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <p>
                    Showing{" "}
                    <span className="font-black text-slate-800">
                      {showingFrom}
                    </span>{" "}
                    to{" "}
                    <span className="font-black text-slate-800">
                      {showingTo}
                    </span>{" "}
                    of{" "}
                    <span className="font-black text-slate-800">
                      {filteredOrders.length}
                    </span>{" "}
                    filtered orders
                  </p>

                  <span className="hidden text-slate-300 sm:inline">•</span>

                  <p>
                    Total:{" "}
                    <span className="font-black text-slate-800">
                      {orders.length}
                    </span>{" "}
                    orders
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Rows
                    </span>

                    <select
                      value={ordersPerPage}
                      onChange={(event) => {
                        setOrdersPerPage(Number(event.target.value));
                        setCurrentPage(1);
                      }}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-400"
                    >
                      {pageSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size} / page
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage <= 1}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      First
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={safeCurrentPage <= 1}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Prev
                    </button>

                    <div className="flex h-10 min-w-[96px] items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-700">
                      {safeCurrentPage} / {totalPages}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={safeCurrentPage >= totalPages}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage >= totalPages}
                      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Order Health
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Pending too long
                    </span>
                    <span className="font-black text-orange-600">
                      {oldPendingCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Failed orders
                    </span>
                    <span className="font-black text-red-600">
                      {stats.failed}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Partial orders
                    </span>
                    <span className="font-black text-purple-600">
                      {stats.partial}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Refunded orders
                    </span>
                    <span className="font-black text-slate-700">
                      {stats.refunded}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-slate-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Quick Filters
                  </h3>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setQuickFilter("high_value")}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      quickFilter === "high_value"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="min-w-0 truncate">High value orders</span>
                    <span className="shrink-0">{highValueCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter("no_provider")}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      quickFilter === "no_provider"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      Orders without provider ID
                    </span>
                    <span className="shrink-0">{withoutProviderCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter("old_pending")}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                      quickFilter === "old_pending"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="min-w-0 truncate">
                      Orders older than 24h pending
                    </span>
                    <span className="shrink-0">{oldPendingCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickFilter("all")}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Clear Quick Filters
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  <h3 className="text-lg font-black text-slate-950">
                    Refund Note
                  </h3>
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-500">
                  Refund button is only enabled for pending orders. Users should
                  still request refunds through Tickets first.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {selectedOrder && modalMode === "view" && (
          <ModalShell
            title="Order Details"
            subtitle="Review full order information before making changes."
            onClose={closeModal}
          >
            <div className="space-y-6">
              <div className="flex min-w-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 sm:flex-row sm:items-start">
                <PlatformIcon serviceName={selectedOrder.service_name} />

                <div className="min-w-0 flex-1">
                  <h4 className="line-clamp-2 text-lg font-black text-slate-950">
                    {selectedOrder.service_name}
                  </h4>

                  <a
                    href={selectedOrder.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm font-bold text-blue-600 hover:text-blue-700"
                  >
                    {selectedOrder.link}
                  </a>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <InfoBlock label="Order ID" value={selectedOrder.id} />
                <InfoBlock
                  label="User"
                  value={shortUserId(selectedOrder.user_id)}
                />
                <InfoBlock
                  label="Price"
                  value={formatMoney(selectedOrder.price)}
                  valueClassName="text-emerald-600"
                />
                <InfoBlock
                  label="Quantity"
                  value={formatNumber(selectedOrder.quantity)}
                />
                <InfoBlock
                  label="Start Count"
                  value={formatNumber(selectedOrder.start_count)}
                />
                <InfoBlock
                  label="Current Count"
                  value={formatNumber(selectedOrder.current_count)}
                />
                <InfoBlock
                  label="Remains"
                  value={formatNumber(getRemains(selectedOrder))}
                />
                <InfoBlock
                  label="Provider"
                  value={selectedOrder.provider_name || "Manual"}
                />
                <InfoBlock
                  label="Provider Order ID"
                  value={selectedOrder.provider_order_id || "No provider ID"}
                />
                <InfoBlock
                  label="Created Date"
                  value={formatDate(selectedOrder.created_at)}
                />
                <InfoBlock
                  label="Created Time"
                  value={formatTime(selectedOrder.created_at)}
                />
                <InfoBlock
                  label="Progress"
                  value={`${getProgressPercent(selectedOrder).toFixed(1)}%`}
                />
              </div>
            </div>
          </ModalShell>
        )}

        {selectedOrder && modalMode === "manage" && (
          <ModalShell
            title="Update Order"
            subtitle="Update order status, counts, or send provider actions."
            onClose={closeModal}
            footer={
              <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={updateOrderStatus}
                  disabled={savingOrder}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {savingOrder && (
                    <Loader2 size={17} className="animate-spin" />
                  )}
                  {savingOrder ? "Saving..." : "Save Changes"}
                </button>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <InfoBlock
                  label="Service"
                  value={
                    <span className="line-clamp-2">
                      {selectedOrder.service_name}
                    </span>
                  }
                />
                <InfoBlock
                  label="Price"
                  value={formatMoney(selectedOrder.price)}
                  valueClassName="text-emerald-600"
                />
                <InfoBlock
                  label="Provider"
                  value={selectedOrder.provider_name || "Manual"}
                />
                <InfoBlock
                  label="Current Status"
                  value={<StatusBadge status={selectedOrder.status} />}
                />
              </div>

              {selectedOrder.provider_order_id && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleProviderAction("sync")}
                    disabled={providerActionLoading}
                    className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {providerActionLoading
                      ? "Processing..."
                      : "Sync This Order"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderAction("cancel")}
                    disabled={providerActionLoading}
                    className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {providerActionLoading
                      ? "Processing..."
                      : "Cancel Provider Order"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderAction("refill")}
                    disabled={providerActionLoading}
                    className="rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {providerActionLoading
                      ? "Processing..."
                      : "Request Refill"}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Start Count
                  </label>

                  <input
                    type="number"
                    value={startCount}
                    onChange={(event) =>
                      setStartCount(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Current Count
                  </label>

                  <input
                    type="number"
                    value={currentCount}
                    onChange={(event) =>
                      setCurrentCount(Number(event.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Update Status
                </label>

                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ModalShell>
        )}

        {selectedOrder && modalMode === "refund" && (
          <ModalShell
            title="Refund Order"
            subtitle="Confirm this refund only after reviewing the user's ticket request."
            onClose={closeModal}
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Refund amount:{" "}
                  <span className="font-black text-red-600">
                    {formatMoney(selectedOrder.price)}
                  </span>
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={refundOrder}
                    disabled={
                      !isRefundAllowed(selectedOrder, refundEnabled) ||
                      refundingOrder
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {refundingOrder && (
                      <Loader2 size={17} className="animate-spin" />
                    )}
                    {refundingOrder ? "Refunding..." : "Confirm Refund"}
                  </button>
                </div>
              </div>
            }
          >
            <div className="space-y-5">
              {!refundEnabled && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                  Refund system is currently disabled.
                </div>
              )}

              {refundEnabled && selectedOrder.status !== "pending" && (
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold text-orange-700">
                  Only pending orders can be refunded with the current refund
                  logic.
                </div>
              )}

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                <InfoBlock label="Order ID" value={selectedOrder.id} />
                <InfoBlock
                  label="User"
                  value={shortUserId(selectedOrder.user_id)}
                />
                <InfoBlock
                  label="Service"
                  value={
                    <span className="line-clamp-2">
                      {selectedOrder.service_name}
                    </span>
                  }
                />
                <InfoBlock
                  label="Current Status"
                  value={<StatusBadge status={selectedOrder.status} />}
                />
                <InfoBlock
                  label="Order Price"
                  value={formatMoney(selectedOrder.price)}
                  valueClassName="text-red-600"
                />
                <InfoBlock
                  label="Created"
                  value={`${formatDate(selectedOrder.created_at)} ${formatTime(
                    selectedOrder.created_at,
                  )}`}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold leading-6 text-slate-600">
                  This will add the order price back to the user's wallet,
                  update the order to cancelled, and create a notification for
                  the user. Later, we can connect this directly to a Ticket ID.
                </p>
              </div>
            </div>
          </ModalShell>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
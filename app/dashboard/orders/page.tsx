"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Gamepad2,
  Globe2,
  Grid3X3,
  Heart,
  Info,
  Link as LinkIcon,
  MessageSquare,
  Minus,
  Music,
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
import { useEffect, useMemo, useState } from "react";

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
};

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
  status: string;
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

export default function OrdersPage() {
  const { showToast } = useToast();

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

    setOrders(data || []);
    setLoading(false);
  }

  async function loadOrderData() {
    const { data: serviceData } = await supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order("category");

    setServices(serviceData || []);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", authData.user.id)
      .single();

    if (profileData) setProfile(profileData);
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
  }

  refreshOrders();

  const interval = setInterval(() => {
    refreshOrders();
  }, 30000);

  return () => clearInterval(interval);
}, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const processingOrders = orders.filter(
    (o) => o.status === "processing",
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
        order.link?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "all" ? true : order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, statusFilter]);

  const networkServices = useMemo(() => {
    if (network === "Everything") return services;

    if (network === "Others") {
      return services.filter((service) => {
        const text = `${service.name} ${service.category}`.toLowerCase();

        return !networks
          .filter(
            (item) => item.name !== "Others" && item.name !== "Everything",
          )
          .some((item) => text.includes(item.name.toLowerCase()));
      });
    }

    return services.filter((service) => {
      const text = `${service.name} ${service.category}`.toLowerCase();
      return text.includes(network.toLowerCase());
    });
  }, [services, network]);

  const categories = useMemo(() => {
    return [...new Set(networkServices.map((service) => service.category))]
      .filter(Boolean)
      .sort();
  }, [networkServices]);

  const filteredServices = useMemo(() => {
    const keyword = serviceSearch.toLowerCase().trim();

    let rows = networkServices.filter((service) => {
      if (!category) return true;
      return service.category === category;
    });

    if (keyword) {
      rows = rows.filter((service) => {
        const publicId = getPublicServiceId(service).toLowerCase();

        return (
          publicId.includes(keyword) ||
          service.name.toLowerCase().includes(keyword) ||
          service.category.toLowerCase().includes(keyword) ||
          service.provider_service_id?.toLowerCase().includes(keyword)
        );
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

  function getPublicServiceId(service: Service | null) {
    if (!service) return "N/A";
    return service.provider_service_id || service.id.slice(0, 8);
  }

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

  function getStatusStyle(status: string) {
    if (status === "completed") return "bg-green-50 text-green-600";
    if (status === "cancelled" || status === "canceled")
      return "bg-red-50 text-red-600";
    if (status === "processing") return "bg-blue-50 text-blue-600";
    return "bg-yellow-50 text-yellow-600";
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
                value={`₱${totalSpent.toFixed(2)}`}
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
                    placeholder="Search by service, link, or order ID..."
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
                <table className="w-full min-w-[950px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-5 text-left font-black">Order ID</th>
                      <th className="p-5 text-left font-black">Service</th>
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
                        <td
                          colSpan={8}
                          className="p-10 text-center text-slate-500"
                        >
                          Loading orders...
                        </td>
                      </tr>
                    ) : filteredOrders.length <= 0 ? (
                      <tr>
                        <td colSpan={8} className="p-16">
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
                              selectedOrder?.id === order.id
                                ? "bg-blue-50/60"
                                : ""
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

                            <td className="p-5 font-bold text-slate-700">
                              {Number(order.quantity || 0).toLocaleString()}
                            </td>

                            <td className="p-5 font-black text-blue-600">
                              ₱{Number(order.price || 0).toFixed(2)}
                            </td>

                            <td className="p-5">
                              <div className="w-32">
                                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                  <span>
                                    {Number(
                                      order.current_count || 0,
                                    ).toLocaleString()}
                                  </span>
                                  <span>{progress.toFixed(0)}%</span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    style={{ width: `${progress}%` }}
                                    className={`h-full rounded-full ${
                                      order.status === "completed"
                                        ? "bg-green-500"
                                        : "bg-blue-600"
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
                <h3 className="text-xl font-black text-slate-950">
                  Order Details
                </h3>

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
                        <p className="text-sm font-bold text-slate-500">
                          Order ID
                        </p>

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
                        label="Quantity"
                        value={Number(sideOrder.quantity || 0).toLocaleString()}
                      />

                      <SideDetail
                        label="Charge"
                        value={`₱${Number(sideOrder.price || 0).toFixed(2)}`}
                      />

                      <SideDetail
                        label="Start Count"
                        value={String(sideOrder.start_count || 0)}
                      />

                      <SideDetail
                        label="Current Count"
                        value={String(sideOrder.current_count || 0)}
                      />

                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-500">
                            Progress
                          </p>

                          <p className="text-sm font-black text-slate-700">
                            {Number(
                              sideOrder.current_count || 0,
                            ).toLocaleString()}{" "}
                            / {Number(sideOrder.quantity || 0).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              style={{ width: `${sideProgress}%` }}
                              className={`h-full rounded-full ${
                                sideOrder.status === "completed"
                                  ? "bg-green-500"
                                  : "bg-blue-600"
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
                    Keep this page open to receive live updates on your order
                    progress.
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
            <div className="flex max-h-[94vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
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

              <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[1fr_430px]">
                <div className="min-h-0 overflow-y-auto p-6 pb-10">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="1" title="Choose Platform" />

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
                      {networks
                        .filter((item) => item.name !== "Website" && item.name !== "Reviews")
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
                        onClick={() => setServiceFilter(serviceFilter === "favorites" ? "all" : "favorites")}
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
                        onClick={() => setServiceFilter(serviceFilter === "fast" ? "all" : "fast")}
                        icon={Zap}
                        label="Fast"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "refill"}
                        onClick={() => setServiceFilter(serviceFilter === "refill" ? "all" : "refill")}
                        icon={RotateCcw}
                        label="Refill"
                      />
                      <ServiceFilterChip
                        active={serviceFilter === "quality"}
                        onClick={() => setServiceFilter(serviceFilter === "quality" ? "all" : "quality")}
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
                            Search directly by service ID or service name. Category is optional.
                          </p>
                        </div>
                      ) : (
                        filteredServices.slice(0, 12).map((service) => {
                          const tags = getServiceTags(service);
                          const publicId = getPublicServiceId(service);
                          const isSelected = selectedServiceId === service.id;
                          const isFavorite = favoriteServiceIds.includes(service.id);

                          return (
                            <div
                              key={service.id}
                              className={`group flex items-center gap-4 rounded-2xl border p-4 transition ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50/70 shadow-sm"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedServiceId(service.id)}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-transparent hover:border-blue-400"
                                }`}
                              >
                                <Check size={14} strokeWidth={3} />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedServiceId(service.id)}
                                className="flex min-w-0 flex-1 items-center gap-4 text-left"
                              >
                                <span className="flex h-14 min-w-[82px] items-center justify-center rounded-2xl bg-blue-50 px-4 text-base font-black text-blue-600">
                                  #{publicId}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-base font-black text-slate-950">
                                    {service.name}
                                  </span>

                                  <span className="mt-2 flex flex-wrap items-center gap-2">
                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                                          tag === "CHEAP"
                                            ? "bg-green-100 text-green-700"
                                            : tag === "FAST"
                                              ? "bg-blue-100 text-blue-700"
                                              : tag === "REFILL"
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-purple-100 text-purple-700"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    ))}

                                    <span className="text-xs font-semibold text-slate-500">
                                      Min {service.min_quantity} • Max {service.max_quantity}
                                    </span>
                                  </span>
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleFavoriteService(service.id)}
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                  isFavorite
                                    ? "bg-yellow-50 text-yellow-500"
                                    : "bg-slate-50 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500"
                                }`}
                              >
                                <Star size={19} fill={isFavorite ? "currentColor" : "none"} />
                              </button>

                              <div className="hidden text-right sm:block">
                                <p className="text-lg font-black text-blue-600">
                                  ₱{Number(service.price_per_1000 || 0).toFixed(2)}
                                  <span className="text-xs font-bold text-slate-400"> / 1000</span>
                                </p>
                              </div>

                              <ChevronRight size={20} className="hidden text-slate-400 sm:block" />
                            </div>
                          );
                        })
                      )}
                    </div>

                    {filteredServices.length > 12 && (
                      <div className="mt-4 flex justify-center border-t border-slate-100 pt-4">
                        <p className="text-sm font-bold text-blue-600">
                          Showing first 12 results. Use search to narrow services.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <StepHeader step="3" title="Enter Link" />
                      <div className="relative mt-4">
                        <LinkIcon
                          size={19}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="url"
                          placeholder="https://www.tiktok.com/@username"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          className="h-14 w-full rounded-2xl border border-slate-200 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <StepHeader step="4" title="Quantity" />
                      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex h-14 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(String(Math.max(0, Number(quantity || 0) - 100)))
                            }
                            className="flex w-14 items-center justify-center text-slate-700 transition hover:bg-slate-50"
                          >
                            <Minus size={20} />
                          </button>

                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="1000"
                            className="w-28 border-x border-slate-200 text-center text-lg font-black text-slate-950 outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(String(Number(quantity || 0) + 100))
                            }
                            className="flex w-14 items-center justify-center text-slate-700 transition hover:bg-slate-50"
                          >
                            <Plus size={20} />
                          </button>
                        </div>

                        <div className="text-xs font-bold text-slate-500">
                          <p>Min: {selectedService?.min_quantity || 0}</p>
                          <p>Max: {selectedService?.max_quantity || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <StepHeader step="5" title="Notes" optional />
                    <div className="relative mt-4">
                      <MessageSquare
                        size={19}
                        className="absolute left-4 top-4 text-slate-400"
                      />
                      <textarea
                        placeholder="Add any notes or special instructions..."
                        rows={3}
                        value={notes}
                        maxLength={200}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full resize-none rounded-2xl border border-slate-200 py-4 pl-12 pr-16 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                      <span className="absolute bottom-4 right-4 text-xs font-bold text-slate-400">
                        {notes.length} / 200
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Info size={19} />
                      <span>
                        Make sure your link is correct. We are not responsible for wrong links.
                      </span>
                    </div>

                    <a
                      href="/dashboard/tickets"
                      className="font-black text-blue-700 hover:text-blue-800"
                    >
                      Need help? Contact Support
                    </a>
                  </div>
                </div>

                <aside className="flex min-h-0 flex-col border-t border-slate-100 bg-white p-6 xl:border-l xl:border-t-0">
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 pb-5">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black text-slate-950">
                          Order Summary
                        </h4>

                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                          <Wallet size={22} />
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <SummaryDetail
                          label="Service"
                          value={selectedService?.name || "Select a service"}
                        />
                        <SummaryDetail
                          label="Service ID"
                          value={selectedService ? `#${getPublicServiceId(selectedService)}` : "N/A"}
                        />
                        <SummaryDetail
                          label="Quantity"
                          value={Number(quantity || 0).toLocaleString()}
                        />
                        <SummaryDetail
                          label="Price per 1000"
                          value={
                            selectedService
                              ? `₱${Number(selectedService.price_per_1000 || 0).toFixed(2)}`
                              : "₱0.00"
                          }
                        />
                      </div>

                      <div className="my-5 border-t border-dashed border-slate-200" />

                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-950">
                          Total Charge
                        </p>
                        <p className="text-2xl font-black text-blue-600">
                          ₱{estimatedCharge.toFixed(2)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-500">
                          Your Balance
                        </p>
                        <p className="text-lg font-black text-green-600">
                          ₱{Number(profile?.balance || 0).toFixed(2)}
                        </p>
                      </div>

                      <div
                        className={`mt-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold ${
                          Number(profile?.balance || 0) >= estimatedCharge
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <CheckCircle2 size={18} />
                        {Number(profile?.balance || 0) >= estimatedCharge
                          ? "You have sufficient balance to place this order."
                          : "You may need to add funds before placing this order."}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xl font-black text-slate-950">
                          Service Details
                        </h4>
                        <Info size={19} className="text-blue-600" />
                      </div>

                      {selectedService ? (
                        <div className="mt-5 space-y-4">
                          <SummaryDetail
                            label="Start Time"
                            value={getDetail("Start Time")}
                          />
                          <SummaryDetail label="Speed" value={getDetail("Speed")} />
                          <SummaryDetail label="Refill" value={getDetail("Refill")} />
                          <SummaryDetail
                            label="Quality"
                            value={getServiceTags(selectedService).includes("HQ") ? "High Quality" : "N/A"}
                          />
                          <SummaryDetail
                            label="Type"
                            value={network === "Everything" ? "All Platforms" : network}
                          />
                          <SummaryDetail
                            label="Max Quantity"
                            value={Number(selectedService.max_quantity || 0).toLocaleString()}
                          />

                          </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
                          Select a service to preview details.
                        </div>
                      )}
                    </div>

                    </div>

                    <div className="shrink-0 border-t border-slate-100 bg-white pt-5">
                      <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                        <button
                          onClick={handleOrder}
                          disabled={placingOrder || !canPlaceOrder}
                          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-lg font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <ShoppingCart size={24} />
                          {placingOrder ? "Placing Order..." : "Place Order"}
                        </button>

                        <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-slate-400">
                          <ShieldCheck size={14} />
                          Your order will be processed securely.
                        </p>
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

function StepHeader({
  step,
  title,
  optional = false,
}: {
  step: string;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
        {step}
      </span>
      <h4 className="text-lg font-black text-slate-950">{title}</h4>
      {optional && (
        <span className="text-sm font-semibold text-slate-500">(Optional)</span>
      )}
    </div>
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
  icon: any;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-600"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function PlatformIcon({ name }: { name: string }) {
  const simpleIcons: Record<string, string> = {
    TikTok: "tiktok",
    Instagram: "instagram",
    YouTube: "youtube",
    Facebook: "facebook",
    Telegram: "telegram",
    Twitter: "x",
    Spotify: "spotify",
    Twitch: "twitch",
    Discord: "discord",
    Google: "google",
  };

  if (simpleIcons[name]) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${simpleIcons[name]}`}
        alt={`${name} icon`}
        className="h-8 w-8 object-contain"
      />
    );
  }

  if (name === "Website") return <Globe2 size={31} />;
  if (name === "Others") return <MoreIcon />;
  if (name === "Everything") return <Grid3X3 size={30} />;
  if (name === "Reviews") return <Star size={30} />;

  return <Globe2 size={30} />;
}

function MoreIcon() {
  return (
    <div className="flex items-center gap-1 text-slate-700">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </div>
  );
}


function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={26} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-medium text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SideDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function SummaryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-slate-900">
        {value || "N/A"}
      </p>
    </div>
  );
}

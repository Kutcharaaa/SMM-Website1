"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Heart,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Wallet,
  X,
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

    if (!selectedOrder && data && data.length > 0) {
      setSelectedOrder(data[0]);
    }

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
    loadOrders();
    loadOrderData();

    const savedFavorites = window.localStorage.getItem("favorite_services");
    if (savedFavorites) {
      try {
        setFavoriteServiceIds(JSON.parse(savedFavorites));
      } catch {
        setFavoriteServiceIds([]);
      }
    }

    const interval = setInterval(() => {
      loadOrders();
      loadOrderData();
    }, 10000);

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

    return networkServices
      .filter((service) => {
        if (category) return service.category === category;
        if (keyword) return true;
        return favoriteServiceIds.includes(service.id);
      })
      .filter((service) => {
        if (!keyword) return true;

        return (
          service.name.toLowerCase().includes(keyword) ||
          service.category.toLowerCase().includes(keyword) ||
          service.provider_service_id?.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const aFavorite = favoriteServiceIds.includes(a.id) ? 0 : 1;
        const bFavorite = favoriteServiceIds.includes(b.id) ? 0 : 1;

        if (aFavorite !== bFavorite) return aFavorite - bFavorite;

        return Number(a.price_per_1000 || 0) - Number(b.price_per_1000 || 0);
      });
  }, [networkServices, category, serviceSearch, favoriteServiceIds]);

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

  const sideOrder = selectedOrder || filteredOrders[0] || orders[0] || null;

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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-[28px] bg-[#f8fbff] shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <ShoppingBag size={22} />
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-slate-950">
                        Create New Order
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Search by Service ID or name, favorite services, and
                        place orders faster.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[84vh] overflow-hidden xl:grid-cols-[1fr_380px]">
                <div className="overflow-y-auto p-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                          Step 1
                        </p>
                        <h4 className="mt-1 text-lg font-black text-slate-950">
                          Choose Platform
                        </h4>
                      </div>

                      <button
                        onClick={resetOrderForm}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                      {networks.map((item) => (
                        <button
                          key={item.name}
                          onClick={() => {
                            setNetwork(
                              network === item.name ? "Everything" : item.name,
                            );
                            setCategory("");
                            setSelectedServiceId("");
                          }}
                          className={`group rounded-2xl border px-3 py-4 text-center transition ${
                            network === item.name
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className="text-2xl">{item.icon}</div>
                          <p
                            className={`mt-2 text-xs font-black ${
                              network === item.name
                                ? "text-blue-600"
                                : "text-slate-600 group-hover:text-blue-600"
                            }`}
                          >
                            {item.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-5 xl:grid-cols-[320px_1fr]">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                        Step 2
                      </p>
                      <h4 className="mt-1 text-lg font-black text-slate-950">
                        Filters
                      </h4>

                      <div className="mt-5 space-y-4">
                        <div>
                          <label className="text-sm font-black text-slate-700">
                            Category
                          </label>
                          <select
                            value={category}
                            onChange={(e) => {
                              setCategory(e.target.value);
                              setSelectedServiceId("");
                            }}
                            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
                          >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="rounded-2xl bg-blue-50 p-4">
                          <div className="flex items-center gap-3">
                            <Star size={19} className="text-blue-600" />
                            <div>
                              <p className="text-sm font-black text-slate-950">
                                Favorites First
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Star services to show them quickly next time.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-100 p-4">
                          <p className="text-sm font-black text-slate-950">
                            Selected Network
                          </p>
                          <p className="mt-1 text-sm font-semibold text-blue-600">
                            {network}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                            Step 3
                          </p>
                          <h4 className="mt-1 text-lg font-black text-slate-950">
                            Search & Select Service
                          </h4>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Search directly by service ID or name. Category is
                            optional.
                          </p>
                        </div>

                        <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
                          {filteredServices.length} services
                        </div>
                      </div>

                      <div className="relative mt-5">
                        <Search
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={serviceSearch}
                          onChange={(e) => {
                            setServiceSearch(e.target.value);
                            setSelectedServiceId("");
                          }}
                          placeholder="Search Service ID, name, category, or provider service ID..."
                          className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
                        />
                      </div>

                      <div className="mt-5 max-h-[410px] space-y-3 overflow-y-auto pr-1">
                        {filteredServices.length <= 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                              <Search size={28} />
                            </div>
                            <h5 className="mt-4 text-lg font-black text-slate-950">
                              Search services directly
                            </h5>
                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              Type a service ID or service name above. You can
                              also select a category or use favorites.
                            </p>
                          </div>
                        ) : (
                          filteredServices.map((service) => {
                            const tags = getServiceTags(service);
                            const publicId = getPublicServiceId(service);
                            const isSelected = selectedServiceId === service.id;
                            const isFavorite = favoriteServiceIds.includes(
                              service.id,
                            );

                            return (
                              <div
                                key={service.id}
                                className={`rounded-3xl border p-4 transition ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                                }`}
                              >
                                <div className="flex gap-4">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleFavoriteService(service.id)
                                    }
                                    className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                                      isFavorite
                                        ? "bg-yellow-50 text-yellow-500"
                                        : "bg-slate-100 text-slate-400 hover:bg-yellow-50 hover:text-yellow-500"
                                    }`}
                                  >
                                    <Star
                                      size={18}
                                      fill={
                                        isFavorite ? "currentColor" : "none"
                                      }
                                    />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedServiceId(service.id)
                                    }
                                    className="flex-1 text-left"
                                  >
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                        {publicId}
                                      </span>

                                      {tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>

                                    <h5 className="mt-3 text-sm font-black leading-relaxed text-slate-950">
                                      {service.name}
                                    </h5>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                      <p className="text-sm font-black text-blue-600">
                                        ₱
                                        {Number(
                                          service.price_per_1000 || 0,
                                        ).toFixed(2)}{" "}
                                        / 1000
                                      </p>

                                      <p className="text-xs font-bold text-slate-400">
                                        Min {service.min_quantity} • Max{" "}
                                        {service.max_quantity}
                                      </p>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                      Step 4
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      Order Information
                    </h4>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="text-sm font-black text-slate-700">
                          Link
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-black text-slate-700">
                          Quantity
                        </label>
                        <input
                          type="number"
                          placeholder="Example: 1000"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />

                        {selectedService && (
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Min: {selectedService.min_quantity} • Max:{" "}
                            {selectedService.max_quantity}
                          </p>
                        )}
                      </div>

                      <div className="lg:col-span-2">
                        <label className="text-sm font-black text-slate-700">
                          Notes
                        </label>
                        <textarea
                          placeholder="Optional notes, comments, or usernames if needed"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="border-l border-slate-200 bg-white p-6">
                  <div className="sticky top-0 space-y-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                        Checkout
                      </p>
                      <h4 className="mt-1 text-2xl font-black text-slate-950">
                        Order Summary
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        Review your order before placing it.
                      </p>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-sky-400 p-5 text-white shadow-lg shadow-blue-600/20">
                      <p className="text-sm font-semibold text-blue-100">
                        Estimated Charge
                      </p>
                      <h3 className="mt-2 text-4xl font-black">
                        ₱{estimatedCharge.toFixed(2)}
                      </h3>
                      <p className="mt-2 text-xs font-bold text-blue-100">
                        Wallet: ₱{Number(profile?.balance || 0).toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <h5 className="font-black text-slate-950">
                        Selected Service
                      </h5>

                      {selectedService ? (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <span className="rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                {getPublicServiceId(selectedService)}
                              </span>

                              <button
                                onClick={() =>
                                  toggleFavoriteService(selectedService.id)
                                }
                                className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                  favoriteServiceIds.includes(
                                    selectedService.id,
                                  )
                                    ? "bg-yellow-50 text-yellow-500"
                                    : "bg-white text-slate-400"
                                }`}
                              >
                                <Star
                                  size={17}
                                  fill={
                                    favoriteServiceIds.includes(
                                      selectedService.id,
                                    )
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>
                            </div>

                            <p className="mt-3 text-sm font-black leading-relaxed text-slate-950">
                              {selectedService.name}
                            </p>
                          </div>

                          <SummaryDetail
                            label="Price / 1,000"
                            value={`₱${Number(selectedService.price_per_1000 || 0).toFixed(2)}`}
                          />
                          <SummaryDetail
                            label="Minimum"
                            value={String(selectedService.min_quantity)}
                          />
                          <SummaryDetail
                            label="Maximum"
                            value={String(selectedService.max_quantity)}
                          />
                          <SummaryDetail
                            label="Start Time"
                            value={getDetail("Start Time")}
                          />
                          <SummaryDetail
                            label="Speed"
                            value={getDetail("Speed")}
                          />
                          <SummaryDetail
                            label="Refill"
                            value={getDetail("Refill")}
                          />
                        </div>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-500">
                          Select a service to preview details.
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleOrder}
                      disabled={placingOrder || !canPlaceOrder}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {placingOrder ? "Placing Order..." : "Place Order"}
                      <Sparkles size={17} />
                    </button>

                    <p className="text-center text-xs font-semibold text-slate-400">
                      Your balance will be deducted after successful order
                      creation.
                    </p>
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

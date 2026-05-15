"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  Eye,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
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
    loadOrders();
    loadOrderData();

    const interval = setInterval(() => {
      loadOrders();
      loadOrderData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;
  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  ).length;
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.price || 0),
    0
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
          .filter((item) => item.name !== "Others" && item.name !== "Everything")
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
    return networkServices
      .filter((service) => service.category === category)
      .filter((service) => {
        const keyword = serviceSearch.toLowerCase();

        return (
          service.name.toLowerCase().includes(keyword) ||
          service.category.toLowerCase().includes(keyword) ||
          service.provider_service_id?.toLowerCase().includes(keyword)
        );
      })
      .sort(
        (a, b) =>
          Number(a.price_per_1000 || 0) - Number(b.price_per_1000 || 0)
      );
  }, [networkServices, category, serviceSearch]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || null;

  const cheapestPrice =
    filteredServices.length > 0
      ? Math.min(...filteredServices.map((s) => Number(s.price_per_1000 || 0)))
      : 0;

  const estimatedCharge = selectedService
    ? (Number(quantity || 0) / 1000) * Number(selectedService.price_per_1000)
    : 0;

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

    if (qty < selectedService.min_quantity || qty > selectedService.max_quantity) {
      showToast(
        `Quantity must be between ${selectedService.min_quantity} and ${selectedService.max_quantity}.`,
        "warning"
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

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-950">Orders</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Track your orders, progress, and create new orders.
              </p>
            </div>

            <button
              onClick={() => setOrderModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              <Plus size={18} />
              New Order
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Package}
              title="Total Orders"
              value={String(totalOrders)}
              subtitle="All time"
            />

            <StatCard
              icon={ShoppingCart}
              title="Completed"
              value={String(completedOrders)}
              subtitle="Successful orders"
            />

            <StatCard
              icon={RefreshCw}
              title="Processing"
              value={String(processingOrders)}
              subtitle="Currently active"
            />

            <StatCard
              icon={Wallet}
              title="Total Spent"
              value={`₱${totalSpent.toFixed(2)}`}
              subtitle="Lifetime"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Order History
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage your latest order activity.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm outline-none focus:border-blue-500 md:w-80"
                  />
                </div>

                <button
                  onClick={loadOrders}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                >
                  <Filter size={18} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Loading orders...
              </div>
            ) : filteredOrders.length <= 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Package size={30} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  No orders found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Your orders will appear here once you place your first order.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-5 text-left font-black">ORDER</th>
                      <th className="p-5 text-left font-black">SERVICE</th>
                      <th className="p-5 text-left font-black">QUANTITY</th>
                      <th className="p-5 text-left font-black">CHARGE</th>
                      <th className="p-5 text-left font-black">PROGRESS</th>
                      <th className="p-5 text-left font-black">STATUS</th>
                      <th className="p-5 text-left font-black">DATE</th>
                      <th className="p-5 text-left font-black">ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((order) => {
                      const progress =
                        Number(order.quantity || 0) > 0
                          ? Math.min(
                              100,
                              (Number(order.current_count || 0) /
                                Number(order.quantity || 1)) *
                                100
                            )
                          : 0;

                      return (
                        <tr
                          key={order.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50"
                        >
                          <td className="p-5 font-black text-slate-500">
                            #{order.id.slice(0, 8)}
                          </td>

                          <td className="p-5">
                            <p className="max-w-xs truncate font-black text-slate-950">
                              {order.service_name}
                            </p>
                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                              {order.link}
                            </p>
                          </td>

                          <td className="p-5 font-semibold text-slate-600">
                            {Number(order.quantity || 0).toLocaleString()}
                          </td>

                          <td className="p-5 font-black text-blue-600">
                            ₱{Number(order.price || 0).toFixed(2)}
                          </td>

                          <td className="p-5">
                            <div className="w-32">
                              <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>
                                  {Number(order.current_count || 0).toLocaleString()}
                                </span>
                                <span>{progress.toFixed(0)}%</span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  style={{ width: `${progress}%` }}
                                  className="h-full rounded-full bg-blue-600"
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-5">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black capitalize ${getStatusStyle(
                                order.status
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
                              onClick={() => setSelectedOrder(order)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Order Details
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    #{selectedOrder.id.slice(0, 8)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid gap-5 p-6 md:grid-cols-2">
                <Detail label="Service" value={selectedOrder.service_name} />
                <Detail
                  label="Quantity"
                  value={Number(selectedOrder.quantity || 0).toLocaleString()}
                />
                <Detail
                  label="Charge"
                  value={`₱${Number(selectedOrder.price || 0).toFixed(2)}`}
                />
                <Detail label="Status" value={selectedOrder.status} />
                <Detail
                  label="Progress"
                  value={`${selectedOrder.current_count || 0} / ${
                    selectedOrder.quantity
                  }`}
                />
                <Detail
                  label="Date"
                  value={new Date(selectedOrder.created_at).toLocaleString()}
                />

                <div className="md:col-span-2">
                  <Detail label="Link" value={selectedOrder.link} />
                </div>
              </div>
            </div>
          </div>
        )}

        {orderModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Create New Order
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a social network, select a service, and place your
                    order.
                  </p>
                </div>

                <button
                  onClick={() => setOrderModalOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[80vh] overflow-y-auto p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-950">
                    Choose a Social Network
                  </h4>

                  <button
                    onClick={resetOrderForm}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                  {networks.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => {
                        setNetwork(network === item.name ? "Everything" : item.name);
                        setCategory("");
                        setSelectedServiceId("");
                        setServiceSearch("");
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        network === item.name
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.name}
                    </button>
                  ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <h4 className="text-lg font-black text-slate-950">
                        Order Details
                      </h4>

                      <div className="mt-5 space-y-4">
                        <input
                          value={serviceSearch}
                          onChange={(e) => {
                            setServiceSearch(e.target.value);
                            setSelectedServiceId("");
                          }}
                          placeholder="Search service name, category, or service ID..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setSelectedServiceId("");
                          }}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        >
                          <option value="">Select Category</option>

                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        <div className="overflow-hidden rounded-xl border border-slate-200">
                          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500">
                            Select Service / Server
                          </div>

                          {!category ? (
                            <div className="px-4 py-4 text-sm text-slate-500">
                              Please select a category first.
                            </div>
                          ) : filteredServices.length <= 0 ? (
                            <div className="px-4 py-4 text-sm text-slate-500">
                              No matching services found for this category.
                            </div>
                          ) : (
                            <div className="max-h-80 overflow-y-auto">
                              {filteredServices.map((service) => {
                                const tags = getServiceTags(service);
                                const publicId = getPublicServiceId(service);
                                const isSelected =
                                  selectedServiceId === service.id;

                                return (
                                  <button
                                    key={service.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedServiceId(service.id)
                                    }
                                    className={`w-full border-b border-slate-100 px-4 py-3 text-left transition ${
                                      isSelected
                                        ? "bg-blue-50"
                                        : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="mt-0.5 inline-flex min-w-[64px] justify-center rounded-lg bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                        {publicId}
                                      </span>

                                      <div className="flex-1">
                                        <p className="text-sm font-bold leading-relaxed text-slate-950">
                                          {service.name}
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                          <span className="font-black text-blue-600">
                                            ₱
                                            {Number(
                                              service.price_per_1000 || 0
                                            ).toFixed(2)}{" "}
                                            / 1000
                                          </span>

                                          {tags.map((tag) => (
                                            <span
                                              key={tag}
                                              className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <input
                          type="url"
                          placeholder="Enter link"
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <input
                          type="number"
                          placeholder="Quantity"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        {selectedService && (
                          <p className="text-xs font-semibold text-slate-500">
                            Min: {selectedService.min_quantity} • Max:{" "}
                            {selectedService.max_quantity}
                          </p>
                        )}

                        <textarea
                          placeholder="Notes / comments / usernames if needed"
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <button
                          onClick={handleOrder}
                          disabled={placingOrder}
                          className="w-full rounded-xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {placingOrder ? "Placing Order..." : "Place Order"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h4 className="text-lg font-black text-slate-950">
                      Service Info
                    </h4>

                    {selectedService ? (
                      <div className="mt-5 space-y-4 text-sm">
                        <Detail
                          label="Service ID"
                          value={getPublicServiceId(selectedService)}
                        />
                        <Detail
                          label="Selected Service"
                          value={selectedService.name}
                        />
                        <Detail
                          label="Start Time"
                          value={getDetail("Start Time")}
                        />
                        <Detail label="Speed" value={getDetail("Speed")} />
                        <Detail label="Refill" value={getDetail("Refill")} />
                        <Detail
                          label="Minimum"
                          value={String(selectedService.min_quantity)}
                        />
                        <Detail
                          label="Maximum"
                          value={String(selectedService.max_quantity)}
                        />
                        <Detail
                          label="Price per 1,000"
                          value={`₱${Number(
                            selectedService.price_per_1000
                          ).toFixed(2)}`}
                        />

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Estimated Charge
                          </p>
                          <p className="mt-2 text-3xl font-black text-blue-600">
                            ₱{estimatedCharge.toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Wallet Balance
                          </p>
                          <p className="mt-2 text-xl font-black text-green-600">
                            ₱{Number(profile?.balance || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-5 text-sm text-slate-500">
                        Select a category and service to view details.
                      </p>
                    )}
                  </div>
                </div>
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
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value || "N/A"}
      </p>
    </div>
  );
}
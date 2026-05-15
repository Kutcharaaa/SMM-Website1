"use client";

import DashboardLayout from "@/components/DashboardLayout";
import DashboardGuard from "@/components/DashboardGuard";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Filter,
  Info,
  Link as LinkIcon,
  Minus,
  Plus,
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
import { useEffect, useMemo, useState } from "react";

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
  { name: "TikTok", icon: "🎵" },
  { name: "Instagram", icon: "📸" },
  { name: "YouTube", icon: "▶️" },
  { name: "Facebook", icon: "📘" },
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

export default function NewOrderPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [network, setNetwork] = useState("Everything");
  const [category, setCategory] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [search, setSearch] = useState("");
  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<"all" | "cheap" | "fast" | "refill" | "hq">("all");

  const { showToast } = useToast();

  async function loadData() {
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
    loadData();

    const storedFavorites = localStorage.getItem("favorite_services");
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  function toggleFavorite(serviceId: string) {
    setFavorites((current) => {
      const next = current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];

      localStorage.setItem("favorite_services", JSON.stringify(next));
      return next;
    });
  }

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

  const cheapestPrice =
    networkServices.length > 0
      ? Math.min(...networkServices.map((s) => Number(s.price_per_1000 || 0)))
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

    return tags.slice(0, 4);
  }

  const filteredServices = useMemo(() => {
    const keyword = search.toLowerCase();

    return networkServices
      .filter((service) => {
        if (category && service.category !== category) return false;

        const tags = getServiceTags(service).join(" ").toLowerCase();
        const text = `${service.provider_service_id || ""} ${service.name} ${service.category} ${service.description || ""} ${tags}`.toLowerCase();

        if (keyword && !text.includes(keyword)) return false;

        if (showOnlyFavorites && !favorites.includes(service.id)) return false;

        if (quickFilter === "cheap" && !getServiceTags(service).includes("CHEAP")) return false;
        if (quickFilter === "fast" && !getServiceTags(service).includes("FAST")) return false;
        if (quickFilter === "refill" && !getServiceTags(service).includes("REFILL")) return false;
        if (quickFilter === "hq" && !getServiceTags(service).includes("HQ")) return false;

        return true;
      })
      .sort((a, b) => Number(a.price_per_1000 || 0) - Number(b.price_per_1000 || 0));
  }, [networkServices, category, search, showOnlyFavorites, favorites, quickFilter]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || null;

  const estimatedCharge = selectedService
    ? (Number(quantity || 0) / 1000) * Number(selectedService.price_per_1000)
    : 0;

  const hasEnoughBalance = Number(profile?.balance || 0) >= estimatedCharge;

  function getDetail(label: string) {
    if (!selectedService) return "N/A";

    const regex = new RegExp(`\\[${label}:?\\s*([^\\]]+)\\]`, "i");
    const match = selectedService.name.match(regex);

    return match?.[1] || "N/A";
  }

  function adjustQuantity(amount: number) {
    const current = Number(quantity || 0);
    const next = Math.max(0, current + amount);
    setQuantity(String(next));
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

      setNetwork("Everything");
      setCategory("");
      setSelectedServiceId("");
      setSearch("");
      setLink("");
      setQuantity("");
      setNotes("");

      setPlacingOrder(false);

      loadData();
    } catch {
      showToast("Failed to create order.", "error");
      setPlacingOrder(false);
    }
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="-m-8 min-h-screen bg-[#f6f9fc] p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
            <div className="flex items-start justify-between border-b border-slate-100 p-6 lg:p-8">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ShoppingCart size={32} />
                </div>

                <div>
                  <h1 className="text-3xl font-black text-slate-950">
                    Create New Order
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Search by Service ID or Service Name, choose your service, then place your order.
                  </p>
                </div>
              </div>

              <a
                href="/dashboard/orders"
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={21} />
              </a>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_430px] lg:p-8">
              <section className="space-y-6">
                <Card>
                  <StepHeader number="1" title="Choose Platform" />

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
                    {networks.slice(0, 14).map((item) => {
                      const isSelected = network === item.name;

                      return (
                        <button
                          key={item.name}
                          onClick={() => {
                            setNetwork(network === item.name ? "Everything" : item.name);
                            setCategory("");
                            setSelectedServiceId("");
                            setSearch("");
                          }}
                          className={`relative rounded-2xl border p-4 text-center transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 text-blue-600 shadow-lg shadow-blue-100"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                              <CheckCircle2 size={15} />
                            </div>
                          )}

                          <div className="text-3xl">{item.icon}</div>
                          <p className="mt-2 text-sm font-black">{item.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <StepHeader number="2" title="Find Your Service" />

                  <div className="mt-5 flex flex-col gap-3 xl:flex-row">
                    <div className="relative flex-1">
                      <Search
                        size={19}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setSelectedServiceId("");
                        }}
                        placeholder="Search by Service ID or Service Name..."
                        className="h-13 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-11 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />

                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setSelectedServiceId("");
                      }}
                      className="h-13 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500 xl:w-72"
                    >
                      <option value="">All Categories</option>

                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <button className="flex h-13 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600">
                      <Filter size={18} />
                      Filter
                    </button>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Chip
                      active={showOnlyFavorites}
                      onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                      icon={Star}
                      label="Favorites"
                    />
                    <Chip
                      active={quickFilter === "all"}
                      onClick={() => setQuickFilter("all")}
                      icon={ClipboardList}
                      label="All Services"
                    />
                    <Chip
                      active={quickFilter === "cheap"}
                      onClick={() => setQuickFilter("cheap")}
                      icon={Tag}
                      label="Cheapest"
                    />
                    <Chip
                      active={quickFilter === "fast"}
                      onClick={() => setQuickFilter("fast")}
                      icon={Zap}
                      label="Fast"
                    />
                    <Chip
                      active={quickFilter === "refill"}
                      onClick={() => setQuickFilter("refill")}
                      icon={RefreshIcon}
                      label="Refill"
                    />
                    <Chip
                      active={quickFilter === "hq"}
                      onClick={() => setQuickFilter("hq")}
                      icon={ShieldCheck}
                      label="High Quality"
                    />
                  </div>

                  <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                    {filteredServices.length <= 0 ? (
                      <div className="p-8 text-center text-sm font-semibold text-slate-500">
                        No services found. Try another keyword or platform.
                      </div>
                    ) : (
                      <div className="max-h-[410px] overflow-y-auto">
                        {filteredServices.slice(0, 30).map((service) => {
                          const tags = getServiceTags(service);
                          const publicId = getPublicServiceId(service);
                          const isSelected = selectedServiceId === service.id;
                          const isFavorite = favorites.includes(service.id);

                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => setSelectedServiceId(service.id)}
                              className={`group w-full border-b border-slate-100 px-4 py-4 text-left transition last:border-b-0 ${
                                isSelected ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : "border-slate-200 text-transparent"
                                  }`}
                                >
                                  <CheckCircle2 size={15} />
                                </div>

                                <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                                  #{publicId}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-black text-slate-950">
                                      {service.name}
                                    </h3>

                                    {tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                                          tag === "CHEAP"
                                            ? "bg-green-50 text-green-600"
                                            : tag === "FAST"
                                            ? "bg-blue-50 text-blue-600"
                                            : tag === "REFILL"
                                            ? "bg-orange-50 text-orange-500"
                                            : tag === "REAL"
                                            ? "bg-purple-50 text-purple-600"
                                            : "bg-cyan-50 text-cyan-600"
                                        }`}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>

                                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                                    {service.category}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(service.id);
                                  }}
                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                                    isFavorite
                                      ? "bg-yellow-50 text-yellow-500"
                                      : "text-slate-300 hover:bg-yellow-50 hover:text-yellow-500"
                                  }`}
                                >
                                  <Star size={20} fill={isFavorite ? "currentColor" : "none"} />
                                </button>

                                <div className="w-32 shrink-0 text-right">
                                  <p className="text-lg font-black text-blue-600">
                                    ₱{Number(service.price_per_1000 || 0).toFixed(2)}
                                  </p>
                                  <p className="text-xs font-bold text-slate-400">/ 1000</p>
                                </div>

                                <ChevronRight
                                  size={20}
                                  className="shrink-0 text-slate-300 transition group-hover:text-blue-500"
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {filteredServices.length > 30 && (
                    <p className="mt-3 text-center text-xs font-bold text-slate-400">
                      Showing first 30 results. Use search to narrow down services.
                    </p>
                  )}
                </Card>

                <div className="grid gap-6 xl:grid-cols-2">
                  <Card>
                    <StepHeader number="3" title="Enter Link" />

                    <div className="relative mt-5">
                      <LinkIcon
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="url"
                        placeholder="https://www.platform.com/@username"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="h-13 w-full rounded-2xl border border-slate-200 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                  </Card>

                  <Card>
                    <StepHeader number="4" title="Quantity" />

                    <div className="mt-5 flex items-center gap-4">
                      <div className="flex overflow-hidden rounded-2xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(-100)}
                          className="flex h-13 w-16 items-center justify-center bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                        >
                          <Minus size={20} />
                        </button>

                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="1000"
                          className="h-13 w-32 border-x border-slate-200 text-center text-xl font-black outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => adjustQuantity(100)}
                          className="flex h-13 w-16 items-center justify-center bg-slate-50 text-slate-700 transition hover:bg-slate-100"
                        >
                          <Plus size={20} />
                        </button>
                      </div>

                      <div className="text-xs font-bold text-slate-500">
                        <p>Min: {selectedService?.min_quantity || 0}</p>
                        <p>Max: {selectedService?.max_quantity || 0}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card>
                  <StepHeader number="5" title="Notes" optional />

                  <textarea
                    placeholder="Add any notes or special instructions..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={200}
                    className="mt-5 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />

                  <p className="mt-2 text-right text-xs font-bold text-slate-400">
                    {notes.length} / 200
                  </p>
                </Card>

                <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-semibold text-blue-700">
                  <div className="flex items-center gap-3">
                    <Info size={18} />
                    <span>Make sure your link is correct. We are not responsible for wrong links.</span>
                  </div>

                  <a href="/dashboard/tickets" className="font-black hover:underline">
                    Need help?
                  </a>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-950">
                      Order Summary
                    </h3>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Wallet size={24} />
                    </div>
                  </div>

                  <SummaryRow label="Service" value={selectedService?.name || "Not selected"} />
                  <SummaryRow label="Service ID" value={selectedService ? `#${getPublicServiceId(selectedService)}` : "N/A"} />
                  <SummaryRow label="Quantity" value={Number(quantity || 0).toLocaleString()} />
                  <SummaryRow
                    label="Price per 1000"
                    value={selectedService ? `₱${Number(selectedService.price_per_1000 || 0).toFixed(2)}` : "₱0.00"}
                  />

                  <div className="my-5 border-t border-dashed border-slate-200" />

                  <SummaryRow
                    label="Total Charge"
                    value={`₱${estimatedCharge.toFixed(2)}`}
                    strong
                  />

                  <SummaryRow
                    label="Your Balance"
                    value={`₱${Number(profile?.balance || 0).toFixed(2)}`}
                    green
                  />

                  <div
                    className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
                      hasEnoughBalance
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {hasEnoughBalance
                      ? "You have sufficient balance to place this order."
                      : "Your wallet balance may be insufficient."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-950">
                      Service Details
                    </h3>

                    <Info size={20} className="text-blue-600" />
                  </div>

                  <div className="space-y-4">
                    <ServiceDetail label="Start Time" value={getDetail("Start Time")} />
                    <ServiceDetail label="Speed" value={getDetail("Speed")} />
                    <ServiceDetail label="Refill" value={getDetail("Refill")} />
                    <ServiceDetail label="Quality" value={getDetail("Quality")} />
                    <ServiceDetail label="Type" value={getDetail("Type")} />
                    <ServiceDetail
                      label="Max Quantity"
                      value={selectedService ? String(selectedService.max_quantity) : "N/A"}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-black text-blue-600">Progress Preview</p>
                      <Info size={16} className="text-blue-600" />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[38%] rounded-full bg-blue-600" />
                      </div>

                      <span className="text-xs font-black text-slate-400">0%</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <button
                    onClick={handleOrder}
                    disabled={placingOrder}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 text-lg font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShoppingCart size={24} />
                    {placingOrder ? "Placing Order..." : "Place Order"}
                  </button>

                  <p className="mt-4 text-center text-xs font-bold text-slate-400">
                    Your order will be processed securely.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function StepHeader({
  number,
  title,
  optional,
}: {
  number: string;
  title: string;
  optional?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
        {number}
      </div>

      <h2 className="text-lg font-black text-slate-950">{title}</h2>

      {optional && (
        <span className="text-sm font-bold text-slate-400">(Optional)</span>
      )}
    </div>
  );
}

function Chip({
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
      <Icon size={16} fill={label === "Favorites" && active ? "currentColor" : "none"} />
      {label}
    </button>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  green,
}: {
  label: string;
  value: string;
  strong?: boolean;
  green?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p
        className={`text-right font-black ${
          strong
            ? "text-2xl text-blue-600"
            : green
            ? "text-green-600"
            : "text-slate-950"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ServiceDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="text-right text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return <Sparkles size={size} />;
}

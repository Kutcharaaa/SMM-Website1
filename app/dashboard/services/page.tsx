"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import {
  Box,
  Eye,
  Filter,
  Heart,
  Layers,
  Search,
  ShoppingCart,
  Star,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type DbService = {
  id: string;
  provider_service_id: string | null;
  name: string | null;
  category: string | null;
  description: string | null;
  price_per_1000: number | string | null;
  min_quantity: number | null;
  max_quantity: number | null;
  status: string | null;
  fastest_delivery: string | null;
  average_delivery: string | null;
  service_tags: string[] | string | null;
};

type Service = {
  id: string;
  publicId: string;
  name: string;
  platform: string;
  category: string;
  price: number;
  min: number;
  max: number;
  fastest: string;
  average: string;
  tags: string[];
  refill: string;
  drop: string;
  cancel: string;
  speed: string;
  description: string;
};

const SERVICES_PER_PAGE = 15;

const platforms = [
  "All Platforms",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Telegram",
  "Spotify",
  "Discord",
  "Twitter",
  "Website",
  "Others",
];

function detectPlatform(text: string) {
  const value = text.toLowerCase();

  if (value.includes("instagram") || value.includes("ig")) return "Instagram";
  if (value.includes("tiktok") || value.includes("tik tok")) return "TikTok";
  if (value.includes("youtube") || value.includes("yt")) return "YouTube";
  if (value.includes("facebook") || value.includes("fb")) return "Facebook";
  if (value.includes("telegram")) return "Telegram";
  if (value.includes("spotify")) return "Spotify";
  if (value.includes("discord")) return "Discord";
  if (value.includes("twitter") || value.includes("x ") || value.includes("x.com")) return "Twitter";
  if (value.includes("website") || value.includes("review") || value.includes("google")) return "Website";

  return "Others";
}

function parseTags(tags: string[] | string | null | undefined, service: DbService) {
  let parsed: string[] = [];

  if (Array.isArray(tags)) {
    parsed = tags;
  } else if (typeof tags === "string" && tags.trim()) {
    try {
      const json = JSON.parse(tags);
      if (Array.isArray(json)) parsed = json;
    } catch {
      parsed = tags
        .replace(/[{}\[\]"]/g, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  const text = `${service.name || ""} ${service.description || ""}`.toLowerCase();

  if (parsed.length <= 0) {
    if (text.includes("fast") || text.includes("instant")) parsed.push("Fast");
    if (text.includes("refill")) parsed.push("Refill");
    if (text.includes("hq") || text.includes("high quality")) parsed.push("HQ");
    if (text.includes("real")) parsed.push("Real");
    if (text.includes("cheap") || Number(service.price_per_1000 || 0) <= 1) parsed.push("Cheap");
  }

  return [...new Set(parsed.map((tag) => formatTag(tag)))].slice(0, 3);
}

function formatTag(tag: string) {
  const value = tag.trim();
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getPublicId(id: string) {
  return id.length > 8 ? id.slice(0, 8) : id;
}

function getRefill(tags: string[], description: string) {
  const text = `${tags.join(" ")} ${description}`.toLowerCase();
  if (text.includes("lifetime")) return "Lifetime";
  if (text.includes("30")) return "30 Days";
  if (text.includes("7")) return "7 Days";
  if (text.includes("refill")) return "30 Days";
  return "Not specified";
}

function getSpeed(tags: string[], fastest: string, average: string) {
  const text = `${tags.join(" ")} ${fastest} ${average}`.toLowerCase();
  if (text.includes("instant") || text.includes("fast") || text.includes("m")) return "Fast";
  return "Standard";
}

function getFastestMinutes(value: string) {
  const text = value.toLowerCase().trim();
  const number = Number(text.match(/\d+(\.\d+)?/)?.[0] || 999999);

  if (text.includes("hour") || text.includes("hr") || text.includes("h")) return number * 60;
  if (text.includes("day") || text.includes("d")) return number * 1440;
  if (text.includes("not")) return 999999;
  return number;
}

function getPlatformCount(services: Service[], platform: string) {
  if (platform === "All Platforms") return services.length;
  return services.filter((service) => service.platform === platform).length;
}

export default function DashboardServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All Platforms");
  const [sortBy, setSortBy] = useState("service_id");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState("1000");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadServices() {
    setLoading(true);

    const { data, error } = await supabase
      .from("services")
      .select(
        "id, provider_service_id, name, category, description, price_per_1000, min_quantity, max_quantity, status, fastest_delivery, average_delivery, service_tags",
      )
      .in("status", ["active", "Active"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("SERVICES_LOAD_ERROR:", error.message);
      setServices([]);
      setSelectedService(null);
      setLoading(false);
      return;
    }

    const formatted = ((data || []) as DbService[]).map((service) => {
      const name = service.name || "Unnamed Service";
      const category = service.category || "General";
      const description = service.description || "No description available.";
      const combinedText = `${name} ${category} ${description}`;
      const platformName = detectPlatform(combinedText);
      const tags = parseTags(service.service_tags, service);
      const fastest = service.fastest_delivery || "Not specified";
      const average = service.average_delivery || "Not specified";

      return {
        id: service.id,
        publicId: service.provider_service_id || getPublicId(service.id),
        name,
        platform: platformName,
        category,
        price: Number(service.price_per_1000 || 0),
        min: Number(service.min_quantity || 0),
        max: Number(service.max_quantity || 0),
        fastest,
        average,
        tags,
        refill: getRefill(tags, description),
        drop: "Not specified",
        cancel: "Available",
        speed: getSpeed(tags, fastest, average),
        description,
      };
    });

    setServices(formatted);
    setSelectedService((current) => current || formatted[0] || null);
    setLoading(false);
  }

  useEffect(() => {
    loadServices();

    const savedFavorites = window.localStorage.getItem("favorite_services");

    if (savedFavorites) {
      try {
        setFavoriteIds(JSON.parse(savedFavorites));
      } catch {
        setFavoriteIds([]);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("favorite_services", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const filteredServices = useMemo(() => {
    let rows = services.filter((service) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        service.publicId.toLowerCase().includes(keyword) ||
        service.id.toLowerCase().includes(keyword) ||
        service.name.toLowerCase().includes(keyword) ||
        service.category.toLowerCase().includes(keyword) ||
        service.platform.toLowerCase().includes(keyword);

      const matchesPlatform =
        platform === "All Platforms" ? true : service.platform === platform;

      return matchesSearch && matchesPlatform;
    });

    if (sortBy === "cheapest") {
      rows = [...rows].sort((a, b) => a.price - b.price);
    }

    if (sortBy === "fastest") {
      rows = [...rows].sort(
        (a, b) => getFastestMinutes(a.fastest) - getFastestMinutes(b.fastest),
      );
    }

    if (sortBy === "service_id") {
      rows = [...rows].sort((a, b) => a.publicId.localeCompare(b.publicId));
    }

    return rows;
  }, [services, search, platform, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, platform, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / SERVICES_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * SERVICES_PER_PAGE;
    return filteredServices.slice(startIndex, startIndex + SERVICES_PER_PAGE);
  }, [filteredServices, currentPage]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page++) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const startItem =
    filteredServices.length > 0 ? (currentPage - 1) * SERVICES_PER_PAGE + 1 : 0;

  const endItem = Math.min(
    currentPage * SERVICES_PER_PAGE,
    filteredServices.length,
  );

  const cheapestRate = services.length > 0 ? Math.min(...services.map((s) => s.price)) : 0;

  const fastestService = services.length > 0
    ? [...services].sort((a, b) => getFastestMinutes(a.fastest) - getFastestMinutes(b.fastest))[0]
    : null;

  const estimatedCharge = selectedService
    ? (Number(quantity || 0) / 1000) * selectedService.price
    : 0;

  function toggleFavorite(id: string) {
    setFavoriteIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <DashboardSidebar />

      <section className="min-h-screen lg:ml-72">
        <DashboardTopbar />

        <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[1fr_360px]">
          <div className="p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-950">Services</h1>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Explore, compare and order the best services.
                </p>
              </div>

              <a
                href="/dashboard/orders"
                className="hidden items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 md:flex"
              >
                <ShoppingCart size={18} />
                New Order
              </a>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Box}
                title="Total Services"
                value={loading ? "..." : services.length.toLocaleString()}
                subtitle="All active services"
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                icon={Heart}
                title="Favorite Services"
                value={favoriteIds.length.toLocaleString()}
                subtitle="Your favorite services"
                color="bg-pink-50 text-pink-500"
              />

              <StatCard
                icon={Zap}
                title="Fastest Delivery"
                value={fastestService?.fastest || "N/A"}
                subtitle="Overall fastest"
                color="bg-green-50 text-green-600"
              />

              <StatCard
                icon={Tag}
                title="Cheapest Rate"
                value={`₱${cheapestRate.toFixed(4)}`}
                subtitle="Starting from"
                color="bg-orange-50 text-orange-500"
              />
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_260px_260px_140px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search service ID or name..."
                  className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                />
              </div>

              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500"
              >
                {platforms.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500"
              >
                <option value="service_id">Sort by: Service ID</option>
                <option value="cheapest">Sort by: Cheapest</option>
                <option value="fastest">Sort by: Fastest</option>
              </select>

              <button className="flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600">
                <Filter size={18} />
                Filters
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {platforms.map((item) => (
                <button
                  key={item}
                  onClick={() => setPlatform(item)}
                  className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-black transition ${
                    platform === item
                      ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {item === "All Platforms" ? (
                    <Box size={17} />
                  ) : (
                    <PlatformIcon platform={item} size={18} />
                  )}

                  {item}

                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                      platform === item ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {getPlatformCount(services, item).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-5 text-left font-black">ID</th>
                      <th className="p-5 text-left font-black">Service</th>
                      <th className="p-5 text-left font-black">Category</th>
                      <th className="p-5 text-left font-black">Price / 1000</th>
                      <th className="p-5 text-left font-black">Min - Max</th>
                      <th className="p-5 text-left font-black">Fastest</th>
                      <th className="p-5 text-left font-black">Average</th>
                      <th className="p-5 text-left font-black">Tags</th>
                      <th className="p-5 text-left font-black">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-sm font-semibold text-slate-500">
                          Loading services...
                        </td>
                      </tr>
                    ) : filteredServices.length <= 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-sm font-semibold text-slate-500">
                          No services found.
                        </td>
                      </tr>
                    ) : (
                      paginatedServices.map((service) => {
                        const isFavorite = favoriteIds.includes(service.id);

                        return (
                          <tr
                            key={service.id}
                            className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${
                              selectedService?.id === service.id ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => toggleFavorite(service.id)}
                                  className={
                                    isFavorite
                                      ? "text-yellow-400"
                                      : "text-slate-300 hover:text-yellow-400"
                                  }
                                >
                                  <Star
                                    size={18}
                                    fill={isFavorite ? "currentColor" : "none"}
                                  />
                                </button>

                                <button
                                  onClick={() => setSelectedService(service)}
                                  className="font-black text-blue-600"
                                >
                                  {service.publicId}
                                </button>
                              </div>
                            </td>

                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <PlatformIcon platform={service.platform} size={28} />

                                <div>
                                  <p className="font-black text-slate-950">
                                    {service.name}
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-slate-400">
                                    {service.platform} • {service.category}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-5 font-bold text-slate-600">
                              {service.category}
                            </td>

                            <td className="p-5 font-black text-blue-600">
                              ₱{service.price.toFixed(2)}
                            </td>

                            <td className="p-5 font-bold text-slate-700">
                              {service.min.toLocaleString()} - {service.max.toLocaleString()}
                            </td>

                            <td className="p-5 font-black text-green-600">
                              {service.fastest}
                            </td>

                            <td className="p-5 font-black text-orange-500">
                              {service.average}
                            </td>

                            <td className="p-5">
                              <div className="flex flex-wrap gap-2">
                                {service.tags.length <= 0 ? (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                                    Standard
                                  </span>
                                ) : (
                                  service.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className={`rounded-full px-3 py-1 text-xs font-black ${getTagStyle(tag)}`}
                                    >
                                      {tag}
                                    </span>
                                  ))
                                )}
                              </div>
                            </td>

                            <td className="p-5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedService(service)}
                                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-blue-600 transition hover:bg-blue-50"
                                >
                                  <Eye size={17} />
                                </button>

                                <a
                                  href="/dashboard/orders"
                                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700"
                                >
                                  <ShoppingCart size={17} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Showing{" "}
                  <span className="font-black text-slate-700">
                    {startItem.toLocaleString()} - {endItem.toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-black text-slate-700">
                    {filteredServices.length.toLocaleString()}
                  </span>{" "}
                  services
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>

                  {visiblePages[0] > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        1
                      </button>

                      {visiblePages[0] > 2 && (
                        <span className="px-2 text-sm font-black text-slate-400">
                          ...
                        </span>
                      )}
                    </>
                  )}

                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-10 w-10 rounded-xl border text-sm font-black transition ${
                        page === currentPage
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  {visiblePages[visiblePages.length - 1] < totalPages && (
                    <>
                      {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                        <span className="px-2 text-sm font-black text-slate-400">
                          ...
                        </span>
                      )}

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="h-10 w-10 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-slate-200 bg-white p-5 lg:block">
            <div className="sticky top-[92px] max-h-[calc(100vh-110px)] overflow-y-auto pb-8 pr-1">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-950">
                  Service Details
                </h3>

                <button
                  onClick={() => setSelectedService(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {selectedService ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/50">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <Star
                              size={20}
                              className={favoriteIds.includes(selectedService.id) ? "text-yellow-400" : "text-slate-300"}
                              fill={favoriteIds.includes(selectedService.id) ? "currentColor" : "none"}
                            />

                            <p className="text-lg font-black text-blue-600">
                              {selectedService.publicId}
                            </p>
                          </div>

                          <h4 className="mt-3 break-words text-sm font-black leading-snug text-slate-950">
                            {selectedService.name}
                          </h4>

                          <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-600">
                            Active
                          </span>
                        </div>

                        <PlatformIcon platform={selectedService.platform} size={34} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <InfoRow label="Category" value={selectedService.platform} />
                    <InfoRow label="Type" value={selectedService.category} />
                    <InfoRow label="Description" value={selectedService.description} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MetricCard
                      title="Fastest Delivery"
                      value={selectedService.fastest}
                      color="bg-green-50 text-green-600"
                      icon={Zap}
                    />

                    <MetricCard
                      title="Average Delivery"
                      value={selectedService.average}
                      color="bg-orange-50 text-orange-500"
                      icon={Layers}
                    />

                    <SmallCard
                      title="Price / 1000"
                      value={`₱${selectedService.price.toFixed(2)}`}
                    />

                    <SmallCard
                      title="Min - Max"
                      value={`${selectedService.min.toLocaleString()} - ${selectedService.max.toLocaleString()}`}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-sm font-black text-slate-950">
                      Order Calculator
                    </h4>

                    <label className="mt-4 block text-sm font-bold text-slate-500">
                      Quantity
                    </label>

                    <input
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-500"
                    />

                    <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                      <span>Min: {selectedService.min.toLocaleString()}</span>
                      <span>Max: {selectedService.max.toLocaleString()}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-500">
                        Total Charge
                      </p>

                      <p className="text-xl font-black text-green-600">
                        ₱{estimatedCharge.toFixed(2)}
                      </p>
                    </div>

                    <a
                      href="/dashboard/orders"
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      <ShoppingCart size={17} />
                      Add to Order
                    </a>

                    <button
                      onClick={() => toggleFavorite(selectedService.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    >
                      <Star size={17} />
                      {favoriteIds.includes(selectedService.id)
                        ? "Remove Favorite"
                        : "Add to Favorites"}
                    </button>
                  </div>

                  <div className="mt-4 rounded-2xl bg-green-50 p-4">
                    {[
                      `Refill: ${selectedService.refill}`,
                      `Drop: ${selectedService.drop}`,
                      `Cancel Button: ${selectedService.cancel}`,
                      `Speed: ${selectedService.speed}`,
                    ].map((item) => (
                      <div
                        key={item}
                        className="mb-2 flex items-center gap-2 text-sm font-bold text-green-700 last:mb-0"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                  Select a service to view details.
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function getTagStyle(tag: string) {
  const value = tag.toLowerCase();

  if (value.includes("fast")) return "bg-green-50 text-green-600";
  if (value.includes("instant")) return "bg-blue-50 text-blue-600";
  if (value.includes("refill")) return "bg-sky-50 text-sky-600";
  if (value.includes("cheap")) return "bg-emerald-50 text-emerald-600";
  if (value.includes("real")) return "bg-teal-50 text-teal-600";
  return "bg-purple-50 text-purple-600";
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-slate-700">
        {value || "N/A"}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-3 ${color}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <p className="text-[11px] font-black">{title}</p>
      </div>

      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function PlatformIcon({ platform, size = 24 }: { platform: string; size?: number }) {
  const normalized = platform.toLowerCase();

  if (normalized.includes("instagram")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="url(#ig)" />
        <path d="M8 7.2h8A.8.8 0 0 1 16.8 8v8a.8.8 0 0 1-.8.8H8a.8.8 0 0 1-.8-.8V8A.8.8 0 0 1 8 7.2Z" stroke="white" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.8" stroke="white" strokeWidth="1.6" />
        <circle cx="15.5" cy="8.8" r=".8" fill="white" />
        <defs>
          <linearGradient id="ig" x1="3" y1="22" x2="22" y2="2">
            <stop stopColor="#FACC15" />
            <stop offset="0.35" stopColor="#F97316" />
            <stop offset="0.65" stopColor="#EC4899" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  if (normalized.includes("tiktok")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#050505" />
        <path d="M14.2 5.4v8.4a3.8 3.8 0 1 1-3.8-3.8c.3 0 .6 0 .9.1v2.2a1.6 1.6 0 1 0 .7 1.3V5.4h2.2Z" fill="#25F4EE" />
        <path d="M15.4 5.4c.4 2 1.6 3.2 3.4 3.5v2.2c-1.4-.1-2.6-.6-3.4-1.4v4.4a3.8 3.8 0 1 1-4.5-3.7v2.2a1.6 1.6 0 1 0 2.3 1.4V5.4h2.2Z" fill="#FE2C55" />
        <path d="M14.7 5.4v8.5a3.8 3.8 0 1 1-3.8-3.8h.4v2.2h-.4a1.6 1.6 0 1 0 1.6 1.6V5.4h2.2Zm.6 0c.5 1.8 1.7 3 3.5 3.3v2.2c-1.4-.1-2.6-.6-3.5-1.4V5.4Z" fill="white" />
      </svg>
    );
  }

  if (normalized.includes("youtube")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#FF0000" />
        <path d="M10 8.5 16 12l-6 3.5v-7Z" fill="white" />
      </svg>
    );
  }

  if (normalized.includes("facebook")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#1877F2" />
        <path d="M13.5 20v-7h2.3l.4-2.7h-2.7V8.6c0-.8.2-1.3 1.3-1.3h1.5V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.7H8v2.7h2.4v7h3.1Z" fill="white" />
      </svg>
    );
  }

  if (normalized.includes("telegram")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#29A9EA" />
        <path d="M18.8 6.1 5.4 11.3c-.9.4-.9.9-.2 1.1l3.4 1.1 1.3 4c.2.6.4.7.8.7.4 0 .6-.2.9-.5l1.9-1.9 3.9 2.9c.7.4 1.2.2 1.4-.7l2.5-11.7c.3-1-.4-1.4-1.1-1.1Z" fill="white" />
        <path d="M8.8 13.2 16.7 8.2c.4-.3.7-.1.4.2l-6.4 5.8-.2 2.5-1.1-3.3-.6-.2Z" fill="#29A9EA" />
      </svg>
    );
  }

  if (normalized.includes("spotify")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#1DB954" />
        <path d="M7.4 9.2c3.3-1 6.9-.6 9.8 1.1" stroke="#0B111C" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 12c2.5-.7 5.2-.4 7.5.9" stroke="#0B111C" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8.5 14.6c1.9-.5 4-.3 5.7.7" stroke="#0B111C" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes("discord")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#5865F2" />
        <path d="M8.2 8.2c2.5-1 5.1-1 7.6 0l1.3 5.1c-1.9 1.4-3.7 1.7-5.1 1.7s-3.2-.3-5.1-1.7l1.3-5.1Z" fill="white" />
        <circle cx="10.2" cy="11.5" r=".8" fill="#5865F2" />
        <circle cx="13.8" cy="11.5" r=".8" fill="#5865F2" />
      </svg>
    );
  }

  if (normalized.includes("twitter")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#050505" />
        <path d="M7 6h3.2l2.3 3.3L15.4 6H18l-4.2 4.8L18.5 18h-3.2l-2.7-4-3.5 4H6.5l4.8-5.5L7 6Zm2.1 1.5 7.1 9h1.2l-7.1-9H9.1Z" fill="white" />
      </svg>
    );
  }

  if (normalized.includes("website")) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="7" fill="#2563EB" />
        <circle cx="12" cy="12" r="6.5" stroke="white" strokeWidth="1.5" />
        <path d="M5.8 12h12.4M12 5.5c1.7 1.8 2.5 4 2.5 6.5s-.8 4.7-2.5 6.5M12 5.5c-1.7 1.8-2.5 4-2.5 6.5s.8 4.7 2.5 6.5" stroke="white" strokeWidth="1.3" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="7" fill="#64748B" />
      <circle cx="7.5" cy="12" r="1.3" fill="white" />
      <circle cx="12" cy="12" r="1.3" fill="white" />
      <circle cx="16.5" cy="12" r="1.3" fill="white" />
    </svg>
  );
}
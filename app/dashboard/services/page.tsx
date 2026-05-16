"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
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
  Zap,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Service = {
  id: string;
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

const services: Service[] = [
  {
    id: "1236",
    name: "TikTok Followers [High Quality]",
    platform: "TikTok",
    category: "Followers",
    price: 0.79,
    min: 10,
    max: 50000,
    fastest: "5m",
    average: "45m",
    tags: ["Fast", "HQ"],
    refill: "30 Days",
    drop: "No",
    cancel: "Yes",
    speed: "Fast",
    description: "High quality TikTok followers. Fast start, stable and safe for your account.",
  },
  {
    id: "1235",
    name: "TikTok Likes [Instant]",
    platform: "TikTok",
    category: "Likes",
    price: 0.45,
    min: 50,
    max: 20000,
    fastest: "2m",
    average: "15m",
    tags: ["Fast", "Instant"],
    refill: "No Refill",
    drop: "Low",
    cancel: "Yes",
    speed: "Instant",
    description: "Fast TikTok likes with quick delivery.",
  },
  {
    id: "1234",
    name: "Instagram Followers [Max 5K]",
    platform: "Instagram",
    category: "Followers",
    price: 1.2,
    min: 10,
    max: 5000,
    fastest: "6m",
    average: "1h 20m",
    tags: ["Refill", "HQ"],
    refill: "30 Days",
    drop: "Low",
    cancel: "Yes",
    speed: "Medium",
    description: "Instagram followers with stable delivery.",
  },
  {
    id: "1237",
    name: "Instagram Likes [Real]",
    platform: "Instagram",
    category: "Likes",
    price: 0.35,
    min: 20,
    max: 10000,
    fastest: "7m",
    average: "2h 30m",
    tags: ["Refill", "HQ"],
    refill: "30 Days",
    drop: "Low",
    cancel: "Yes",
    speed: "Medium",
    description: "Real Instagram likes for public posts.",
  },
  {
    id: "1238",
    name: "YouTube Subscribers [HQ]",
    platform: "YouTube",
    category: "Subscribers",
    price: 2.8,
    min: 10,
    max: 10000,
    fastest: "10m",
    average: "2h 10m",
    tags: ["Refill", "HQ"],
    refill: "30 Days",
    drop: "Low",
    cancel: "Yes",
    speed: "Medium",
    description: "High quality YouTube subscribers.",
  },
  {
    id: "1239",
    name: "YouTube Views [Real]",
    platform: "YouTube",
    category: "Views",
    price: 0.2,
    min: 100,
    max: 100000,
    fastest: "5m",
    average: "1h 10m",
    tags: ["Fast", "Refill"],
    refill: "30 Days",
    drop: "No",
    cancel: "Yes",
    speed: "Fast",
    description: "Real YouTube views with stable speed.",
  },
  {
    id: "1240",
    name: "Facebook Page Likes [Real]",
    platform: "Facebook",
    category: "Page Likes",
    price: 0.65,
    min: 50,
    max: 20000,
    fastest: "8m",
    average: "2h",
    tags: ["Refill", "HQ"],
    refill: "30 Days",
    drop: "Low",
    cancel: "Yes",
    speed: "Medium",
    description: "Real Facebook page likes.",
  },
  {
    id: "1241",
    name: "Telegram Members [Real]",
    platform: "Telegram",
    category: "Members",
    price: 0.4,
    min: 10,
    max: 50000,
    fastest: "3m",
    average: "50m",
    tags: ["Fast", "Refill"],
    refill: "30 Days",
    drop: "No",
    cancel: "Yes",
    speed: "Fast",
    description: "Telegram members with fast delivery.",
  },
  {
    id: "1242",
    name: "Twitter Followers [Real]",
    platform: "Twitter",
    category: "Followers",
    price: 0.7,
    min: 10,
    max: 10000,
    fastest: "12m",
    average: "3h",
    tags: ["Refill", "HQ"],
    refill: "30 Days",
    drop: "Low",
    cancel: "Yes",
    speed: "Medium",
    description: "Twitter/X followers for public profiles.",
  },
];

const platforms = [
  "All Platforms",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Telegram",
  "Others",
];

function getPlatformIcon(platform: string) {
  if (platform === "Instagram") return "📸";
  if (platform === "TikTok") return "🎵";
  if (platform === "YouTube") return "▶️";
  if (platform === "Facebook") return "📘";
  if (platform === "Telegram") return "✈️";
  if (platform === "Twitter") return "𝕏";
  return "🌐";
}

export default function DashboardServicesPage() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("All Platforms");
  const [selectedService, setSelectedService] = useState<Service>(services[0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(["1236"]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        service.id.includes(keyword) ||
        service.name.toLowerCase().includes(keyword) ||
        service.category.toLowerCase().includes(keyword) ||
        service.platform.toLowerCase().includes(keyword);

      const matchesPlatform =
        platform === "All Platforms" ? true : service.platform === platform;

      return matchesSearch && matchesPlatform;
    });
  }, [search, platform]);

  const cheapestRate = Math.min(...services.map((s) => s.price));

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

        <div className="grid min-h-[calc(100vh-80px)] lg:grid-cols-[1fr_390px]">
          <div className="p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-950">
                  Services
                </h1>

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
                value="1,248"
                subtitle="All active services"
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                icon={Heart}
                title="Favorite Services"
                value={String(favoriteIds.length)}
                subtitle="Your favorite services"
                color="bg-pink-50 text-pink-500"
              />

              <StatCard
                icon={Zap}
                title="Fastest Delivery"
                value="2m"
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

              <select className="h-14 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500">
                <option>Sort by: Service ID</option>
                <option>Sort by: Cheapest</option>
                <option>Sort by: Fastest</option>
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
                  <span>{item === "All Platforms" ? "▦" : getPlatformIcon(item)}</span>
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
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
                    {filteredServices.map((service) => {
                      const isFavorite = favoriteIds.includes(service.id);

                      return (
                        <tr
                          key={service.id}
                          className={`border-t border-slate-100 transition hover:bg-blue-50/40 ${
                            selectedService.id === service.id
                              ? "bg-blue-50/50"
                              : ""
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
                                {service.id}
                              </button>
                            </div>
                          </td>

                          <td className="p-5">
                            <p className="font-black text-slate-950">
                              {service.name}
                            </p>
                          </td>

                          <td className="p-5 font-bold text-slate-600">
                            {service.platform}
                          </td>

                          <td className="p-5 font-black text-blue-600">
                            ₱{service.price.toFixed(2)}
                          </td>

                          <td className="p-5 font-bold text-slate-700">
                            {service.min.toLocaleString()} -{" "}
                            {service.max.toLocaleString()}
                          </td>

                          <td className="p-5 font-black text-green-600">
                            {service.fastest}
                          </td>

                          <td className="p-5 font-black text-orange-500">
                            {service.average}
                          </td>

                          <td className="p-5">
                            <div className="flex flex-wrap gap-2">
                              {service.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    tag === "Fast"
                                      ? "bg-green-50 text-green-600"
                                      : tag === "Instant"
                                      ? "bg-blue-50 text-blue-600"
                                      : tag === "Refill"
                                      ? "bg-sky-50 text-sky-600"
                                      : "bg-purple-50 text-purple-600"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
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
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Showing 1 to {filteredServices.length} of {services.length} services
                </p>

                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button
                      key={page}
                      className={`h-10 w-10 rounded-xl border text-sm font-black ${
                        page === 1
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="hidden border-l border-slate-200 bg-white p-6 lg:block">
            <div className="sticky top-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-950">
                  Service Details
                </h3>

                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/50">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <Star
                          size={20}
                          className="text-yellow-400"
                          fill="currentColor"
                        />

                        <p className="text-xl font-black text-blue-600">
                          {selectedService.id}
                        </p>
                      </div>

                      <h4 className="mt-4 text-lg font-black text-slate-950">
                        {selectedService.name}
                      </h4>

                      <span className="mt-3 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-600">
                        Active
                      </span>
                    </div>

                    <div className="text-4xl">
                      {getPlatformIcon(selectedService.platform)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <InfoRow label="Category" value={selectedService.platform} />
                <InfoRow label="Type" value={selectedService.category} />
                <InfoRow label="Description" value={selectedService.description} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
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

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="text-lg font-black text-slate-950">
                  Order Calculator
                </h4>

                <label className="mt-5 block text-sm font-bold text-slate-500">
                  Quantity
                </label>

                <input
                  defaultValue="1000"
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-black outline-none focus:border-blue-500"
                />

                <div className="mt-3 flex justify-between text-xs font-bold text-slate-400">
                  <span>Min: {selectedService.min.toLocaleString()}</span>
                  <span>Max: {selectedService.max.toLocaleString()}</span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-500">
                    Total Charge
                  </p>

                  <p className="text-xl font-black text-green-600">
                    ₱{selectedService.price.toFixed(2)}
                  </p>
                </div>

                <a
                  href="/dashboard/orders"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  <ShoppingCart size={17} />
                  Add to Order
                </a>

                <button
                  onClick={() => toggleFavorite(selectedService.id)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                >
                  <Star size={17} />
                  Add to Favorites
                </button>
              </div>

              <div className="mt-5 rounded-2xl bg-green-50 p-5">
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
            </div>
          </aside>
        </div>
      </section>
    </main>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
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
    <div className={`rounded-2xl p-4 ${color}`}>
      <div className="flex items-center gap-2">
        <Icon size={18} />
        <p className="text-xs font-black">{title}</p>
      </div>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
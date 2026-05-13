"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
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
  const [message, setMessage] = useState("");

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

    if (profileData) {
      setProfile(profileData);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
        const keyword = search.toLowerCase();

        return (
          service.name.toLowerCase().includes(keyword) ||
          service.category.toLowerCase().includes(keyword)
        );
      })
      .sort(
        (a, b) =>
          Number(a.price_per_1000 || 0) - Number(b.price_per_1000 || 0)
      );
  }, [networkServices, category, search]);

  const selectedService =
    services.find((service) => service.id === selectedServiceId) || null;

  const estimatedCharge = selectedService
    ? (Number(quantity || 0) / 1000) * Number(selectedService.price_per_1000)
    : 0;

  function getDetail(label: string) {
    if (!selectedService) return "N/A";

    const regex = new RegExp(`\\[${label}:?\\s*([^\\]]+)\\]`, "i");
    const match = selectedService.name.match(regex);

    return match?.[1] || "N/A";
  }

  async function handleOrder() {
    if (!selectedService) {
      setMessage("Please select a service.");
      return;
    }

    if (!link) {
      setMessage("Please enter a link.");
      return;
    }

    const qty = Number(quantity);

    if (
      qty < selectedService.min_quantity ||
      qty > selectedService.max_quantity
    ) {
      setMessage(
        `Quantity must be between ${selectedService.min_quantity} and ${selectedService.max_quantity}.`
      );
      return;
    }

    const charge =
      (qty / 1000) * Number(selectedService.price_per_1000);

    const balance = Number(profile?.balance || 0);

    if (balance < charge) {
      setMessage("Insufficient wallet balance.");
      return;
    }

    setMessage("Creating order...");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("User not authenticated.");
      return;
    }

    const newBalance = balance - charge;

    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
      })
      .eq("id", authData.user.id);

    if (balanceError) {
      setMessage(balanceError.message);
      return;
    }

    const { error: orderError } = await supabase.from("orders").insert({
      user_id: authData.user.id,
      service_id: selectedService.id,
      service_name: selectedService.name,
      link,
      quantity: qty,
      price: charge,
      start_count: 0,
      current_count: 0,
      provider_order_id: null,
      provider_name: selectedService.provider_name,
      status: "pending",
    });

    if (orderError) {
      setMessage(orderError.message);
      return;
    }

    setMessage("Order placed successfully.");

    setNetwork("Everything");
    setCategory("");
    setSelectedServiceId("");
    setSearch("");
    setLink("");
    setQuantity("");
    setNotes("");

    loadData();
  }

  return (
    <DashboardLayout>
      <h2 className="text-4xl font-black mb-4">New Order</h2>

      <p className="text-zinc-400 mb-8">
        Choose a social network, select a service, and place your order.
      </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {networks.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setNetwork(item.name);
              setCategory("");
              setSelectedServiceId("");
              setSearch("");
            }}
            className={`rounded-2xl border px-5 py-4 font-semibold transition ${
              network === item.name
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-zinc-800 bg-zinc-950/80 text-zinc-400 hover:border-blue-500 hover:text-white"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.name}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <h3 className="text-2xl font-black mb-6">Order Details</h3>

          <div className="flex flex-col gap-5">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedServiceId("");
              }}
              placeholder="Search services..."
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSelectedServiceId("");
              }}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Select Category</option>

              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              disabled={!category}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 disabled:opacity-50"
            >
              <option value="">Select Service / Server</option>

              {filteredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  ₱{Number(service.price_per_1000 || 0).toFixed(2)} -{" "}
                  {service.name}
                </option>
              ))}
            </select>

            <input
              type="url"
              placeholder="Enter link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            {selectedService && (
              <p className="text-xs text-zinc-500">
                Min: {selectedService.min_quantity} • Max:{" "}
                {selectedService.max_quantity}
              </p>
            )}

            <textarea
              placeholder="Notes / comments / usernames if needed"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
            />

            {message && <p className="text-sm text-blue-400">{message}</p>}

            <button
              onClick={handleOrder}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
            >
              Place Order
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <h3 className="text-2xl font-black mb-6">Service Info</h3>

          {selectedService ? (
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-zinc-500">Selected Service</p>
                <p className="font-semibold">{selectedService.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-zinc-500">Start Time</p>
                  <p className="font-semibold text-orange-400">
                    {getDetail("Start Time")}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-500">Speed</p>
                  <p className="font-semibold text-orange-400">
                    {getDetail("Speed")}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-500">Refill</p>
                  <p className="font-semibold text-orange-400">
                    {getDetail("Refill")}
                  </p>
                </div>

                <div>
                  <p className="text-zinc-500">Average Time</p>
                  <p className="font-semibold text-orange-400">
                    Depends on service
                  </p>
                </div>
              </div>

              <div>
                <p className="text-zinc-500">Minimum</p>
                <p className="font-semibold">{selectedService.min_quantity}</p>
              </div>

              <div>
                <p className="text-zinc-500">Maximum</p>
                <p className="font-semibold">{selectedService.max_quantity}</p>
              </div>

              <div>
                <p className="text-zinc-500">Price per 1,000</p>
                <p className="font-semibold">
                  ₱{Number(selectedService.price_per_1000).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">Estimated Charge</p>
                <p className="text-3xl font-black text-blue-400">
                  ₱{estimatedCharge.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-zinc-500">Wallet Balance</p>
                <p className="text-green-400 font-bold">
                  ₱{Number(profile?.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-500">
              Select a category and service to view details.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
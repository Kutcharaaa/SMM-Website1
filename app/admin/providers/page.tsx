"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Provider = {
  id: string;
  name: string;
  api_url: string;
  api_key: string;
  status: string;
  mode: string;
  balance: number | null;
};

type ImportedService = {
  provider_service_id: string;
  name: string;
  category: string;
  price: number;
  min: number;
  max: number;
  type: string;
  refill: boolean;
  cancel: boolean;
};

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);

  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);

  const [importModal, setImportModal] = useState(false);
  const [importProvider, setImportProvider] = useState<Provider | null>(null);
  const [importedServices, setImportedServices] = useState<ImportedService[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [markupPercent, setMarkupPercent] = useState("30");
  const [importing, setImporting] = useState(false);

  async function loadProviders() {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setProviders(data || []);
  }

  async function addProvider() {
    if (!name || !apiUrl || !apiKey) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("providers").insert({
      name,
      api_url: apiUrl,
      api_key: apiKey,
      status: "active",
      mode: "manual",
      balance: 0,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    clearForm();
    loadProviders();
  }

  async function updateProvider() {
    if (!editingProvider) return;

    if (!name || !apiUrl || !apiKey) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("providers")
      .update({
        name,
        api_url: apiUrl,
        api_key: apiKey,
      })
      .eq("id", editingProvider.id);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    clearForm();
    loadProviders();
  }

  async function toggleProviderStatus(provider: Provider) {
    const nextStatus = provider.status === "active" ? "inactive" : "active";

    const { error } = await supabase
      .from("providers")
      .update({ status: nextStatus })
      .eq("id", provider.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadProviders();
  }

  async function toggleProviderMode(provider: Provider) {
    const nextMode = provider.mode === "manual" ? "auto" : "manual";

    const { error } = await supabase
      .from("providers")
      .update({ mode: nextMode })
      .eq("id", provider.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadProviders();
  }

  async function testProvider(provider: Provider) {
    try {
      const response = await fetch("/api/admin/providers/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: provider.id,
        }),
      });

      const result = await response.json();

      alert(result.message);

      loadProviders();
    } catch {
      alert("Failed to test provider.");
    }
  }

  async function importServices(provider: Provider) {
    try {
      const response = await fetch("/api/admin/providers/import-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: provider.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      setImportProvider(provider);
      setImportedServices(result.services || []);
      setSelectedServices([]);
      setSearch("");
      setImportModal(true);
    } catch {
      alert("Failed to import services.");
    }
  }

  async function bulkImportSelectedServices() {
    if (!importProvider) return;

    const selected = importedServices.filter((service) =>
      selectedServices.includes(service.provider_service_id)
    );

    if (selected.length <= 0) {
      alert("Please select at least one service.");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/admin/providers/bulk-import-services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerId: importProvider.id,
          services: selected,
          markupPercent: Number(markupPercent || 0),
        }),
      });

      const result = await response.json();

      alert(result.message);

      if (result.success) {
        setImportModal(false);
        setImportedServices([]);
        setSelectedServices([]);
      }
    } catch {
      alert("Failed to bulk import services.");
    }

    setImporting(false);
  }

  function toggleSelectedService(serviceId: string) {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filteredServices.map(
      (service) => service.provider_service_id
    );

    const allVisibleSelected = visibleIds.every((id) =>
      selectedServices.includes(id)
    );

    if (allVisibleSelected) {
      setSelectedServices((current) =>
        current.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedServices((current) =>
        Array.from(new Set([...current, ...visibleIds]))
      );
    }
  }

  function startEdit(provider: Provider) {
    setEditingProvider(provider);
    setName(provider.name);
    setApiUrl(provider.api_url);
    setApiKey(provider.api_key);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function clearForm() {
    setEditingProvider(null);
    setName("");
    setApiUrl("");
    setApiKey("");
  }

  useEffect(() => {
    loadProviders();
  }, []);

  const filteredServices = importedServices.filter((service) => {
    const keyword = search.toLowerCase();

    return (
      service.name.toLowerCase().includes(keyword) ||
      service.category.toLowerCase().includes(keyword) ||
      service.provider_service_id.toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Providers</h2>

          <p className="text-zinc-400 mb-8">
            Manage API providers, balances, status, and sync settings.
          </p>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
              <h3 className="text-2xl font-black mb-6">
                {editingProvider ? "Edit Provider" : "Add Provider"}
              </h3>

              <div className="space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Provider Name"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="API URL"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="API Key"
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                />

                {editingProvider ? (
                  <div className="flex gap-3">
                    <button
                      onClick={updateProvider}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 font-semibold transition disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={clearForm}
                      disabled={loading}
                      className="rounded-xl border border-zinc-800 px-4 py-3 text-zinc-300 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={addProvider}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-3 font-semibold transition disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Provider"}
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 grid lg:grid-cols-2 gap-6">
              {providers.length <= 0 && (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-500">
                  No providers added yet.
                </div>
              )}

              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6"
                >
                  <h3 className="text-2xl font-black mb-2">{provider.name}</h3>

                  <p className="text-sm text-zinc-500 mb-5 break-all">
                    {provider.api_url}
                  </p>

                  <p className="text-zinc-400 text-sm">Provider Balance</p>

                  <h4 className="text-3xl font-black mt-2 mb-5">
                    ${Number(provider.balance || 0).toFixed(2)}
                  </h4>

                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        provider.status === "active"
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {provider.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        provider.mode === "auto"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {provider.mode}
                    </span>
                  </div>

                  <div className="mt-4 text-sm text-zinc-500">
                    API Key: ••••••••••••••••
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => testProvider(provider)}
                      className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4 py-2 text-sm font-semibold transition"
                    >
                      Test
                    </button>

                    <button
                      onClick={() => importServices(provider)}
                      className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4 py-2 text-sm font-semibold transition"
                    >
                      Import Services
                    </button>

                    <button
                      onClick={() => startEdit(provider)}
                      className="border border-zinc-800 hover:border-blue-500 rounded-xl px-4 py-2 text-sm font-semibold transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleProviderMode(provider)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        provider.mode === "auto"
                          ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                          : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      }`}
                    >
                      {provider.mode === "auto" ? "Auto Mode" : "Manual Mode"}
                    </button>

                    <button
                      onClick={() => toggleProviderStatus(provider)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        provider.status === "active"
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {provider.status === "active" ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {importModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-7xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black">Import Services</h3>

                  <p className="text-zinc-500 mt-1">
                    {importProvider?.name} • {importedServices.length} services
                    fetched • {selectedServices.length} selected
                  </p>
                </div>

                <button
                  onClick={() => setImportModal(false)}
                  className="text-zinc-500 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 border-b border-zinc-800 grid lg:grid-cols-4 gap-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search services..."
                  className="lg:col-span-2 w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 outline-none focus:border-purple-500"
                />

                <input
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(e.target.value)}
                  type="number"
                  placeholder="Markup %"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-5 py-4 outline-none focus:border-purple-500"
                />

                <button
                  onClick={bulkImportSelectedServices}
                  disabled={importing}
                  className="rounded-2xl bg-purple-600 hover:bg-purple-700 px-5 py-4 font-bold transition disabled:opacity-50"
                >
                  {importing
                    ? "Importing..."
                    : `Import Selected (${selectedServices.length})`}
                </button>
              </div>

              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <button
                  onClick={toggleSelectAllVisible}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-purple-500 hover:text-white transition"
                >
                  Select / Unselect Visible
                </button>

                <p className="text-sm text-zinc-500">
                  Showing {filteredServices.length} services
                </p>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-black/60 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="text-left p-5">Select</th>
                      <th className="text-left p-5">Service</th>
                      <th className="text-left p-5">Category</th>
                      <th className="text-left p-5">Provider Rate</th>
                      <th className="text-left p-5">Your Price</th>
                      <th className="text-left p-5">Min</th>
                      <th className="text-left p-5">Max</th>
                      <th className="text-left p-5">Type</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredServices.map((service) => {
                      const selected = selectedServices.includes(
                        service.provider_service_id
                      );

                      const providerUsdRate = Number(service.price || 0);
                      const usdToPhpMarketRate = 58;
                      const markup = Number(markupPercent || 0);

                      const phpCost = providerUsdRate * usdToPhpMarketRate;
                      const finalPrice = phpCost + phpCost * (markup / 100);

                      return (
                        <tr
                          key={service.provider_service_id}
                          className="border-t border-zinc-900"
                        >
                          <td className="p-5">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() =>
                                toggleSelectedService(
                                  service.provider_service_id
                                )
                              }
                              className="h-5 w-5 accent-purple-600"
                            />
                          </td>

                          <td className="p-5">
                            <p className="font-medium">{service.name}</p>
                            <p className="text-xs text-zinc-600">
                              ID: {service.provider_service_id}
                            </p>
                          </td>

                          <td className="p-5 text-zinc-400">
                            {service.category}
                          </td>

                          <td className="p-5 text-zinc-400">
                            ${providerUsdRate.toFixed(4)}
                          </td>

                          <td className="p-5 text-purple-400 font-semibold">
                            ₱{finalPrice.toFixed(4)}
                          </td>

                          <td className="p-5 text-zinc-400">{service.min}</td>

                          <td className="p-5 text-zinc-400">{service.max}</td>

                          <td className="p-5 text-zinc-400">{service.type}</td>
                        </tr>
                      );
                    })}

                    {filteredServices.length <= 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-10 text-center text-zinc-500"
                        >
                          No services found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
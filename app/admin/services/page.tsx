"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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
  provider_id: string | null;
  auto_order: boolean;
  status: string;
  created_at: string;
};

type Provider = {
  id: string;
  name: string;
  status: string;
  mode: string;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [message, setMessage] = useState("");

  const [savingService, setSavingService] = useState(false);
  const [importingServices, setImportingServices] = useState(false);
  const [deletingServices, setDeletingServices] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [maxQuantity, setMaxQuantity] = useState("");
  const [providerServiceId, setProviderServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [autoOrder, setAutoOrder] = useState(false);
  const [status, setStatus] = useState("active");

  async function loadServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    setServices(data || []);
  }

  async function loadProviders() {
    const { data } = await supabase
      .from("providers")
      .select("id, name, status, mode")
      .eq("status", "active")
      .order("name");

    setProviders(data || []);
  }

  useEffect(() => {
    loadServices();
    loadProviders();
  }, []);

  function getSelectedProviderName() {
    const provider = providers.find((item) => item.id === providerId);
    return provider?.name || "manual";
  }

  function resetForm() {
    setName("");
    setCategory("");
    setDescription("");
    setPrice("");
    setMinQuantity("");
    setMaxQuantity("");
    setProviderServiceId("");
    setProviderId("");
    setAutoOrder(false);
    setStatus("active");
  }

  function openManage(service: Service) {
    setSelectedService(service);
    setName(service.name || "");
    setCategory(service.category || "");
    setDescription(service.description || "");
    setPrice(String(service.price_per_1000 || ""));
    setMinQuantity(String(service.min_quantity || ""));
    setMaxQuantity(String(service.max_quantity || ""));
    setProviderServiceId(service.provider_service_id || "");
    setProviderId(service.provider_id || "");
    setAutoOrder(Boolean(service.auto_order));
    setStatus(service.status || "active");
  }

  function toggleSelectService(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === services.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(services.map((service) => service.id));
    }
  }

  async function deleteSelectedServices() {
    if (deletingServices) return;

    if (selectedIds.length <= 0) {
      setMessage("Please select at least one service.");
      return;
    }

    const confirmDelete = confirm(
      `Delete ${selectedIds.length} selected services? This cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingServices(true);

    try {
      const response = await fetch("/api/admin/services/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setMessage(result.message);
        setDeletingServices(false);
        return;
      }

      setMessage(result.message);
      setSelectedIds([]);
      setDeletingServices(false);
      loadServices();
    } catch {
      setMessage("Failed to delete selected services.");
      setDeletingServices(false);
    }
  }

async function deleteAllServices() {
  if (deletingServices) return;

  const confirmDelete = confirm(
    "Delete ALL services? This cannot be undone."
  );

  if (!confirmDelete) return;

  const doubleConfirm = confirm(
    "Are you 100% sure? This will remove every service from your panel."
  );

  if (!doubleConfirm) return;

  setDeletingServices(true);

  try {
    const response = await fetch("/api/admin/services/delete-all", {
      method: "POST",
    });

    const result = await response.json();

    if (!result.success) {
      setMessage(result.message);
      setDeletingServices(false);
      return;
    }

    setMessage(result.message);
    setSelectedIds([]);
    setDeletingServices(false);
    loadServices();
  } catch {
    setMessage("Failed to delete all services.");
    setDeletingServices(false);
  }
}

  async function addService() {
    if (savingService) return;

    setSavingService(true);
    if (!name || !category || !price || !minQuantity || !maxQuantity) {
      setMessage("Please complete all required fields.");
      setSavingService(false);
      return;
    }

    const { error } = await supabase.from("services").insert({
      name,
      category,
      description,
      price_per_1000: Number(price),
      min_quantity: Number(minQuantity),
      max_quantity: Number(maxQuantity),
      provider_service_id: providerServiceId,
      provider_id: providerId || null,
      provider_name: getSelectedProviderName(),
      auto_order: autoOrder,
      status: "active",
    });

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    setMessage("Service added successfully.");
    setSavingService(false);
    resetForm();
    setShowAddModal(false);
    loadServices();
  }

  async function updateService() {
    if (savingService) return;

    if (!selectedService) return;

    setSavingService(true);

    const { error } = await supabase
      .from("services")
      .update({
        name,
        category,
        description,
        price_per_1000: Number(price),
        min_quantity: Number(minQuantity),
        max_quantity: Number(maxQuantity),
        provider_service_id: providerServiceId,
        provider_id: providerId || null,
        provider_name: getSelectedProviderName(),
        auto_order: autoOrder,
        status,
      })
      .eq("id", selectedService.id);

    if (error) {
      setMessage(error.message);
      setSavingService(false);
      return;
    }

    setMessage("Service updated successfully.");
    setSavingService(false);
    setSelectedService(null);
    resetForm();
    loadServices();
  }

  async function deleteService() {
    if (deletingServices) return;

    setDeletingServices(true);
    if (!selectedService) {
      setDeletingServices(false);
      return;
    }

    const confirmDelete = confirm(
      `Delete service "${selectedService.name}"? This cannot be undone.`
    );

    if (!confirmDelete) {
      setDeletingServices(false);
      return;
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", selectedService.id);

if (error) {
  setMessage(error.message);
  setDeletingServices(false);
  return;
}

    setMessage("Service deleted successfully.");
    setDeletingServices(false);
    setSelectedService(null);
    resetForm();
    loadServices();
  }

  function getStatusStyle(serviceStatus: string) {
    if (serviceStatus === "active") return "bg-green-500/10 text-green-400";
    if (serviceStatus === "paused") return "bg-yellow-500/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
  }

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">Services</h2>

        <p className="text-zinc-400 mb-8">
          Manage services, pricing, status, and provider mapping.
        </p>

        {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 mb-8 flex flex-wrap gap-3 justify-between">
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
          >
            Add Service
          </button>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={toggleSelectAll}
              className="border border-zinc-800 hover:border-blue-500 rounded-xl px-5 py-3 font-semibold transition"
            >
              {selectedIds.length === services.length && services.length > 0
                ? "Unselect All"
                : "Select All"}
            </button>

<button
  onClick={deleteSelectedServices}
  disabled={selectedIds.length <= 0 || deletingServices}
  className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
>
  {deletingServices
    ? "Deleting..."
    : `Delete Selected (${selectedIds.length})`}
</button>

<button
  onClick={deleteAllServices}
  disabled={deletingServices}
  className="border border-red-600 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
>
  {deletingServices ? "Deleting..." : "Delete All Services"}
</button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Select</th>
                <th className="text-left p-5">Service</th>
                <th className="text-left p-5">Category</th>
                <th className="text-left p-5">Provider</th>
                <th className="text-left p-5">Auto</th>
                <th className="text-left p-5">Price / 1000</th>
                <th className="text-left p-5">Min</th>
                <th className="text-left p-5">Max</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {services.map((service) => (
                <tr key={service.id} className="border-t border-zinc-900">
                  <td className="p-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(service.id)}
                      onChange={() => toggleSelectService(service.id)}
                      className="h-5 w-5 accent-blue-600"
                    />
                  </td>

                  <td className="p-5">
                    <p className="font-medium">{service.name}</p>
                    <p className="text-xs text-zinc-500 max-w-xs truncate">
                      {service.description}
                    </p>
                  </td>

                  <td className="p-5 text-zinc-400">{service.category}</td>

                  <td className="p-5 text-zinc-400">
                    {service.provider_name || "manual"}
                    {service.provider_service_id && (
                      <p className="text-xs text-zinc-600">
                        ID: {service.provider_service_id}
                      </p>
                    )}
                  </td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${service.auto_order
                        ? "bg-purple-500/10 text-purple-400"
                        : "bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      {service.auto_order ? "Auto" : "Manual"}
                    </span>
                  </td>

                  <td className="p-5 text-blue-400 font-semibold">
                    ₱{Number(service.price_per_1000 || 0).toFixed(2)}
                  </td>

                  <td className="p-5 text-zinc-400">{service.min_quantity}</td>
                  <td className="p-5 text-zinc-400">{service.max_quantity}</td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                        service.status
                      )}`}
                    >
                      {service.status}
                    </span>
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => openManage(service)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}

              {services.length <= 0 && (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-zinc-500">
                    No services yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(showAddModal || selectedService) && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">
                    {selectedService ? "Manage Service" : "Add Service"}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    {selectedService
                      ? "Edit service details, pricing, provider, and status."
                      : "Create a new service for users."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedService(null);
                    resetForm();
                  }}
                  className="text-zinc-500 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Service Name"
                />

                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  placeholder="Category"
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500 min-h-24"
                  placeholder="Description"
                />

                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    placeholder="Price / 1000"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    type="number"
                    placeholder="Min"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={maxQuantity}
                    onChange={(e) => setMaxQuantity(e.target.value)}
                    type="number"
                    placeholder="Max"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <select
                    value={providerId}
                    onChange={(e) => setProviderId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Manual / No Provider</option>

                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name} ({provider.mode})
                      </option>
                    ))}
                  </select>

                  <input
                    value={providerServiceId}
                    onChange={(e) => setProviderServiceId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Provider Service ID"
                  />
                </div>

                <button
                  onClick={() => setAutoOrder(!autoOrder)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${autoOrder
                    ? "bg-purple-500/10 text-purple-400"
                    : "bg-zinc-800 text-zinc-400"
                    }`}
                >
                  Auto Order: {autoOrder ? "Enabled" : "Disabled"}
                </button>

                {selectedService && (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="disabled">Disabled</option>
                  </select>
                )}
              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-between gap-3">
                <div>
                  {selectedService && (
                    <button
                      onClick={deleteSelectedServices}
                      disabled={selectedIds.length <= 0 || deletingServices}
                      className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {deletingServices
                        ? "Deleting..."
                        : `Delete Selected (${selectedIds.length})`}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedService(null);
                      resetForm();
                    }}
                    className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={selectedService ? updateService : addService}
                    disabled={savingService}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingService
                      ? "Saving..."
                      : selectedService
                        ? "Save Changes"
                        : "Create Service"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
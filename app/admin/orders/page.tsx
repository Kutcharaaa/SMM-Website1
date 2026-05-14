"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { useConfirm } from "@/components/ConfirmProvider";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [newStatus, setNewStatus] = useState("");
  const [startCount, setStartCount] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);

  const [refundEnabled, setRefundEnabled] = useState(true);
  const [message, setMessage] = useState("");

  const [syncingOrders, setSyncingOrders] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState(false);
  const [providerActionLoading, setProviderActionLoading] = useState(false);
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

    setOrders(data || []);

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

  function getStatusStyle(status: string) {
    if (status === "completed") {
      return "bg-green-500/10 text-green-400";
    }

    if (status === "cancelled" || status === "canceled") {
      return "bg-red-500/10 text-red-400";
    }

    if (status === "processing") {
      return "bg-blue-500/10 text-blue-400";
    }

    if (status === "partial") {
      return "bg-purple-500/10 text-purple-400";
    }

    return "bg-yellow-500/10 text-yellow-400";
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
    message: "Are you sure you want to send a cancel request to the provider?",
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

    await supabase.from("notifications").insert({
      user_id: selectedOrder.user_id,
      title: "Order Status Updated",
      message: `Your order for ${selectedOrder.service_name} is now ${newStatus}.`,
      type: "order_status_updated",
      is_read: false,
    });

    setMessage("Order updated successfully.");
    setSavingOrder(false);
    setSelectedOrder(null);
    setNewStatus("");
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

const confirmRefund = await confirmAction({
  title: "Refund Order",
  message: `Refund ₱${Number(selectedOrder.price || 0).toFixed(
    2
  )} back to the user's wallet? This will cancel the order.`,
  confirmText: "Refund",
  variant: "danger",
});

    if (!confirmRefund) {
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
        2
      )} was refunded to your wallet.`,
      type: "order_refunded",
      is_read: false,
    });

    setMessage("Order refunded successfully.");
    setRefundingOrder(false);
    setSelectedOrder(null);
    setNewStatus("");
    loadOrders();
  }

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">Orders</h2>

        <p className="text-zinc-400 mb-8">
          Monitor all user orders and provider processing status.
        </p>

        <div className="flex items-center justify-between mb-4">
          {message ? (
            <p className="text-sm text-blue-400">{message}</p>
          ) : (
            <div />
          )}

          <button
            onClick={syncOrderStatuses}
            disabled={syncingOrders}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingOrders ? "Syncing..." : "Sync Status"}
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
  <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Service</th>
                <th className="text-left p-5">Quantity</th>
                <th className="text-left p-5">Charge</th>
                <th className="text-left p-5">Provider</th>
                <th className="text-left p-5">Progress</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5">Date</th>
                <th className="text-left p-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-zinc-900">
                  <td className="p-5">
                    <p className="font-semibold">{order.service_name}</p>

                    <p className="text-xs text-zinc-500 truncate max-w-xs">
                      {order.link}
                    </p>
                  </td>

                  <td className="p-5 text-zinc-300">{order.quantity}</td>

                  <td className="p-5 text-blue-400 font-semibold">
                    ₱{Number(order.price || 0).toFixed(2)}
                  </td>

                  <td className="p-5 text-zinc-400">
                    <p>{order.provider_name || "Manual"}</p>
                    {order.provider_order_id && (
                      <p className="text-xs text-zinc-600">
                        ID: {order.provider_order_id}
                      </p>
                    )}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {order.current_count || 0} / {order.quantity}
                  </td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="p-5 text-zinc-500">
                    {new Date(order.created_at).toLocaleString()}
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setStartCount(order.start_count || 0);
                        setCurrentCount(order.current_count || 0);
                        setMessage("");
                      }}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}

              {orders.length <= 0 && (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-zinc-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start lg:items-center justify-center p-3 lg:p-6 overflow-y-auto">
            <div className="w-full max-w-3xl my-10 rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">Manage Order</h3>

                  <p className="text-sm text-zinc-500">
                    Update order status or refund pending orders.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setNewStatus("");
                  }}
                  className="text-zinc-500 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm text-zinc-500">Service</p>
                  <p className="font-semibold">{selectedOrder.service_name}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Link</p>

                  <a
                    href={selectedOrder.link}
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 break-all"
                  >
                    {selectedOrder.link}
                  </a>
                </div>

                <div className="grid md:grid-cols-4 gap-5">
                  <div>
                    <p className="text-sm text-zinc-500">Quantity</p>
                    <p className="font-semibold">{selectedOrder.quantity}</p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">Charge</p>
                    <p className="font-semibold text-blue-400">
                      ₱{Number(selectedOrder.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">Provider</p>
                    <p className="font-semibold">
                      {selectedOrder.provider_name || "Manual"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">Current Status</p>

                    <span
                      className={`inline-block mt-1 rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                        selectedOrder.status
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                {selectedOrder.provider_order_id && (
                  <div>
                    <p className="text-sm text-zinc-500">Provider Order ID</p>
                    <p className="font-semibold text-purple-400">
                      {selectedOrder.provider_order_id}
                    </p>
                  </div>
                )}

                {selectedOrder.provider_order_id && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleProviderAction("sync")}
                      disabled={providerActionLoading}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {providerActionLoading ? "Processing..." : "Sync This Order"}
                    </button>

                    <button
                      onClick={() => handleProviderAction("cancel")}
                      disabled={providerActionLoading}
                      className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {providerActionLoading ? "Processing..." : "Cancel Provider Order"}
                    </button>

                    <button
                      onClick={() => handleProviderAction("refill")}
                      disabled={providerActionLoading}
                      className="rounded-xl bg-purple-600 hover:bg-purple-700 px-4 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {providerActionLoading ? "Processing..." : "Request Refill"}
                    </button>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">
                      Start Count
                    </label>

                    <input
                      type="number"
                      value={startCount}
                      onChange={(e) => setStartCount(Number(e.target.value))}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">
                      Current Count
                    </label>

                    <input
                      type="number"
                      value={currentCount}
                      onChange={(e) => setCurrentCount(Number(e.target.value))}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-500 mb-2">
                    Update Status
                  </label>

                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="partial">Partial</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {!refundEnabled && (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">
                      Refund system is currently disabled.
                    </p>
                  </div>
                )}

                {refundEnabled && selectedOrder.status === "pending" && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-sm text-yellow-400">
                      This order is still pending and can be refunded to the
                      user's wallet.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-zinc-800 flex flex-col lg:flex-row justify-between gap-3">
                <div>
                  {refundEnabled && selectedOrder.status === "pending" && (
                    <button
                      onClick={refundOrder}
                      disabled={refundingOrder}
                      className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {refundingOrder ? "Refunding..." : "Refund"}
                    </button>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setNewStatus("");
                    }}
                    className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={updateOrderStatus}
                    disabled={savingOrder}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingOrder ? "Saving..." : "Save Changes"}
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
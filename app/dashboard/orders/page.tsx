"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setOrders(data || []);
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function getStatusStyle(status: string) {
    if (status === "completed") return "bg-green-500/10 text-green-400";
    if (status === "cancelled" || status === "canceled")
      return "bg-red-500/10 text-red-400";
    if (status === "processing") return "bg-blue-500/10 text-blue-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <h2 className="text-4xl font-black mb-4">Orders</h2>

        <p className="text-zinc-400 mb-8">
          View and track all your previous orders.
        </p>

        {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Service</th>
                <th className="text-left p-5">Quantity</th>
                <th className="text-left p-5">Charge</th>
                <th className="text-left p-5">Progress</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5">Date</th>
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
                </tr>
              ))}

              {orders.length <= 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}
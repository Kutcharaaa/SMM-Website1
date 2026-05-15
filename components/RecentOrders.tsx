"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  service_name: string;
  quantity: number;
  status: string;
  price: number;
  created_at: string;
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function loadOrders() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data } = await supabase
      .from("orders")
      .select("id, service_name, quantity, status, price, created_at")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setOrders(data || []);
  }

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <h3 className="text-xl font-black text-slate-950">Recent Orders</h3>

        <a
          href="/dashboard/orders"
          className="px-4 py-2 text-sm font-bold text-blue-600 transition hover:text-gray-800"
        >
          View All Orders
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-5 text-left font-bold">Order ID</th>
              <th className="p-5 text-left font-bold">Service</th>
              <th className="p-5 text-left font-bold">Quantity</th>
              <th className="p-5 text-left font-bold">Status</th>
              <th className="p-5 text-left font-bold">Amount</th>
            </tr>
          </thead>

          <tbody>
            {orders.length <= 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No recent orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const status = (order.status || "pending").toLowerCase();

                return (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="p-5 font-semibold text-slate-500">
                      #{order.id.slice(0, 8)}
                    </td>

                    <td className="p-5 font-bold text-slate-900">
                      {order.service_name || "Unknown Service"}
                    </td>

                    <td className="p-5 text-slate-500">
                      {Number(order.quantity || 0).toLocaleString()}
                    </td>

                    <td className="p-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          status === "completed"
                            ? "bg-green-50 text-green-600"
                            : status === "pending"
                            ? "bg-yellow-50 text-yellow-600"
                            : status === "cancelled" || status === "canceled"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-5 font-black text-slate-900">
                      ₱{Number(order.price || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
"use client";

import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import Link from "next/link";
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
  const { formatAmount } = useDisplayCurrency();

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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <h3 className="text-lg font-black text-slate-950 sm:text-xl">
          Recent Orders
        </h3>

        <Link
          href="/dashboard/orders"
          className="inline-flex w-fit items-center rounded-xl px-0 py-1 text-sm font-bold text-blue-600 transition hover:text-gray-800 sm:px-4 sm:py-2"
        >
          View All Orders
        </Link>
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
                    <td className="whitespace-nowrap p-5 font-semibold text-slate-500">
                      #{order.id.slice(0, 8)}
                    </td>

                    <td className="max-w-[280px] truncate p-5 font-bold text-slate-900">
                      {order.service_name || "Unknown Service"}
                    </td>

                    <td className="whitespace-nowrap p-5 text-slate-500">
                      {Number(order.quantity || 0).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap p-5">
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

                    <td className="whitespace-nowrap p-5 font-black text-slate-900">
                      {formatAmount(order.price)}
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
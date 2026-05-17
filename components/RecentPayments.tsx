"use client";

import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import { useEffect, useState } from "react";

type Payment = {
  id: string;
  method: string | null;
  amount: number | null;
  status: string | null;
  created_at: string;
};

export default function RecentPayments() {
  const { formatAmount } = useDisplayCurrency();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPayments() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("deposits")
      .select("id, method, amount, status, created_at")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Recent payments error:", error.message);
      setPayments([]);
      setLoading(false);
      return;
    }

    setPayments((data || []) as Payment[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();

    const interval = setInterval(loadPayments, 10000);

    return () => clearInterval(interval);
  }, []);

  function getStatusClass(statusValue: string | null) {
    const status = String(statusValue || "pending").toLowerCase();

    if (status === "approved" || status === "completed" || status === "paid") {
      return "bg-green-50 text-green-600";
    }

    if (status === "pending") {
      return "bg-yellow-50 text-yellow-600";
    }

    if (status === "rejected" || status === "cancelled" || status === "canceled") {
      return "bg-red-50 text-red-600";
    }

    return "bg-blue-50 text-blue-600";
  }

  function formatStatus(statusValue: string | null) {
    const status = String(statusValue || "pending").toLowerCase();

    if (status === "approved") return "Completed";
    if (status === "paid") return "Completed";

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h3 className="text-xl font-black text-slate-950">
            Recent Payments
          </h3>
        </div>

        <a
          href="/dashboard/transactions"
          className="px-4 py-2 text-sm font-bold text-blue-600 transition hover:text-gray-800"
        >
          View All Payments
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-5 text-left font-bold">Payment ID</th>
              <th className="p-5 text-left font-bold">Method</th>
              <th className="p-5 text-left font-bold">Amount</th>
              <th className="p-5 text-left font-bold">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length <= 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No recent payments yet.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="p-5 font-semibold text-slate-500">
                    #{payment.id.slice(0, 8)}
                  </td>

                  <td className="p-5 font-bold text-slate-900">
                    {payment.method || "Manual Payment"}
                  </td>

                  <td className="p-5 font-black text-slate-900">
                    {formatAmount(payment.amount || 0)}
                  </td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                        payment.status,
                      )}`}
                    >
                      {formatStatus(payment.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
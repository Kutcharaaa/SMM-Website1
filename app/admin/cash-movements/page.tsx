"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type CashMovement = {
  id: string;
  cash_account_id: string;
  type: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  cash_accounts?: {
    name?: string;
  };
};

export default function AdminCashMovementsPage() {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [message, setMessage] = useState("");

  async function loadMovements() {
    const { data, error } = await supabase
      .from("cash_movements")
      .select(
        `
        *,
        cash_accounts (
          name
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMovements(data || []);
  }

  useEffect(() => {
    loadMovements();
  }, []);

  function getAmountStyle(amount: number) {
    return Number(amount) >= 0
      ? "text-green-400"
      : "text-red-400";
  }

  function getTypeLabel(type: string) {
    return type.replaceAll("_", " ");
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">
            Cash Movements
          </h2>

          <p className="text-zinc-400 mb-8">
            View every cash inflow and outflow across all business accounts.
          </p>

          {message && (
            <p className="text-sm text-blue-400 mb-4">
              {message}
            </p>
          )}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">Date</th>
                  <th className="text-left p-5">Cash Account</th>
                  <th className="text-left p-5">Type</th>
                  <th className="text-left p-5">Description</th>
                  <th className="text-left p-5">Amount</th>
                  <th className="text-left p-5">Reference</th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => (
                  <tr
                    key={movement.id}
                    className="border-t border-zinc-900"
                  >
                    <td className="p-5 text-zinc-500">
                      {new Date(
                        movement.created_at
                      ).toLocaleString()}
                    </td>

                    <td className="p-5 font-semibold">
                      {movement.cash_accounts?.name || "Unknown"}
                    </td>

                    <td className="p-5 text-zinc-400 capitalize">
                      {getTypeLabel(movement.type)}
                    </td>

                    <td className="p-5 text-zinc-300">
                      {movement.description || "-"}
                    </td>

                    <td
                      className={`p-5 font-bold ${getAmountStyle(
                        movement.amount
                      )}`}
                    >
                      {Number(movement.amount) >= 0 ? "+" : "-"}₱
                      {Math.abs(
                        Number(movement.amount || 0)
                      ).toFixed(2)}
                    </td>

                    <td className="p-5 text-zinc-500">
                      {movement.reference_type || "-"}
                    </td>
                  </tr>
                ))}

                {movements.length <= 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-10 text-center text-zinc-500"
                    >
                      No cash movements yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
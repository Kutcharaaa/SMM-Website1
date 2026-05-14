"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [stats, setStats] = useState({
    users: 0,
    pendingPayments: 0,
    activeOrders: 0,
    openTickets: 0,
    totalCash: 0,
    expenses: 0,
  });

  async function loadStats() {
    const { count: users } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: pendingPayments } = await supabase
      .from("deposits")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: activeOrders } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "processing", "partial"]);

    const { count: openTickets } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    const { data: cashAccounts } = await supabase
      .from("cash_accounts")
      .select("balance");

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount");

    setStats({
      users: users || 0,
      pendingPayments: pendingPayments || 0,
      activeOrders: activeOrders || 0,
      openTickets: openTickets || 0,
      totalCash:
        cashAccounts?.reduce(
          (sum, item) => sum + Number(item.balance || 0),
          0
        ) || 0,
      expenses:
        expenses?.reduce((sum, item) => sum + Number(item.amount || 0), 0) ||
        0,
    });
  }

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users },
    { label: "Pending Payments", value: stats.pendingPayments },
    { label: "Active Orders", value: stats.activeOrders },
    { label: "Open Tickets", value: stats.openTickets },
    { label: "Total Business Cash", value: `₱${stats.totalCash.toFixed(2)}` },
    { label: "Total Expenses", value: `₱${stats.expenses.toFixed(2)}` },
  ];

  return (
    <AdminLayout>
      <h2 className="text-4xl font-black mb-4">Admin Overview</h2>

      <p className="text-zinc-400 mb-8">
        Welcome to the Ascend Service administration panel.
      </p>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6"
          >
            <p className="text-sm text-zinc-500">{card.label}</p>
            <h3 className="text-3xl font-black mt-2">{card.value}</h3>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
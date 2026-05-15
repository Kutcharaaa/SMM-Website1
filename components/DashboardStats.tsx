"use client";

import { supabase } from "@/lib/supabase";
import {
  Wallet,
  BarChart3,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardStats() {
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  async function loadStats() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const userId = authData.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance,total_spent")
      .eq("id", userId)
      .single();

    setBalance(Number(profile?.balance || 0));
    setTotalSpent(Number(profile?.total_spent || 0));

    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    setTotalOrders(orderCount || 0);

    const { count: ticketCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "open");

    setOpenTickets(ticketCount || 0);
  }

  useEffect(() => {
    loadStats();

    const interval = setInterval(() => {
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: "Total Spent",
      value: `₱${totalSpent.toFixed(2)}`,
      subtitle: "Lifetime",
      icon: TrendingUp,
    },
    {
      title: "Available Balance",
      value: `₱${balance.toFixed(2)}`,
      subtitle: "Wallet",
      icon: Wallet,
    },
    {
      title: "Total Orders",
      value: String(totalOrders),
      subtitle: "All Time",
      icon: BarChart3,
    },
    {
      title: "Open Tickets",
      value: String(openTickets),
      subtitle: "Awaiting Reply",
      icon: Ticket,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {stat.title}
                </p>

                <h3 className="mt-4 text-3xl font-black text-slate-950">
                  {stat.value}
                </h3>

                <p className="mt-3 text-sm font-medium text-slate-400">
                  {stat.subtitle}
                </p>
              </div>

              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon size={23} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
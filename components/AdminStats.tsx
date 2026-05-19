"use client";

import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import { Wallet, BarChart3, Ticket, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardStats() {
  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  const { formatAmount } = useDisplayCurrency();

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
      value: formatAmount(totalSpent),
      subtitle: "Lifetime",
      icon: TrendingUp,
    },
    {
      title: "Available Balance",
      value: formatAmount(balance),
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
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6"
          >
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-500">
                  {stat.title}
                </p>

                <h3 className="mt-4 min-w-0 truncate text-2xl font-black text-slate-950 sm:text-3xl">
                  {stat.value}
                </h3>

                <p className="mt-3 truncate text-sm font-medium text-slate-400">
                  {stat.subtitle}
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:h-[52px] sm:w-[52px]">
                <Icon size={23} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
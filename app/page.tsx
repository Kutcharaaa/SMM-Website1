"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Profile = {
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  balance: number | null;
};

type Order = {
  id: string;
  status: string;
};

type Deposit = {
  id: string;
  status: string;
  amount: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    pendingDeposits: 0,
    totalDeposits: 0,
  });

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, firstname, lastname, balance")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    const { data: orders } = await supabase
      .from("orders")
      .select("id, status")
      .eq("user_id", user.id);

    const { data: deposits } = await supabase
      .from("deposits")
      .select("id, status, amount")
      .eq("user_id", user.id);

    const pendingOrders =
      orders?.filter((order) =>
        ["pending", "processing", "partial"].includes(order.status)
      ).length || 0;

    const completedOrders =
      orders?.filter((order) => order.status === "completed").length || 0;

    const pendingDeposits =
      deposits?.filter((deposit) => deposit.status === "pending").length || 0;

    const totalDeposits =
      deposits
        ?.filter((deposit) => deposit.status === "approved")
        .reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0) || 0;

    setStats({
      totalOrders: orders?.length || 0,
      pendingOrders,
      completedOrders,
      pendingDeposits,
      totalDeposits,
    });
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const displayName =
    profile?.firstname && profile?.lastname
      ? `${profile.firstname} ${profile.lastname}`
      : profile?.username || "User";

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="mb-8">
          <h2 className="text-4xl font-black">
            Welcome back, {displayName}
          </h2>

          <p className="text-zinc-400 mt-2">
            Manage your orders, wallet, deposits, and services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-zinc-500">Wallet Balance</p>

            <h3 className="text-3xl font-black mt-2 text-green-400">
              ₱{Number(profile?.balance || 0).toFixed(2)}
            </h3>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-zinc-500">Total Orders</p>

            <h3 className="text-3xl font-black mt-2">
              {stats.totalOrders}
            </h3>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-zinc-500">Pending Orders</p>

            <h3 className="text-3xl font-black mt-2 text-yellow-400">
              {stats.pendingOrders}
            </h3>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-zinc-500">Completed Orders</p>

            <h3 className="text-3xl font-black mt-2 text-blue-400">
              {stats.completedOrders}
            </h3>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-zinc-500">Approved Deposits</p>

            <h3 className="text-3xl font-black mt-2 text-purple-400">
              ₱{stats.totalDeposits.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h3 className="text-2xl font-black mb-6">Quick Actions</h3>

            <div className="grid gap-4">
              <a
                href="/dashboard/new-order"
                className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-5 py-4 font-semibold transition"
              >
                Create New Order
              </a>

              <a
                href="/dashboard/add-funds"
                className="border border-zinc-800 hover:border-blue-500 rounded-2xl px-5 py-4 font-semibold transition"
              >
                Add Funds
              </a>

              <a
                href="/dashboard/orders"
                className="border border-zinc-800 hover:border-blue-500 rounded-2xl px-5 py-4 font-semibold transition"
              >
                View Orders
              </a>

              <a
                href="/dashboard/tickets"
                className="border border-zinc-800 hover:border-blue-500 rounded-2xl px-5 py-4 font-semibold transition"
              >
                Support Tickets
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
            <h3 className="text-2xl font-black mb-6">Account Overview</h3>

            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <p className="text-zinc-500">Username</p>

                <p className="font-semibold">
                  {profile?.username || "-"}
                </p>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <p className="text-zinc-500">Pending Deposits</p>

                <p className="font-semibold text-yellow-400">
                  {stats.pendingDeposits}
                </p>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <p className="text-zinc-500">Completed Orders</p>

                <p className="font-semibold text-blue-400">
                  {stats.completedOrders}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-zinc-500">Current Balance</p>

                <p className="font-semibold text-green-400">
                  ₱{Number(profile?.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}
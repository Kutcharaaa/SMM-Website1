"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function WalletBalance() {
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState("starter");

  async function getBalance() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, plan")
      .eq("id", authData.user.id)
      .single();

    if (profile) {
      setBalance(profile.balance || 0);
      setPlan(profile.plan || "starter");
    }
  }

  useEffect(() => {
    getBalance();

    const interval = setInterval(() => {
      getBalance();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
      <p className="text-sm text-zinc-400">Current Balance</p>

      <h2 className="text-3xl font-black mt-2">
        ₱{Number(balance).toFixed(2)}
      </h2>

      <p className="text-xs text-blue-400 mt-2 mb-4 capitalize">
        {plan} Plan
      </p>

      <a
        href="/dashboard/add-funds"
        className="block text-center bg-blue-600 hover:bg-blue-700 rounded-xl py-3 text-sm font-semibold transition"
      >
        Add Funds
      </a>
    </div>
  );
}
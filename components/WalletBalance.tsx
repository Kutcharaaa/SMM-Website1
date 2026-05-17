"use client";

import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import { useEffect, useState } from "react";

type WalletBalanceProps = {
  compact?: boolean;
};

export default function WalletBalance({ compact = false }: WalletBalanceProps) {
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState("starter");

  const { formatAmount } = useDisplayCurrency();

  async function getBalance() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, plan")
      .eq("id", authData.user.id)
      .single();

    if (profile) {
      setBalance(Number(profile.balance || 0));
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

  if (compact) {
    return (
      <div>
        <h3 className="text-3xl font-black text-white">
          {formatAmount(balance)}
        </h3>

        <p className="mt-1 text-xs capitalize text-blue-100/70">
          {plan} Plan
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-5">
      <p className="text-sm text-zinc-400">Current Balance</p>

      <h2 className="mt-2 text-3xl font-black">
        {formatAmount(balance)}
      </h2>

      <p className="mb-4 mt-2 text-xs capitalize text-blue-400">
        {plan} Plan
      </p>

      <a
        href="/dashboard/add-funds"
        className="block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold transition hover:bg-blue-700"
      >
        Add Funds
      </a>
    </div>
  );
}
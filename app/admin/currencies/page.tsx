"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Currency = {
  id: string;
  currency_code: string;
  currency_name: string;
  is_enabled: boolean;
  market_rate: number;
  panel_rate: number;
  last_synced_at: string | null;
};

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [marginPercent, setMarginPercent] = useState("4");
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: currencyData } = await supabase
      .from("exchange_rates")
      .select("*")
      .order("currency_code");

    setCurrencies(currencyData || []);

    const { data: setting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "margin_percent")
      .single();

    if (setting?.value) {
      setMarginPercent(setting.value);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveMargin() {
    const { error } = await supabase
      .from("platform_settings")
      .update({ value: marginPercent })
      .eq("key", "margin_percent");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Margin saved.");
  }

  async function toggleCurrency(id: string, value: boolean) {
    const { error } = await supabase
      .from("exchange_rates")
      .update({ is_enabled: value })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    loadData();
  }

  async function syncRates() {
    setMessage("Syncing live exchange rates...");

    const res = await fetch("/api/sync-exchange-rates");
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Failed to sync rates.");
      return;
    }

    setMessage("Live exchange rates synced.");
    loadData();
  }

  return (
    <AdminGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">Currency Settings</h2>

        <p className="text-zinc-400 mb-8">
          Manage enabled currencies, margin percentage, and live exchange rates.
        </p>

        {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-5">
            <input
              type="number"
              placeholder="Margin %"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
            />

            <button
              onClick={saveMargin}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
            >
              Save Margin
            </button>

            <button
              onClick={syncRates}
              className="border border-zinc-800 hover:border-blue-500 rounded-xl px-5 py-3 font-semibold transition"
            >
              Sync Live Rates
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Currency</th>
                <th className="text-left p-5">Market Rate</th>
                <th className="text-left p-5">Panel Rate</th>
                <th className="text-left p-5">Last Sync</th>
                <th className="text-left p-5">Status</th>
              </tr>
            </thead>

            <tbody>
              {currencies.map((currency) => (
                <tr key={currency.id} className="border-t border-zinc-900">
                  <td className="p-5">
                    <p className="font-semibold">{currency.currency_code}</p>
                    <p className="text-xs text-zinc-500">
                      {currency.currency_name}
                    </p>
                  </td>

                  <td className="p-5 text-zinc-300">
                    ₱{Number(currency.market_rate || 0).toFixed(4)}
                  </td>

                  <td className="p-5 text-green-400 font-semibold">
                    ₱{Number(currency.panel_rate || 0).toFixed(4)}
                  </td>

                  <td className="p-5 text-zinc-500">
                    {currency.last_synced_at
                      ? new Date(currency.last_synced_at).toLocaleString()
                      : "Never"}
                  </td>

                  <td className="p-5">
                    {currency.currency_code === "PHP" ? (
                      <span className="rounded-full px-3 py-1 text-xs bg-blue-500/10 text-blue-400">
                        Base Currency
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          toggleCurrency(currency.id, !currency.is_enabled)
                        }
                        className={`rounded-full px-3 py-1 text-xs ${
                          currency.is_enabled
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {currency.is_enabled ? "Enabled" : "Disabled"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
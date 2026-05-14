"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type CashAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
};

export default function AdminCashAccountsPage() {
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("wallet");
  const [balance, setBalance] = useState("");
  const [message, setMessage] = useState("");

  async function loadAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setAccounts(data || []);
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function addAccount() {
    if (!name) {
      setMessage("Please enter account name.");
      return;
    }

    const { error } = await supabase.from("cash_accounts").insert({
      name,
      type,
      balance: Number(balance || 0),
      currency: "PHP",
      status: "active",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setName("");
    setType("wallet");
    setBalance("");
    setMessage("Cash account added.");
    loadAccounts();
  }

  async function deleteAccount(id: string) {
    const confirmDelete = confirm("Delete this cash account?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("cash_accounts").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Cash account deleted.");
    loadAccounts();
  }

  const totalCash = accounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <main className="min-h-screen bg-black text-white">
        <AdminSidebar />

        <section className="lg:ml-72 min-h-screen">
          <AdminTopbar />

          <div className="p-8">
            <h2 className="text-4xl font-black mb-4">Cash Accounts</h2>

            <p className="text-zinc-400 mb-8">
              Track money locations like GCash, Maya, bank accounts, and cash on
              hand.
            </p>

            {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-zinc-500 text-sm">Total Business Cash</p>
                <h3 className="text-4xl font-black mt-2 text-green-400">
                  ₱{totalCash.toFixed(2)}
                </h3>
              </div>

              <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-2xl font-black mb-5">Add Cash Account</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Example: GCash Main"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="wallet">Wallet</option>
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                    <option value="crypto">Crypto</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    type="number"
                    placeholder="Starting balance"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={addAccount}
                    className="md:col-span-3 bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
                  >
                    Add Cash Account
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/60 text-zinc-500">
                  <tr>
                    <th className="text-left p-5">Account</th>
                    <th className="text-left p-5">Type</th>
                    <th className="text-left p-5">Balance</th>
                    <th className="text-left p-5">Status</th>
                    <th className="text-left p-5">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="border-t border-zinc-900">
                      <td className="p-5 font-semibold">{account.name}</td>

                      <td className="p-5 text-zinc-400 capitalize">
                        {account.type}
                      </td>

                      <td className="p-5 text-green-400 font-bold">
                        ₱{Number(account.balance || 0).toFixed(2)}
                      </td>

                      <td className="p-5 text-zinc-400 capitalize">
                        {account.status}
                      </td>

                      <td className="p-5">
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {accounts.length <= 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-zinc-500">
                        No cash accounts yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </AdminGuard>
  );
}
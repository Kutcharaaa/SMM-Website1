"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type CashAccount = {
  id: string;
  name: string;
  balance: number;
};

type CashTransfer = {
  id: string;
  from_cash_account_id: string | null;
  to_cash_account_id: string | null;
  amount: number;
  note: string | null;
  transfer_date: string;
  created_at: string;
};

export default function AdminCashTransfersPage() {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transferDate, setTransferDate] = useState("");

  const [message, setMessage] = useState("");
  const [transferring, setTransferring] = useState(false);

  async function loadCashAccounts() {
    const { data, error } = await supabase
      .from("cash_accounts")
      .select("id, name, balance")
      .eq("status", "active")
      .order("name");

    if (error) {
      setMessage(error.message);
      return;
    }

    setCashAccounts(data || []);
  }

  async function loadTransfers() {
    const { data, error } = await supabase
      .from("cash_transfers")
      .select("*")
      .order("transfer_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTransfers(data || []);
  }

  useEffect(() => {
    setTransferDate(new Date().toISOString().slice(0, 10));
    loadCashAccounts();
    loadTransfers();
  }, []);

  function getCashAccountName(id: string | null) {
    if (!id) return "Unknown";

    return (
      cashAccounts.find((account) => account.id === id)?.name ||
      "Unknown"
    );
  }

  async function createTransfer() {
    if (transferring) return;

    if (!fromAccountId || !toAccountId || !amount) {
      setMessage("Please complete from account, to account, and amount.");
      return;
    }

    if (fromAccountId === toAccountId) {
      setMessage("From and To cash accounts must be different.");
      return;
    }

    const transferAmount = Number(amount || 0);

    if (transferAmount <= 0) {
      setMessage("Amount must be greater than 0.");
      return;
    }

    const fromAccount = cashAccounts.find(
      (account) => account.id === fromAccountId
    );

    const toAccount = cashAccounts.find(
      (account) => account.id === toAccountId
    );

    if (!fromAccount || !toAccount) {
      setMessage("Cash account not found.");
      return;
    }

    const fromBalance = Number(fromAccount.balance || 0);
    const toBalance = Number(toAccount.balance || 0);

    if (fromBalance < transferAmount) {
      setMessage("Not enough balance in the source cash account.");
      return;
    }

    setTransferring(true);
    setMessage("Processing cash transfer...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: createdTransfer, error: transferError } = await supabase
      .from("cash_transfers")
      .insert({
        from_cash_account_id: fromAccountId,
        to_cash_account_id: toAccountId,
        amount: transferAmount,
        note,
        created_by: user?.id,
        transfer_date:
          transferDate || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (transferError || !createdTransfer) {
      setMessage(transferError?.message || "Failed to create transfer.");
      setTransferring(false);
      return;
    }

    const { error: fromError } = await supabase
      .from("cash_accounts")
      .update({
        balance: fromBalance - transferAmount,
      })
      .eq("id", fromAccountId);

    if (fromError) {
      setMessage(fromError.message);
      setTransferring(false);
      return;
    }

    const { error: toError } = await supabase
      .from("cash_accounts")
      .update({
        balance: toBalance + transferAmount,
      })
      .eq("id", toAccountId);

    if (toError) {
      setMessage(toError.message);
      setTransferring(false);
      return;
    }

    await supabase.from("cash_movements").insert([
      {
        cash_account_id: fromAccountId,
        type: "cash_transfer_out",
        amount: -transferAmount,
        description: `Transfer to ${toAccount.name}`,
        reference_type: "cash_transfer",
        reference_id: createdTransfer.id,
        created_by: user?.id,
      },
      {
        cash_account_id: toAccountId,
        type: "cash_transfer_in",
        amount: transferAmount,
        description: `Transfer from ${fromAccount.name}`,
        reference_type: "cash_transfer",
        reference_id: createdTransfer.id,
        created_by: user?.id,
      },
    ]);

    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setNote("");
    setMessage("Cash transfer completed successfully.");
    setTransferring(false);

    loadCashAccounts();
    loadTransfers();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Cash Transfers</h2>

          <p className="text-zinc-400 mb-8">
            Move money between business wallets/accounts while keeping a clean
            accounting trail.
          </p>

          {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
              <p className="text-zinc-500 text-sm">Total Transfers</p>

              <h3 className="text-4xl font-black mt-2 text-blue-400">
                {transfers.length}
              </h3>
            </div>

            <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
              <h3 className="text-2xl font-black mb-5">
                New Cash Transfer
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">From cash account</option>

                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} — ₱
                      {Number(account.balance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>

                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">To cash account</option>

                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} — ₱
                      {Number(account.balance || 0).toFixed(2)}
                    </option>
                  ))}
                </select>

                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  placeholder="Amount"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  type="date"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note"
                  rows={3}
                  className="md:col-span-2 bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
                />

                <button
                  onClick={createTransfer}
                  disabled={transferring}
                  className="md:col-span-2 bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {transferring ? "Transferring..." : "Create Transfer"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">Date</th>
                  <th className="text-left p-5">From</th>
                  <th className="text-left p-5">To</th>
                  <th className="text-left p-5">Amount</th>
                  <th className="text-left p-5">Note</th>
                </tr>
              </thead>

              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-t border-zinc-900">
                    <td className="p-5 text-zinc-500">
                      {transfer.transfer_date}
                    </td>

                    <td className="p-5 text-red-400">
                      {getCashAccountName(transfer.from_cash_account_id)}
                    </td>

                    <td className="p-5 text-green-400">
                      {getCashAccountName(transfer.to_cash_account_id)}
                    </td>

                    <td className="p-5 text-blue-400 font-bold">
                      ₱{Number(transfer.amount || 0).toFixed(2)}
                    </td>

                    <td className="p-5 text-zinc-500">
                      {transfer.note || "-"}
                    </td>
                  </tr>
                ))}

                {transfers.length <= 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-zinc-500">
                      No cash transfers recorded yet.
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
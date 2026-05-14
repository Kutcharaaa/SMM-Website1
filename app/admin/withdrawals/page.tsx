"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type CashAccount = {
  id: string;
  name: string;
  balance: number;
};

type Withdrawal = {
  id: string;
  title: string;
  amount: number;
  note: string | null;
  cash_account_id: string | null;
  withdrawal_date: string;
  created_at: string;
};

export default function AdminWithdrawalsPage() {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const [title, setTitle] = useState("Owner Draw");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState("");

  const [message, setMessage] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

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

  async function loadWithdrawals() {
    const { data, error } = await supabase
      .from("owner_withdrawals")
      .select("*")
      .order("withdrawal_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setWithdrawals(data || []);
  }

  useEffect(() => {
    setWithdrawalDate(new Date().toISOString().slice(0, 10));
    loadCashAccounts();
    loadWithdrawals();
  }, []);

  function getCashAccountName(id: string | null) {
    if (!id) return "Not selected";

    return (
      cashAccounts.find((account) => account.id === id)?.name ||
      "Unknown account"
    );
  }

  const totalWithdrawn = withdrawals.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  async function addWithdrawal() {
    if (withdrawing) return;

    if (!title || !amount || !cashAccountId) {
      setMessage("Please complete title, amount, and cash account.");
      return;
    }

    const withdrawalAmount = Number(amount || 0);

    if (withdrawalAmount <= 0) {
      setMessage("Amount must be greater than 0.");
      return;
    }

    const selectedCashAccount = cashAccounts.find(
      (account) => account.id === cashAccountId
    );

    if (!selectedCashAccount) {
      setMessage("Selected cash account not found.");
      return;
    }

    const currentBalance = Number(selectedCashAccount.balance || 0);

    if (currentBalance < withdrawalAmount) {
      setMessage("Not enough balance in selected cash account.");
      return;
    }

    setWithdrawing(true);
    setMessage("Recording owner withdrawal...");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: createdWithdrawal, error: withdrawalError } = await supabase
      .from("owner_withdrawals")
      .insert({
        title,
        amount: withdrawalAmount,
        note,
        cash_account_id: cashAccountId,
        withdrawn_by: user?.id,
        withdrawal_date:
          withdrawalDate || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (withdrawalError || !createdWithdrawal) {
      setMessage(withdrawalError?.message || "Failed to record withdrawal.");
      setWithdrawing(false);
      return;
    }

    const newBalance = currentBalance - withdrawalAmount;

    const { error: cashError } = await supabase
      .from("cash_accounts")
      .update({
        balance: newBalance,
      })
      .eq("id", cashAccountId);

    if (cashError) {
      setMessage(cashError.message);
      setWithdrawing(false);
      return;
    }

    await supabase.from("cash_movements").insert({
      cash_account_id: cashAccountId,
      type: "owner_withdrawal",
      amount: -withdrawalAmount,
      description: `Owner withdrawal: ${title}`,
      reference_type: "owner_withdrawal",
      reference_id: createdWithdrawal.id,
      created_by: user?.id,
    });

    setTitle("Owner Draw");
    setAmount("");
    setNote("");
    setCashAccountId("");
    setMessage("Owner withdrawal recorded and cash account deducted.");
    setWithdrawing(false);

    loadCashAccounts();
    loadWithdrawals();
  }

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <main className="min-h-screen bg-black text-white">
        <AdminSidebar />

        <section className="lg:ml-72 min-h-screen">
          <AdminTopbar />

          <div className="p-8">
            <h2 className="text-4xl font-black mb-4">Owner Withdrawals</h2>

            <p className="text-zinc-400 mb-8">
              Track money you personally take from business profit and deduct it
              from the correct cash account.
            </p>

            {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-zinc-500 text-sm">Total Withdrawn</p>

                <h3 className="text-4xl font-black mt-2 text-purple-400">
                  ₱{totalWithdrawn.toFixed(2)}
                </h3>
              </div>

              <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-2xl font-black mb-5">
                  Add Owner Withdrawal
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Example: Owner Draw"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    placeholder="Amount"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <select
                    value={cashAccountId}
                    onChange={(e) => setCashAccountId(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Withdraw from cash account</option>

                    {cashAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} — ₱
                        {Number(account.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <input
                    value={withdrawalDate}
                    onChange={(e) => setWithdrawalDate(e.target.value)}
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
                    onClick={addWithdrawal}
                    disabled={withdrawing}
                    className="md:col-span-2 bg-purple-600 hover:bg-purple-700 rounded-xl py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawing ? "Recording..." : "Record Withdrawal"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/60 text-zinc-500">
                  <tr>
                    <th className="text-left p-5">Date</th>
                    <th className="text-left p-5">Title</th>
                    <th className="text-left p-5">Cash Account</th>
                    <th className="text-left p-5">Amount</th>
                    <th className="text-left p-5">Note</th>
                  </tr>
                </thead>

                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-t border-zinc-900">
                      <td className="p-5 text-zinc-500">
                        {withdrawal.withdrawal_date}
                      </td>

                      <td className="p-5 font-semibold">{withdrawal.title}</td>

                      <td className="p-5 text-blue-400">
                        {getCashAccountName(withdrawal.cash_account_id)}
                      </td>

                      <td className="p-5 text-purple-400 font-bold">
                        ₱{Number(withdrawal.amount || 0).toFixed(2)}
                      </td>

                      <td className="p-5 text-zinc-500">
                        {withdrawal.note || "-"}
                      </td>
                    </tr>
                  ))}

                  {withdrawals.length <= 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-zinc-500">
                        No owner withdrawals recorded yet.
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
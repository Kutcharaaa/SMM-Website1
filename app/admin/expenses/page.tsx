"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  note: string | null;
  cash_account_id: string | null;
  expense_date: string;
  created_at: string;
};

type CashAccount = {
  id: string;
  name: string;
  balance: number;
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [cashAccountId, setCashAccountId] = useState("");

  const [message, setMessage] = useState("");

  async function loadExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setExpenses(data || []);
  }

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

  useEffect(() => {
    setExpenseDate(new Date().toISOString().slice(0, 10));
    loadExpenses();
    loadCashAccounts();
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  function getCashAccountName(id: string | null) {
    if (!id) return "Not selected";

    return (
      cashAccounts.find((account) => account.id === id)?.name ||
      "Unknown account"
    );
  }

  async function addExpense() {
    if (!title || !amount) {
      setMessage("Please enter title and amount.");
      return;
    }

    if (!cashAccountId) {
      setMessage("Please select which cash account paid this expense.");
      return;
    }

    const expenseAmount = Number(amount || 0);

    if (expenseAmount <= 0) {
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

    if (currentBalance < expenseAmount) {
      setMessage("Not enough balance in selected cash account.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: createdExpense, error: expenseError } = await supabase
      .from("expenses")
      .insert({
        title,
        category,
        amount: expenseAmount,
        currency: "PHP",
        note,
        cash_account_id: cashAccountId,
        expense_date: expenseDate || new Date().toISOString().slice(0, 10),
        created_by: user?.id,
      })
      .select()
      .single();

    if (expenseError || !createdExpense) {
      setMessage(expenseError?.message || "Failed to add expense.");
      return;
    }

    const newBalance = currentBalance - expenseAmount;

    const { error: cashError } = await supabase
      .from("cash_accounts")
      .update({
        balance: newBalance,
      })
      .eq("id", cashAccountId);

    if (cashError) {
      setMessage(cashError.message);
      return;
    }

    await supabase.from("cash_movements").insert({
      cash_account_id: cashAccountId,
      type: "expense",
      amount: -expenseAmount,
      description: `Expense: ${title}`,
      reference_type: "expense",
      reference_id: createdExpense.id,
      created_by: user?.id,
    });

    setTitle("");
    setCategory("general");
    setAmount("");
    setNote("");
    setCashAccountId("");

    setMessage("Expense added and cash account balance deducted.");

    loadExpenses();
    loadCashAccounts();
  }

  async function deleteExpense(expense: Expense) {
    const confirmDelete = confirm(
      "Delete this expense? This will NOT automatically return the money to the cash account yet."
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expense.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Expense deleted.");
    loadExpenses();
  }

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <main className="min-h-screen bg-black text-white">
        <AdminSidebar />

        <section className="lg:ml-72 min-h-screen">
          <AdminTopbar />

          <div className="p-8">
            <h2 className="text-4xl font-black mb-4">Expenses</h2>

            <p className="text-zinc-400 mb-8">
              Track business costs, select which cash account paid them, and keep
              your balances accurate.
            </p>

            {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-zinc-500 text-sm">Total Expenses</p>

                <h3 className="text-4xl font-black mt-2 text-red-400">
                  ₱{totalExpenses.toFixed(2)}
                </h3>
              </div>

              <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h3 className="text-2xl font-black mb-5">Add Expense</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Expense title"
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
                    <option value="">Paid from cash account</option>

                    {cashAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} — ₱
                        {Number(account.balance || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="provider">Provider Balance</option>
                    <option value="domain">Domain</option>
                    <option value="hosting">Hosting</option>
                    <option value="ads">Ads / Marketing</option>
                    <option value="tools">Tools / Software</option>
                    <option value="design">Design</option>
                    <option value="development">Development</option>
                  </select>

                  <input
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    type="date"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note"
                    rows={3}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
                  />

                  <button
                    onClick={addExpense}
                    className="md:col-span-2 bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition"
                  >
                    Add Expense
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
                    <th className="text-left p-5">Category</th>
                    <th className="text-left p-5">Paid From</th>
                    <th className="text-left p-5">Amount</th>
                    <th className="text-left p-5">Note</th>
                    <th className="text-left p-5">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-zinc-900">
                      <td className="p-5 text-zinc-500">
                        {expense.expense_date}
                      </td>

                      <td className="p-5 font-semibold">{expense.title}</td>

                      <td className="p-5 text-zinc-400 capitalize">
                        {expense.category}
                      </td>

                      <td className="p-5 text-blue-400">
                        {getCashAccountName(expense.cash_account_id)}
                      </td>

                      <td className="p-5 text-red-400 font-bold">
                        ₱{Number(expense.amount || 0).toFixed(2)}
                      </td>

                      <td className="p-5 text-zinc-500">
                        {expense.note || "-"}
                      </td>

                      <td className="p-5">
                        <button
                          onClick={() => deleteExpense(expense)}
                          className="text-red-400 hover:text-red-300 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {expenses.length <= 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-zinc-500">
                        No expenses recorded yet.
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
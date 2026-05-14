"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  note: string | null;
  expense_date: string;
  created_at: string;
};

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
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

  useEffect(() => {
    setExpenseDate(new Date().toISOString().slice(0, 10));
    loadExpenses();
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  async function addExpense() {
    if (!title || !amount) {
      setMessage("Please enter title and amount.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    const { error } = await supabase.from("expenses").insert({
      title,
      category,
      amount: Number(amount),
      currency: "PHP",
      note,
      expense_date: expenseDate || new Date().toISOString().slice(0, 10),
      created_by: authData.user?.id,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle("");
    setCategory("general");
    setAmount("");
    setNote("");
    setMessage("Expense added successfully.");
    loadExpenses();
  }

  async function deleteExpense(id: string) {
    const confirmDelete = confirm("Delete this expense?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Expense deleted.");
    loadExpenses();
  }

  return (
    <AdminLayout>
      <h2 className="text-4xl font-black mb-4">Expenses</h2>

      <p className="text-zinc-400 mb-8">
        Track business costs, subscriptions, provider expenses, ads, and other
        operating expenses.
      </p>

      {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
          <p className="text-zinc-500 text-sm">Total Expenses</p>
          <h3 className="text-4xl font-black mt-2">
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
              className="md:col-span-2 bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
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

                <td className="p-5 text-red-400 font-bold">
                  ₱{Number(expense.amount || 0).toFixed(2)}
                </td>

                <td className="p-5 text-zinc-500">{expense.note || "-"}</td>

                <td className="p-5">
                  <button
                    onClick={() => deleteExpense(expense.id)}
                    className="text-red-400 hover:text-red-300 font-semibold"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {expenses.length <= 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-zinc-500">
                  No expenses recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout
  );
}
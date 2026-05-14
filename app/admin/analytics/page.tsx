"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Order = {
  id: string;
  price: number;
  provider_cost: number;
  profit: number;
  status: string;
  service_name: string;
  created_at: string;
};

type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
};

type CashAccount = {
  id: string;
  name: string;
  balance: number;
  type: string;
  status: string;
};

export default function AdminAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [message, setMessage] = useState("");

  async function loadData() {
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, price, provider_cost, profit, status, service_name, created_at")
      .order("created_at", { ascending: false });

    if (orderError) {
      setMessage(orderError.message);
      return;
    }

    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (expenseError) {
      setMessage(expenseError.message);
      return;
    }

    const { data: cashData, error: cashError } = await supabase
      .from("cash_accounts")
      .select("id, name, balance, type, status")
      .order("name");

    if (cashError) {
      setMessage(cashError.message);
      return;
    }

    setOrders(orderData || []);
    setExpenses(expenseData || []);
    setCashAccounts(cashData || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalBusinessMoney = cashAccounts.reduce(
    (sum, account) => sum + Number(account.balance || 0),
    0
  );

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.price || 0),
    0
  );

  const totalProviderCost = orders.reduce(
    (sum, order) => sum + Number(order.provider_cost || 0),
    0
  );

  const grossProfit = orders.reduce(
    (sum, order) =>
      sum +
      Number(
        order.profit ||
          Number(order.price || 0) - Number(order.provider_cost || 0)
      ),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const netProfit = grossProfit - totalExpenses;

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const pendingOrders = orders.filter((order) =>
    ["pending", "processing", "partial"].includes(order.status)
  ).length;

  const estimatedProfitFrom30PercentMargin = totalRevenue * 0.3;

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <main className="min-h-screen bg-black text-white">
        <AdminSidebar />

        <section className="lg:ml-72 min-h-screen">
          <AdminTopbar />

          <div className="p-8">
            <h2 className="text-4xl font-black mb-4">Analytics</h2>

            <p className="text-zinc-400 mb-8">
              Track cash, revenue, provider costs, expenses, owner-ready profit,
              and estimated earnings.
            </p>

            {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Total Business Money</p>
                <h3 className="text-3xl font-black mt-2 text-green-400">
                  ₱{totalBusinessMoney.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Order Revenue</p>
                <h3 className="text-3xl font-black mt-2 text-green-400">
                  ₱{totalRevenue.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Provider Cost</p>
                <h3 className="text-3xl font-black mt-2 text-red-400">
                  ₱{totalProviderCost.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Gross Profit</p>
                <h3 className="text-3xl font-black mt-2 text-blue-400">
                  ₱{grossProfit.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Net Profit</p>
                <h3
                  className={`text-3xl font-black mt-2 ${
                    netProfit >= 0 ? "text-purple-400" : "text-red-400"
                  }`}
                >
                  ₱{netProfit.toFixed(2)}
                </h3>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Estimated Profit 30%</p>
                <h3 className="text-3xl font-black mt-2 text-yellow-400">
                  ₱{estimatedProfitFrom30PercentMargin.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Total Expenses</p>
                <h3 className="text-3xl font-black mt-2 text-red-400">
                  ₱{totalExpenses.toFixed(2)}
                </h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Total Orders</p>
                <h3 className="text-3xl font-black mt-2">{orders.length}</h3>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Active Orders</p>
                <h3 className="text-3xl font-black mt-2 text-yellow-400">
                  {pendingOrders}
                </h3>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <p className="text-sm text-zinc-500">Completed Orders</p>
                <h3 className="text-3xl font-black mt-2 text-green-400">
                  {completedOrders}
                </h3>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-8 mb-8">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h3 className="text-2xl font-black">Cash Accounts</h3>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-black/60 text-zinc-500">
                    <tr>
                      <th className="text-left p-5">Account</th>
                      <th className="text-left p-5">Balance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cashAccounts.map((account) => (
                      <tr key={account.id} className="border-t border-zinc-900">
                        <td className="p-5">
                          <p className="font-semibold">{account.name}</p>
                          <p className="text-xs text-zinc-500 capitalize">
                            {account.type}
                          </p>
                        </td>

                        <td className="p-5 text-green-400 font-bold">
                          ₱{Number(account.balance || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {cashAccounts.length <= 0 && (
                      <tr>
                        <td colSpan={2} className="p-10 text-center text-zinc-500">
                          No cash accounts yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="xl:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h3 className="text-2xl font-black">Recent Orders</h3>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-black/60 text-zinc-500">
                    <tr>
                      <th className="text-left p-5">Service</th>
                      <th className="text-left p-5">Revenue</th>
                      <th className="text-left p-5">Profit</th>
                      <th className="text-left p-5">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.slice(0, 8).map((order) => {
                      const orderProfit =
                        Number(order.profit || 0) ||
                        Number(order.price || 0) -
                          Number(order.provider_cost || 0);

                      return (
                        <tr key={order.id} className="border-t border-zinc-900">
                          <td className="p-5 text-zinc-300">
                            {order.service_name}
                          </td>

                          <td className="p-5 text-green-400 font-semibold">
                            ₱{Number(order.price || 0).toFixed(2)}
                          </td>

                          <td className="p-5 text-blue-400 font-semibold">
                            ₱{orderProfit.toFixed(2)}
                          </td>

                          <td className="p-5 text-zinc-400 capitalize">
                            {order.status}
                          </td>
                        </tr>
                      );
                    })}

                    {orders.length <= 0 && (
                      <tr>
                        <td colSpan={4} className="p-10 text-center text-zinc-500">
                          No orders yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
              <div className="p-6 border-b border-zinc-800">
                <h3 className="text-2xl font-black">Recent Expenses</h3>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-black/60 text-zinc-500">
                  <tr>
                    <th className="text-left p-5">Title</th>
                    <th className="text-left p-5">Category</th>
                    <th className="text-left p-5">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.slice(0, 8).map((expense) => (
                    <tr key={expense.id} className="border-t border-zinc-900">
                      <td className="p-5 text-zinc-300">{expense.title}</td>

                      <td className="p-5 text-zinc-400 capitalize">
                        {expense.category}
                      </td>

                      <td className="p-5 text-red-400 font-semibold">
                        ₱{Number(expense.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {expenses.length <= 0 && (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-zinc-500">
                        No expenses yet.
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
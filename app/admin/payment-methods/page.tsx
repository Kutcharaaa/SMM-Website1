"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type PaymentMethod = {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  qr_url: string;
  is_active: boolean;
  cash_account_id: string | null;
  created_at: string;
};

type CashAccount = {
  id: string;
  name: string;
};

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );

  const [name, setName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [instructions, setInstructions] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [cashAccountId, setCashAccountId] = useState("");

  async function loadMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMethods(data || []);
  }

  async function loadCashAccounts() {
    const { data } = await supabase
      .from("cash_accounts")
      .select("id, name")
      .order("name");

    setCashAccounts(data || []);
  }

  useEffect(() => {
    loadMethods();
    loadCashAccounts();
  }, []);

  function resetForm() {
    setName("");
    setAccountName("");
    setAccountNumber("");
    setInstructions("");
    setQrUrl("");
    setIsActive(true);
    setCashAccountId("");
  }

  function openAddModal() {
    resetForm();
    setSelectedMethod(null);
    setShowModal(true);
  }

  function openManage(method: PaymentMethod) {
    setSelectedMethod(method);
    setName(method.name || "");
    setAccountName(method.account_name || "");
    setAccountNumber(method.account_number || "");
    setInstructions(method.instructions || "");
    setQrUrl(method.qr_url || "");
    setIsActive(method.is_active);
    setCashAccountId(method.cash_account_id || "");
    setShowModal(true);
  }

  async function addMethod() {
    if (!name) {
      setMessage("Method name is required.");
      return;
    }

    const { error } = await supabase.from("payment_methods").insert({
      name,
      account_name: accountName,
      account_number: accountNumber,
      instructions,
      qr_url: qrUrl,
      is_active: true,
      cash_account_id: cashAccountId || null,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Payment method added successfully.");
    resetForm();
    setShowModal(false);
    loadMethods();
  }

  async function updateMethod() {
    if (!selectedMethod) return;

    const { error } = await supabase
      .from("payment_methods")
      .update({
        name,
        account_name: accountName,
        account_number: accountNumber,
        instructions,
        qr_url: qrUrl,
        is_active: isActive,
        cash_account_id: cashAccountId || null,
      })
      .eq("id", selectedMethod.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Payment method updated.");
    setSelectedMethod(null);
    resetForm();
    setShowModal(false);
    loadMethods();
  }

  async function deleteMethod() {
    if (!selectedMethod) return;

    const confirmDelete = confirm(
      `Delete "${selectedMethod.name}" payment method?`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", selectedMethod.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Payment method deleted.");
    setSelectedMethod(null);
    resetForm();
    setShowModal(false);
    loadMethods();
  }

  function getCashAccountName(id: string | null) {
    if (!id) return "Not linked";

    return (
      cashAccounts.find((account) => account.id === id)?.name || "Not linked"
    );
  }

  return (
    <AdminGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <h2 className="text-4xl font-black mb-4">Payment Methods</h2>

        <p className="text-zinc-400 mb-8">
          Manage deposit methods, QR codes, account details, payment
          instructions, and linked cash accounts.
        </p>

        {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 mb-8">
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
          >
            Add Payment Method
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/60 text-zinc-500">
              <tr>
                <th className="text-left p-5">Method</th>
                <th className="text-left p-5">Account Name</th>
                <th className="text-left p-5">Account Number</th>
                <th className="text-left p-5">Cash Account</th>
                <th className="text-left p-5">Status</th>
                <th className="text-left p-5">Action</th>
              </tr>
            </thead>

            <tbody>
              {methods.map((method) => (
                <tr key={method.id} className="border-t border-zinc-900">
                  <td className="p-5 font-semibold">{method.name}</td>

                  <td className="p-5 text-zinc-400">
                    {method.account_name || "-"}
                  </td>

                  <td className="p-5 text-zinc-400">
                    {method.account_number || "-"}
                  </td>

                  <td className="p-5 text-blue-400">
                    {getCashAccountName(method.cash_account_id)}
                  </td>

                  <td className="p-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        method.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {method.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="p-5">
                    <button
                      onClick={() => openManage(method)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}

              {methods.length <= 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-zinc-500">
                    No payment methods yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black">
                    {selectedMethod ? "Manage Payment Method" : "Add Payment Method"}
                  </h3>

                  <p className="text-sm text-zinc-500">
                    Link this payment method to a real cash account.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethod(null);
                    resetForm();
                  }}
                  className="text-zinc-500 hover:text-white text-xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Method Name"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <select
                  value={cashAccountId}
                  onChange={(e) => setCashAccountId(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="">Select Cash Account</option>

                  {cashAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>

                <input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Account Name"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                  placeholder="QR Image URL"
                  className="md:col-span-2 bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Payment instructions"
                  rows={5}
                  className="md:col-span-2 bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
                />

                {selectedMethod && (
                  <label className="md:col-span-2 flex items-center gap-3 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-5 h-5 accent-blue-500"
                    />
                    Active payment method
                  </label>
                )}
              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                {selectedMethod && (
                  <button
                    onClick={deleteMethod}
                    className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition"
                  >
                    Delete
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedMethod(null);
                    resetForm();
                  }}
                  className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
                >
                  Cancel
                </button>

                <button
                  onClick={selectedMethod ? updateMethod : addMethod}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
                >
                  {selectedMethod ? "Save Changes" : "Add Method"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
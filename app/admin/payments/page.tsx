"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  conversion_rate: number;
  wallet_credit: number;
  method: string;
  reference_number: string;
  proof_url: string;
  status: string;
  reject_reason?: string | null;
  created_at: string;
};

type Profile = {
  balance: number;
};

export default function AdminPaymentsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");

  async function loadDeposits() {
    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setDeposits(data || []);
  }

  useEffect(() => {
    loadDeposits();

    const interval = setInterval(() => {
      loadDeposits();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function getStatusStyle(status: string) {
    if (status === "approved") return "bg-green-500/10 text-green-400";
    if (status === "rejected") return "bg-red-500/10 text-red-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  async function getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (error) {
      setMessage(error.message);
      return null;
    }

    return data as Profile;
  }

  async function sendDepositEmail(depositId: string, status: "approved" | "rejected") {
    await fetch("/api/email/deposit-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositId,
        status,
      }),
    });
  }

  async function approveDeposit(deposit: Deposit) {
    try {
      if (deposit.status === "approved") {
        setMessage("Deposit already approved.");
        return;
      }

      const amount = Number(deposit.amount || 0);

      if (amount <= 0) {
        setMessage("Invalid deposit amount.");
        return;
      }

      const { data: paymentMethod } = await supabase
        .from("payment_methods")
        .select("cash_account_id")
        .eq("name", deposit.method)
        .single();

      let cashAccountId: string | null = null;

      if (paymentMethod?.cash_account_id) {
        cashAccountId = paymentMethod.cash_account_id;

        const { data: cashAccount } = await supabase
          .from("cash_accounts")
          .select("balance")
          .eq("id", cashAccountId)
          .single();

        const currentBalance = Number(
          cashAccount?.balance || 0
        );

        const newBalance = currentBalance + amount;

        await supabase
          .from("cash_accounts")
          .update({
            balance: newBalance,
          })
          .eq("id", cashAccountId);

        await supabase.from("cash_movements").insert({
          cash_account_id: cashAccountId,
          type: "deposit",
          amount: amount,
          description: `Deposit approved (${deposit.method})`,
          reference_type: "deposit",
          reference_id: deposit.id,
        });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", deposit.user_id)
        .single();

      const currentBalance = Number(profile?.balance || 0);

      const newBalance = currentBalance + amount;

      await supabase
        .from("profiles")
        .update({
          balance: newBalance,
        })
        .eq("id", deposit.user_id);

      await supabase
        .from("deposits")
        .update({
          status: "approved",
          cash_account_id: cashAccountId,
        })
        .eq("id", deposit.id);

      setMessage(
        "Deposit approved and cash account updated."
      );

      setSelectedDeposit(null);
setRejectReason("");

      loadDeposits();
    } catch {
      setMessage("Failed to approve deposit.");
    }
  }

  async function rejectDeposit() {
    if (!selectedDeposit) return;

    if (!rejectReason.trim()) {
      setMessage("Please enter a rejection reason.");
      return;
    }

    const confirmReject = confirm("Reject this deposit request?");
    if (!confirmReject) return;

    setMessage("Rejecting deposit...");

    const { error: depositError } = await supabase
      .from("deposits")
      .update({
        status: "rejected",
        reject_reason: rejectReason,
      })
      .eq("id", selectedDeposit.id);

    if (depositError) {
      setMessage(depositError.message);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: selectedDeposit.user_id,
      title: "Deposit Rejected",
      message: `Your deposit request was rejected. Reason: ${rejectReason}`,
      type: "deposit_rejected",
      is_read: false,
    });

    await sendDepositEmail(selectedDeposit.id, "rejected");

    setMessage("Deposit rejected successfully.");
    setSelectedDeposit(null);
    setShowRejectBox(false);
    setRejectReason("");
    loadDeposits();
  }

  return (
    <AdminLayout>
      <h2 className="text-4xl font-black mb-4">Payments</h2>

      <p className="text-zinc-400 mb-8">
        Review manual deposit requests, verify proof, and approve wallet
        balance.
      </p>

      {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-black/60 text-zinc-500">
            <tr>
              <th className="text-left p-5">Paid Amount</th>
              <th className="text-left p-5">Wallet Credit</th>
              <th className="text-left p-5">Method</th>
              <th className="text-left p-5">Reference</th>
              <th className="text-left p-5">Status</th>
              <th className="text-left p-5">Date</th>
              <th className="text-left p-5">Action</th>
            </tr>
          </thead>

          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="border-t border-zinc-900">
                <td className="p-5 text-blue-400 font-semibold">
                  {deposit.currency || "PHP"}{" "}
                  {Number(deposit.amount || 0).toFixed(2)}
                </td>

                <td className="p-5 text-green-400 font-semibold">
                  ₱
                  {Number(
                    deposit.wallet_credit || deposit.amount || 0
                  ).toFixed(2)}
                </td>

                <td className="p-5 text-zinc-300">{deposit.method}</td>

                <td className="p-5 text-zinc-400">
                  {deposit.reference_number}
                </td>

                <td className="p-5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                      deposit.status
                    )}`}
                  >
                    {deposit.status}
                  </span>
                </td>

                <td className="p-5 text-zinc-500">
                  {new Date(deposit.created_at).toLocaleString()}
                </td>

                <td className="p-5">
                  <button
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setShowRejectBox(false);
                      setRejectReason("");
                      setMessage("");
                    }}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}

            {deposits.length <= 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-zinc-500">
                  No deposit requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">Review Deposit</h3>
                <p className="text-sm text-zinc-500">
                  Verify payment details before approving or rejecting.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedDeposit(null);
                  setShowRejectBox(false);
                  setRejectReason("");
                }}
                className="text-zinc-500 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 p-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-zinc-500">Paid Amount</p>
                  <p className="text-3xl font-black text-blue-400">
                    {selectedDeposit.currency || "PHP"}{" "}
                    {Number(selectedDeposit.amount || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Wallet Credit</p>
                  <p className="text-3xl font-black text-green-400">
                    ₱
                    {Number(
                      selectedDeposit.wallet_credit ||
                      selectedDeposit.amount ||
                      0
                    ).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Conversion Rate</p>
                  <p className="font-semibold">
                    1 {selectedDeposit.currency || "PHP"} = ₱
                    {Number(selectedDeposit.conversion_rate || 1).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">User ID</p>
                  <p className="text-sm text-zinc-300 break-all">
                    {selectedDeposit.user_id}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Payment Method</p>
                  <p className="font-semibold">{selectedDeposit.method}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Reference Number</p>
                  <p className="font-semibold">
                    {selectedDeposit.reference_number}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Status</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                      selectedDeposit.status
                    )}`}
                  >
                    {selectedDeposit.status}
                  </span>
                </div>

                {selectedDeposit.reject_reason && (
                  <div>
                    <p className="text-sm text-zinc-500">Reject Reason</p>
                    <p className="text-red-400">
                      {selectedDeposit.reject_reason}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-zinc-500">Submitted</p>
                  <p className="text-zinc-300">
                    {new Date(selectedDeposit.created_at).toLocaleString()}
                  </p>
                </div>

                {showRejectBox && (
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">
                      Rejection Reason
                    </label>

                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Example: Invalid reference number, wrong amount, unclear proof..."
                      rows={4}
                      className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-red-500 resize-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-zinc-500 mb-3">Payment Proof</p>

                <a href={selectedDeposit.proof_url} target="_blank">
                  <img
                    src={selectedDeposit.proof_url}
                    alt="Payment proof"
                    className="w-full max-h-[470px] object-contain rounded-2xl border border-zinc-800 bg-black"
                  />
                </a>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedDeposit(null);
                  setShowRejectBox(false);
                  setRejectReason("");
                }}
                className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
              >
                Close
              </button>

              {selectedDeposit.status === "pending" && (
                <>
                  {!showRejectBox ? (
                    <button
                      onClick={() => setShowRejectBox(true)}
                      className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={rejectDeposit}
                      className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition"
                    >
                      Confirm Reject
                    </button>
                  )}

                  <button
                    onClick={() => approveDeposit(selectedDeposit)}
                    className="bg-green-600 hover:bg-green-700 rounded-xl px-5 py-3 font-semibold transition"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
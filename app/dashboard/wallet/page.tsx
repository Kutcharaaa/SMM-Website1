"use client";

import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  wallet_credit: number;
  conversion_rate: number;
  method: string;
  reference_number: string;
  proof_url: string;
  status: string;
  reject_reason?: string | null;
  created_at: string;
  last_followup_at?: string | null;
  followup_count?: number;
};

type Profile = {
  balance: number;
  plan: string;
};

export default function WalletPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [message, setMessage] = useState("");

  async function loadWallet() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("balance, plan")
      .eq("id", authData.user.id)
      .single();

    if (profileData) setProfile(profileData);

    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setDeposits(data || []);
  }

  useEffect(() => {
    loadWallet();

    const interval = setInterval(() => {
      loadWallet();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function getStatusStyle(status: string) {
    if (status === "approved") return "bg-green-500/10 text-green-400";
    if (status === "rejected") return "bg-red-500/10 text-red-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  function canFollowUp(deposit: Deposit) {
    const createdAt = new Date(deposit.created_at).getTime();
    const now = Date.now();

const oneHourPassed = now - createdAt >= 60 * 60 * 1000;

    if (!oneHourPassed) return false;

    if (!deposit.last_followup_at) return true;

    const lastFollowUp = new Date(deposit.last_followup_at).getTime();
    const twoHoursPassed = now - lastFollowUp >= 2 * 60 * 60 * 1000;

    return twoHoursPassed;
  }

  async function handleFollowUp(deposit: Deposit) {
    if (!canFollowUp(deposit)) {
      setMessage("Follow up is available 1 hour after submission, then every 2 hours.");
      return;
    }

    setMessage("Sending follow up...");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("deposits")
      .update({
        last_followup_at: now,
        followup_count: Number(deposit.followup_count || 0) + 1,
      })
      .eq("id", deposit.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "head_admin", "super_admin"]);

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "Deposit Follow Up",
          message: `A user followed up a pending ${deposit.currency} ${Number(
            deposit.amount
          ).toFixed(2)} deposit request.`,
          type: "deposit_followup",
          is_read: false,
        }))
      );
    }

    setMessage("Follow up sent to admin.");
    loadWallet();
  }

  return (
    <DashboardLayout>
      <h2 className="text-4xl font-black mb-4">Wallet</h2>

      <p className="text-zinc-400 mb-8">
        Manage your balance, deposit history, and pending payments.
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black">Add Funds</h3>
              <p className="text-zinc-500 text-sm mt-2">
                Submit a new deposit request.
              </p>
            </div>

            <Link
              href="/dashboard/add-funds"
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
            >
              Add Funds
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-8">
          <p className="text-zinc-400">Current Balance</p>

          <h3 className="text-5xl font-black mt-3">
            ₱{Number(profile?.balance || 0).toFixed(2)}
          </h3>

          <p className="text-blue-400 mt-4 capitalize">
            {profile?.plan || "Starter"} Plan
          </p>
        </div>
      </div>

      {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
        <div className="p-6 border-b border-zinc-800">
          <h3 className="text-2xl font-black">Deposit History</h3>
          <p className="text-sm text-zinc-500 mt-2">
            Track your pending, approved, and rejected deposits.
          </p>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-black/60 text-zinc-500">
            <tr>
              <th className="text-left p-5">Paid Amount</th>
              <th className="text-left p-5">Wallet Credit</th>
              <th className="text-left p-5">Method</th>
              <th className="text-left p-5">Status</th>
              <th className="text-left p-5">Date</th>
              <th className="text-left p-5">Action</th>
            </tr>
          </thead>

          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="border-t border-zinc-900">
                <td className="p-5 text-blue-400 font-semibold">
                  {deposit.currency || "PHP"} {Number(deposit.amount || 0).toFixed(2)}
                </td>

                <td className="p-5 text-green-400 font-semibold">
                  ₱{Number(deposit.wallet_credit || 0).toFixed(2)}
                </td>

                <td className="p-5 text-zinc-300">{deposit.method}</td>

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
                  {deposit.status === "pending" ? (
                    canFollowUp(deposit) ? (
                      <button
                        onClick={() => handleFollowUp(deposit)}
                        className="text-yellow-400 hover:text-yellow-300 font-semibold"
                      >
                        Follow Up
                      </button>
                    ) : (
                      <span className="text-zinc-600">Waiting</span>
                    )
                  ) : (
                    <button
                      onClick={() => setSelectedDeposit(deposit)}
                      className="text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      {deposit.status === "rejected" ? "View Reason" : "View"}
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {deposits.length <= 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-zinc-500">
                  No deposit history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between">
              <div>
                <h3 className="text-2xl font-black">
                  {selectedDeposit.status === "rejected"
                    ? "Rejected Deposit"
                    : "Deposit Details"}
                </h3>
                <p className="text-sm text-zinc-500">
                  Full deposit request information.
                </p>
              </div>

              <button
                onClick={() => setSelectedDeposit(null)}
                className="text-zinc-500 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="space-y-5">
                <div>
                  <p className="text-sm text-zinc-500">Paid Amount</p>
                  <p className="text-2xl font-black text-blue-400">
                    {selectedDeposit.currency}{" "}
                    {Number(selectedDeposit.amount).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Wallet Credit</p>
                  <p className="text-2xl font-black text-green-400">
                    ₱{Number(selectedDeposit.wallet_credit || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Method</p>
                  <p className="font-semibold">{selectedDeposit.method}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Reference Number</p>
                  <p className="font-semibold">{selectedDeposit.reference_number}</p>
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

                {selectedDeposit.status === "rejected" && (
                  <div>
                    <p className="text-sm text-zinc-500">Rejection Reason</p>
                    <p className="text-red-400">
                      {selectedDeposit.reject_reason || "No reason provided."}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-zinc-500 mb-3">Payment Proof</p>
                <a href={selectedDeposit.proof_url} target="_blank">
                  <img
                    src={selectedDeposit.proof_url}
                    alt="Payment proof"
                    className="w-full max-h-[420px] object-contain rounded-2xl border border-zinc-800 bg-black"
                  />
                </a>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedDeposit(null)}
                className="border border-zinc-800 hover:border-zinc-600 rounded-xl px-5 py-3 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
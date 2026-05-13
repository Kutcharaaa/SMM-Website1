"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PaymentMethod = {
  id: string;
  name: string;
  account_name: string;
  account_number: string;
  instructions: string;
  qr_url: string;
  is_active: boolean;
};

type CurrencyRate = {
  id: string;
  currency_code: string;
  currency_name: string;
  panel_rate: number;
  is_enabled: boolean;
};

export default function AddFundsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PHP");
  const [methodId, setMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [showQrDetails, setShowQrDetails] = useState(false);

  async function loadPaymentMethods() {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setPaymentMethods(data || []);
  }

  async function loadCurrencies() {
    const { data } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("is_enabled", true)
      .order("currency_code");

    setCurrencies(data || []);
  }

  useEffect(() => {
    loadPaymentMethods();
    loadCurrencies();
  }, []);

  const selectedMethod =
    paymentMethods.find((method) => method.id === methodId) || null;

  const selectedCurrency =
    currencies.find((item) => item.currency_code === currency) || null;

  const conversionRate = Number(selectedCurrency?.panel_rate || 1);

  const walletCredit = Number(amount || 0) * conversionRate;

  async function handleSubmit() {
    setMessage("Submitting deposit request...");

    if (
      !amount ||
      !currency ||
      !selectedMethod ||
      !reference ||
      !proofFile
    ) {
      setMessage("Please complete all fields and upload proof.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("You must be logged in.");
      return;
    }

    const fileExt = proofFile.name.split(".").pop();

    const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, proofFile);

    if (uploadError) {
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase
      .from("deposits")
      .insert({
        user_id: authData.user.id,
        amount: Number(amount),
        currency,
        conversion_rate: conversionRate,
        wallet_credit: walletCredit,
        method: selectedMethod.name,
        reference_number: reference,
        proof_url: publicUrlData.publicUrl,
        status: "pending",
      });

    if (insertError) {
      setMessage(insertError.message);
      return;
    }

    await fetch("/api/email/admin-new-deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        currency,
        method: selectedMethod.name,
        reference,
        proofUrl: publicUrlData.publicUrl,
        userId: authData.user.id,
      }),
    });

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", [
        "admin",
        "head_admin",
        "super_admin",
      ]);

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "New Deposit Request",
          message: `New ${currency} ${Number(
            amount
          ).toFixed(2)} deposit request via ${selectedMethod.name
            }.`,
          type: "new_deposit",
          is_read: false,
        }))
      );
    }

    setAmount("");
    setCurrency("PHP");
    setMethodId("");
    setReference("");
    setProofFile(null);

    setShowQrDetails(false);

    setMessage(
      "Deposit request submitted successfully!"
    );
  }

  return (
    <DashboardLayout>
      <h2 className="text-4xl font-black mb-4">
        Add Funds
      </h2>

      <p className="text-zinc-400 mb-8">
        Submit a manual deposit request using
        your available payment methods.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <h3 className="text-2xl font-black mb-6">
            Deposit Details
          </h3>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Amount
                </label>

                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Currency
                </label>

                <select
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value)
                  }
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                >
                  {currencies.map((item) => (
                    <option
                      key={item.id}
                      value={item.currency_code}
                    >
                      {item.currency_code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {amount && (
              <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm text-zinc-400">
                  Wallet Credit Preview
                </p>

                <p className="text-2xl font-black text-green-400 mt-2">
                  ₱{walletCredit.toFixed(2)}
                </p>

                <p className="text-xs text-zinc-500 mt-1">
                  Rate used: 1 {currency} = ₱
                  {conversionRate.toFixed(4)}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Payment Method
              </label>

              <select
                value={methodId}
                onChange={(e) => {
                  setMethodId(e.target.value);
                  setShowQrDetails(false);
                }}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="">
                  Select payment method
                </option>

                {paymentMethods.map((method) => (
                  <option
                    key={method.id}
                    value={method.id}
                  >
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Reference Number
              </label>

              <input
                type="text"
                placeholder="Transaction reference"
                value={reference}
                onChange={(e) =>
                  setReference(e.target.value)
                }
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Upload Payment Proof
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (
                    e.target.files &&
                    e.target.files[0]
                  ) {
                    setProofFile(
                      e.target.files[0]
                    );
                  }
                }}
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400"
              />
            </div>

            {message && (
              <p className="text-sm text-blue-400">
                {message}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!methodId}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Deposit Request
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <h3 className="text-2xl font-black mb-6">
            Payment Method Instruction
          </h3>

          {!selectedMethod ? (
            <div className="rounded-2xl border border-zinc-800 bg-black p-6">
              <p className="text-zinc-400">
                Select a payment method to view
                payment instructions.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
              <h4 className="text-xl font-bold mb-4">
                {selectedMethod.name} Payment
                Instructions
              </h4>

              {selectedMethod.qr_url && (
                <div className="mb-6">
                  <div className="flex justify-center">
                    <img
                      src={selectedMethod.qr_url}
                      alt={`${selectedMethod.name} QR Code`}
                      className="w-64 h-64 object-contain rounded-2xl border border-zinc-800 bg-white p-3"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() =>
                        setShowQrDetails(
                          !showQrDetails
                        )
                      }
                      className="mt-4 text-sm text-blue-400 hover:text-blue-300 font-semibold"
                    >
                      Can&apos;t scan QR Code?
                    </button>
                  </div>

                  {showQrDetails && (
                    <div className="mt-4 rounded-xl bg-black/60 border border-zinc-800 p-4 text-sm text-zinc-300 space-y-2">
                      <p>
                        <span className="text-zinc-500">
                          Account Name:
                        </span>{" "}
                        {
                          selectedMethod.account_name
                        }
                      </p>

                      <p>
                        <span className="text-zinc-500">
                          Account / Number:
                        </span>{" "}
                        {
                          selectedMethod.account_number
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3 text-sm text-zinc-300 whitespace-pre-line">
                {selectedMethod.instructions ||
                  "Send the exact amount, enter the reference number, then upload your payment proof."}
              </div>

              <div className="mt-6 rounded-xl bg-black/60 border border-zinc-800 p-4">
                <p className="text-sm text-yellow-400">
                  Important: Deposits are
                  manually reviewed. Your balance
                  will be added after admin
                  approval.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
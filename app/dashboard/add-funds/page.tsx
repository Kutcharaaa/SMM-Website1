"use client";

import DashboardLayout from "@/components/DashboardLayout";
import DashboardGuard from "@/components/DashboardGuard";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileImage,
  Info,
  Lock,
  Pencil,
  ShieldCheck,
  Upload,
  Wallet,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PaymentMethod = {
  id: string;
  name: string;
  account_name: string | null;
  account_number: string | null;
  instructions: string | null;
  qr_url: string | null;
  icon_url?: string | null;
  icon?: string | null;
  image_url?: string | null;
  processing_time?: string | null;
  minimum_amount?: number | null;
  min_amount?: number | null;
  is_active: boolean;
  created_at?: string;
};

type CurrencyRate = {
  id: string;
  currency_code: string;
  currency_name: string;
  panel_rate: number;
  is_enabled: boolean;
};

const DEFAULT_MINIMUM_ADD_FUNDS_PHP = 50;
const quickAmounts = [100, 300, 500, 1000, 2000, 5000, 10000];

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numberValue = Number(value || fallback);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export default function AddFundsPage() {
  const { showToast } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [minimumAddFundsPhp, setMinimumAddFundsPhp] = useState(
    DEFAULT_MINIMUM_ADD_FUNDS_PHP,
  );

  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("PHP");
  const [methodId, setMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [showQrDetails, setShowQrDetails] = useState(false);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);

  async function loadMinimumAddFundsSetting() {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "minimum_add_funds")
      .maybeSingle();

    if (error) {
      console.warn("MINIMUM_ADD_FUNDS_SETTING_ERROR:", error.message);
      setMinimumAddFundsPhp(DEFAULT_MINIMUM_ADD_FUNDS_PHP);
      return;
    }

    const settingValue = Number(data?.value || DEFAULT_MINIMUM_ADD_FUNDS_PHP);
    const finalValue =
      Number.isFinite(settingValue) && settingValue > 0
        ? settingValue
        : DEFAULT_MINIMUM_ADD_FUNDS_PHP;

    setMinimumAddFundsPhp(finalValue);
  }

  async function loadPaymentMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      showToast(error.message, "error");
      return;
    }

    const rows = (data || []) as PaymentMethod[];
    setPaymentMethods(rows);

    if (!methodId && rows.length > 0) {
      setMethodId(rows[0].id);
    }
  }

  async function loadCurrencies() {
    const { data, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("is_enabled", true)
      .order("currency_code");

    if (error) {
      showToast(error.message, "error");
      return;
    }

    const rows = (data || []) as CurrencyRate[];
    const hasPhp = rows.some((item) => item.currency_code === "PHP");

    setCurrencies(
      hasPhp
        ? rows
        : [
            {
              id: "php-default",
              currency_code: "PHP",
              currency_name: "Philippine Peso",
              panel_rate: 1,
              is_enabled: true,
            },
            ...rows,
          ],
    );
  }

  useEffect(() => {
    loadMinimumAddFundsSetting();
    loadPaymentMethods();
    loadCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedMethod =
    paymentMethods.find((method) => method.id === methodId) || null;

  const selectedCurrency =
    currencies.find((item) => item.currency_code === currency) || null;

  const conversionRate = Number(selectedCurrency?.panel_rate || 1);
  const walletCredit = Number(amount || 0) * conversionRate;

  const methodMinimumPhp = Number(
    selectedMethod?.minimum_amount ||
      selectedMethod?.min_amount ||
      minimumAddFundsPhp,
  );

  const baseMinimumPhp = Math.max(
    minimumAddFundsPhp,
    Number.isFinite(methodMinimumPhp) && methodMinimumPhp > 0
      ? methodMinimumPhp
      : minimumAddFundsPhp,
  );

  const minimumAmount =
    conversionRate > 0 ? baseMinimumPhp / conversionRate : baseMinimumPhp;

  const iconUrl =
    selectedMethod?.icon_url ||
    selectedMethod?.icon ||
    selectedMethod?.image_url ||
    "";

  const selectedAmountIsPreset = quickAmounts.includes(Number(amount || 0));
  const processingLabel = selectedMethod?.processing_time || "Manual Review";

  const instructions =
    selectedMethod?.instructions ||
    "Send the exact amount to the selected payment account, enter the reference number, and upload your payment proof. Your balance will be added after admin approval.";

  const canSubmit =
    Number(amount || 0) >= minimumAmount &&
    Boolean(selectedMethod) &&
    Boolean(reference.trim()) &&
    Boolean(proofFile) &&
    !submittingDeposit;

  function formatCurrencyValue(value: number, code = currency) {
    const symbols: Record<string, string> = {
      PHP: "₱",
      USD: "$",
      THB: "฿",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      KRW: "₩",
      CNY: "¥",
      AUD: "A$",
      CAD: "C$",
    };

    const symbol = symbols[code] || `${code} `;

    return `${symbol}${Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  async function copyText(text?: string | null) {
    if (!text) return;

    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard.", "success");
  }

  function resetForm() {
    setAmount(String(Math.max(100, minimumAddFundsPhp)));
    setCurrency("PHP");
    setReference("");
    setProofFile(null);
    setShowQrDetails(false);
    setQrPreviewOpen(false);

    if (paymentMethods.length > 0) {
      setMethodId(paymentMethods[0].id);
    } else {
      setMethodId("");
    }
  }

  async function handleSubmit() {
    if (submittingDeposit) return;

    setSubmittingDeposit(true);

    if (!amount || !currency || !selectedMethod || !reference.trim() || !proofFile) {
      showToast("Please complete all fields and upload proof.", "warning");
      setSubmittingDeposit(false);
      return;
    }

    if (Number(amount) < minimumAmount) {
      showToast(
        `Minimum deposit is ${formatCurrencyValue(
          minimumAmount,
        )} (₱${baseMinimumPhp.toFixed(2)} PHP).`,
        "warning",
      );
      setSubmittingDeposit(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      showToast("You must be logged in.", "error");
      setSubmittingDeposit(false);
      return;
    }

    const fileExt = proofFile.name.split(".").pop();
    const fileName = `${authData.user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payment-proofs")
      .upload(fileName, proofFile);

    if (uploadError) {
      showToast(uploadError.message, "error");
      setSubmittingDeposit(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(fileName);

    const { error: insertError } = await supabase.from("deposits").insert({
      user_id: authData.user.id,
      amount: Number(amount),
      currency,
      conversion_rate: conversionRate,
      wallet_credit: walletCredit,
      method: selectedMethod.name,
      reference_number: reference.trim(),
      proof_url: publicUrlData.publicUrl,
      status: "pending",
    });

    if (insertError) {
      showToast(insertError.message, "error");
      setSubmittingDeposit(false);
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
        reference: reference.trim(),
        proofUrl: publicUrlData.publicUrl,
        userId: authData.user.id,
      }),
    }).catch(() => null);

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "head_admin", "super_admin"]);

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "New Deposit Request",
          message: `${authData.user?.email || "A user"} submitted a ${formatCurrencyValue(
            Number(amount),
            currency,
          )} deposit via ${selectedMethod.name}.`,
          type: "deposit_request",
          is_read: false,
        })),
      );
    }

    showToast("Deposit submitted successfully. Please wait for admin approval.", "success");
    resetForm();
    setSubmittingDeposit(false);
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Add Funds
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Choose a payment method, upload your proof, and your wallet will be credited after admin approval.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700">
              Minimum Add Funds: ₱{baseMinimumPhp.toFixed(2)}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_390px]">
            <section className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Wallet size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Deposit Amount
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">
                      Minimum is based on ₱{baseMinimumPhp.toFixed(2)} PHP equivalent.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                  <label>
                    <span className="text-sm font-black text-slate-700">
                      Amount
                    </span>
                    <input
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      type="number"
                      min={minimumAmount}
                      step="0.01"
                      placeholder="Enter amount"
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-black text-slate-700">
                      Currency
                    </span>
                    <select
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    >
                      {currencies.map((item) => (
                        <option key={item.currency_code} value={item.currency_code}>
                          {item.currency_code} - {item.currency_name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4 xl:grid-cols-7">
                  {quickAmounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setAmount(String(value));
                        setCurrency("PHP");
                      }}
                      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                        selectedAmountIsPreset && Number(amount) === value && currency === "PHP"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      ₱{value.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <SummaryBox
                    label="Minimum Required"
                    value={`${formatCurrencyValue(minimumAmount)} (${formatCurrencyValue(
                      baseMinimumPhp,
                      "PHP",
                    )})`}
                  />
                  <SummaryBox
                    label="Conversion Rate"
                    value={`1 ${currency} = ₱${conversionRate.toFixed(4)}`}
                  />
                  <SummaryBox
                    label="Wallet Credit"
                    value={formatCurrencyValue(walletCredit, "PHP")}
                    positive
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                    <CreditCard size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Payment Method
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">
                      Select where you will send your payment.
                    </p>
                  </div>
                </div>

                {paymentMethods.length <= 0 ? (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5 text-sm font-bold text-orange-700">
                    No active payment methods yet. Please contact support.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {paymentMethods.map((method) => {
                      const active = method.id === methodId;
                      const methodIcon =
                        method.icon_url || method.icon || method.image_url || "";

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setMethodId(method.id)}
                          className={`rounded-3xl border p-5 text-left transition ${
                            active
                              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-blue-600 ring-1 ring-slate-200">
                              {methodIcon ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={methodIcon}
                                  alt={method.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <CreditCard size={22} />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-base font-black text-slate-950">
                                {method.name}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {method.processing_time || "Manual Review"}
                              </p>
                            </div>

                            {active && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white">
                                <Check size={17} />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                    <Pencil size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Payment Details
                    </h2>
                    <p className="text-sm font-semibold text-slate-500">
                      Enter your reference number and upload proof.
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    Reference Number / Transaction ID
                  </span>
                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    placeholder="Enter payment reference number"
                    className="mt-2 h-13 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </label>

                <div className="mt-5">
                  <span className="text-sm font-black text-slate-700">
                    Payment Proof
                  </span>

                  <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-300 hover:bg-blue-50">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setProofFile(event.target.files?.[0] || null)
                      }
                    />

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                      <Upload size={26} />
                    </div>

                    <p className="mt-4 text-sm font-black text-slate-800">
                      {proofFile ? proofFile.name : "Click to upload payment proof"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      PNG, JPG, WEBP accepted
                    </p>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submittingDeposit ? (
                    "Submitting..."
                  ) : (
                    <>
                      Submit Deposit Request
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Info size={22} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      Payment Account
                    </h3>
                    <p className="text-sm font-semibold text-slate-500">
                      Send payment to this account.
                    </p>
                  </div>
                </div>

                {selectedMethod ? (
                  <div className="mt-5 space-y-4">
                    {iconUrl && (
                      <div className="flex justify-center">
                        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={iconUrl}
                            alt={selectedMethod.name}
                            className="h-20 w-20 rounded-2xl object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <InfoRow
                      label="Method"
                      value={selectedMethod.name}
                      onCopy={() => copyText(selectedMethod.name)}
                    />

                    <InfoRow
                      label="Account Name"
                      value={selectedMethod.account_name || "—"}
                      onCopy={() => copyText(selectedMethod.account_name)}
                    />

                    <InfoRow
                      label="Account Number"
                      value={selectedMethod.account_number || "—"}
                      onCopy={() => copyText(selectedMethod.account_number)}
                    />

                    <InfoRow label="Processing" value={processingLabel} />

                    {selectedMethod.qr_url && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-slate-700">
                            QR Code
                          </p>
                          <button
                            type="button"
                            onClick={() => setQrPreviewOpen(true)}
                            className="inline-flex items-center gap-1 text-xs font-black text-blue-600"
                          >
                            <ZoomIn size={14} />
                            Enlarge
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setQrPreviewOpen(true)}
                          className="mt-3 block w-full overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-slate-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedMethod.qr_url}
                            alt="Payment QR"
                            className="mx-auto max-h-64 rounded-xl object-contain"
                          />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowQrDetails(!showQrDetails)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      {showQrDetails ? "Hide" : "Show"} Instructions
                    </button>

                    {showQrDetails && (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                        {instructions}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    Select a payment method first.
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-green-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Before You Submit
                  </h3>
                </div>

                <div className="space-y-3">
                  <CheckItem text="Send the exact payment amount to avoid delays." />
                  <CheckItem text="Use the correct payment method and account details." />
                  <CheckItem text="Upload a clear screenshot or proof of payment." />
                  <CheckItem text="Your balance is credited only after admin approval." />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Lock size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Request Summary
                  </h3>
                </div>

                <div className="space-y-3">
                  <SummaryLine label="Amount" value={formatCurrencyValue(Number(amount || 0))} />
                  <SummaryLine label="Currency" value={currency} />
                  <SummaryLine
                    label="Wallet Credit"
                    value={formatCurrencyValue(walletCredit, "PHP")}
                    positive
                  />
                  <SummaryLine
                    label="Minimum"
                    value={`${formatCurrencyValue(minimumAmount)} / ₱${baseMinimumPhp.toFixed(2)}`}
                  />
                  <SummaryLine
                    label="Method"
                    value={selectedMethod?.name || "Not selected"}
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {qrPreviewOpen && selectedMethod?.qr_url && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-xl rounded-[28px] bg-white p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setQrPreviewOpen(false)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>

              <h3 className="pr-12 text-xl font-black text-slate-950">
                {selectedMethod.name} QR Code
              </h3>

              <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedMethod.qr_url}
                  alt="Payment QR Code"
                  className="mx-auto max-h-[70vh] rounded-2xl object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </DashboardGuard>
  );
}

function SummaryBox({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-sm font-black ${positive ? "text-green-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`text-right text-sm font-black ${positive ? "text-green-600" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <p className="min-w-0 flex-1 break-words text-sm font-black text-slate-900">
          {value}
        </p>

        {onCopy && value !== "—" && (
          <button
            type="button"
            onClick={onCopy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:text-blue-600"
          >
            <Copy size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CheckCircle2 size={14} />
      </div>
      <p className="text-sm font-semibold leading-6 text-slate-600">{text}</p>
    </div>
  );
}

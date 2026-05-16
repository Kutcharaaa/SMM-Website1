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

const quickAmounts = [100, 300, 500, 1000, 2000, 5000, 10000];

export default function AddFundsPage() {
  const { showToast } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);

  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("PHP");
  const [methodId, setMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [showQrDetails, setShowQrDetails] = useState(false);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);

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

    const rows = data || [];
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

  const baseMinimumPhp = Math.max(
    50,
    Number(selectedMethod?.minimum_amount || selectedMethod?.min_amount || 50),
  );

  const minimumAmount =
    conversionRate > 0 ? baseMinimumPhp / conversionRate : baseMinimumPhp;

  const iconUrl =
    selectedMethod?.icon_url ||
    selectedMethod?.icon ||
    selectedMethod?.image_url ||
    "";

  const canSubmit =
    Number(amount || 0) >= minimumAmount &&
    Boolean(selectedMethod) &&
    Boolean(reference) &&
    Boolean(proofFile) &&
    !submittingDeposit;

  const selectedAmountIsPreset = quickAmounts.includes(Number(amount || 0));

  const processingLabel = selectedMethod?.processing_time || "Manual Review";

  const instructions =
    selectedMethod?.instructions ||
    "Send the exact amount to the selected payment account, enter the reference number, and upload your payment proof. Your balance will be added after admin approval.";

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
    setAmount("100");
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

    if (!amount || !currency || !selectedMethod || !reference || !proofFile) {
      showToast("Please complete all fields and upload proof.", "warning");
      setSubmittingDeposit(false);
      return;
    }

    if (Number(amount) < minimumAmount) {
      showToast(
        `Minimum deposit is ${formatCurrencyValue(minimumAmount)} (₱${baseMinimumPhp.toFixed(2)} PHP).`,
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
      reference_number: reference,
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
        reference,
        proofUrl: publicUrlData.publicUrl,
        userId: authData.user.id,
      }),
    });

    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "head_admin", "super_admin"]);

    if (admins && admins.length > 0) {
      await supabase.from("notifications").insert(
        admins.map((admin) => ({
          user_id: admin.id,
          title: "New Deposit Request",
          message: `New ${currency} ${Number(amount).toFixed(2)} deposit request via ${selectedMethod.name}.`,
          type: "new_deposit",
          is_read: false,
        })),
      );
    }

    resetForm();
    showToast("Deposit request submitted successfully!", "success");
    setSubmittingDeposit(false);
  }

  const amountPreviewText = useMemo(() => {
    if (!amount) return "₱0.00";
    return `₱${walletCredit.toFixed(2)}`;
  }, [amount, walletCredit]);

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="-m-8 min-h-screen bg-[#f6f9fc] p-6 lg:p-8">
          <div className="mb-7">
            <h1 className="text-3xl font-black text-slate-950">Add Funds</h1>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Top up your wallet balance to place orders and enjoy our services.
            </p>
          </div>

          <div className="grid gap-7 xl:grid-cols-[1fr_360px]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <section className="border-b border-slate-100 p-5 lg:p-6">
                <StepHeader number="1" title="Choose Payment Method" />

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {paymentMethods.length <= 0 ? (
                    <div className="col-span-full rounded-2xl border border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
                      No active payment methods yet.
                    </div>
                  ) : (
                    paymentMethods.map((method) => {
                      const isSelected = method.id === methodId;
                      const methodIcon =
                        method.icon_url ||
                        method.icon ||
                        method.image_url ||
                        "";

                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            setMethodId(method.id);
                            setShowQrDetails(false);
                            setQrPreviewOpen(false);
                          }}
                          className={`relative flex min-h-[138px] flex-col items-center justify-center rounded-2xl border p-5 text-center transition ${
                            isSelected
                              ? "border-blue-500 bg-blue-50/40 shadow-sm"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/20"
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                              <Check size={16} strokeWidth={3} />
                            </span>
                          )}

                          <PaymentIcon src={methodIcon} name={method.name} />

                          <h3 className="mt-3 text-sm font-black text-slate-950">
                            {method.name}
                          </h3>

                          <span
                            className={`mt-2 rounded-full px-3 py-1 text-[11px] font-black ${
                              processingLabelFor(method) === "Instant"
                                ? "bg-green-50 text-green-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {processingLabelFor(method)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  <Info size={18} className="mt-0.5 shrink-0 text-blue-600" />
                  <p>
                    Payments are reviewed securely. Your funds will be added
                    after successful verification.
                  </p>
                </div>
              </section>

              <section className="border-b border-slate-100 p-5 lg:p-6">
                <StepHeader number="2" title="Select Amount" />

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {quickAmounts.map((value) => {
                    const selected = Number(amount || 0) === value;

                    return (
                      <button
                        key={value}
                        onClick={() => setAmount(String(value))}
                        className={`relative rounded-2xl border p-5 text-center transition ${
                          selected
                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        {selected && (
                          <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                            <Check size={16} strokeWidth={3} />
                          </span>
                        )}

                        <h3 className="text-2xl font-black text-slate-950">
                          {formatCurrencyValue(value)}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          You pay {formatCurrencyValue(value)}
                        </p>
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      if (selectedAmountIsPreset) setAmount("");
                    }}
                    className={`rounded-2xl border p-5 text-center transition ${
                      !selectedAmountIsPreset
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <Pencil size={18} className="mx-auto text-slate-500" />
                    <h3 className="mt-2 text-base font-black text-slate-700">
                      Custom Amount
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Enter any amount
                    </p>
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                  <label className="text-sm font-bold text-slate-600">
                    Or enter custom amount
                  </label>

                  <div className="mt-3 flex overflow-hidden rounded-xl border border-slate-200">
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="h-12 flex-1 px-4 text-sm font-semibold text-slate-900 outline-none"
                    />

                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="border-l border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-700 outline-none"
                    >
                      {currencies.map((item) => (
                        <option key={item.id} value={item.currency_code}>
                          {item.currency_code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    Minimum amount: {formatCurrencyValue(minimumAmount)} (₱
                    {baseMinimumPhp.toFixed(2)} PHP)
                  </p>
                </div>
              </section>

              <section className="border-b border-slate-100 p-5 lg:p-6">
                <StepHeader number="3" title="Payment Details" />

                <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-sm font-black text-slate-900">
                      QR Code
                    </h3>

                    {selectedMethod?.qr_url ? (
                      <button
                        type="button"
                        onClick={() => setQrPreviewOpen(true)}
                        className="group relative mt-4 block h-56 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <img
                          src={selectedMethod.qr_url}
                          alt={`${selectedMethod.name} QR Code`}
                          className="h-full w-full object-contain"
                        />

                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                          <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-lg">
                            <ZoomIn size={16} />
                            Enlarge QR
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div className="mt-4 flex h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-400">
                        No QR uploaded
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowQrDetails(!showQrDetails)}
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-black text-blue-600 transition hover:border-blue-300"
                    >
                      {showQrDetails
                        ? "Hide Account Details"
                        : "Show Account Details"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {showQrDetails && selectedMethod && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <AccountBox
                          label="Account Name"
                          value={selectedMethod.account_name || "N/A"}
                          onCopy={() => copyText(selectedMethod.account_name)}
                        />

                        <AccountBox
                          label="Account Number"
                          value={selectedMethod.account_number || "N/A"}
                          onCopy={() => copyText(selectedMethod.account_number)}
                        />
                      </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="text-sm font-bold text-slate-600">
                        Reference Number
                      </label>

                      <input
                        type="text"
                        placeholder="Enter transaction reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="mt-3 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <label className="text-sm font-bold text-slate-600">
                        Upload Payment Proof
                      </label>

                      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProofFile(e.target.files[0]);
                            }
                          }}
                        />

                        <Upload size={26} className="text-blue-600" />

                        <p className="mt-3 text-sm font-black text-slate-800">
                          {proofFile ? proofFile.name : "Click to upload proof"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          PNG, JPG, WEBP screenshots are accepted.
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </section>

              <section className="p-5 lg:p-6">
                <StepHeader number="4" title="Review & Submit" />

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingDeposit
                    ? "Submitting..."
                    : "Submit Deposit Request"}
                  <ArrowRight size={18} />
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                  <Lock size={14} />
                  Secure payment review by Ascend Service
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950">
                    Payment Summary
                  </h3>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                    <Wallet size={22} />
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <SummaryRow
                    label="Payment Method"
                    value={selectedMethod?.name || "Not selected"}
                  />

                  <SummaryRow label="Processing Time" value={processingLabel} />

                  <SummaryRow
                    label="Amount"
                    value={`${currency} ${Number(amount || 0).toFixed(2)}`}
                  />

                  <div className="border-t border-slate-100 pt-5">
                    <SummaryRow
                      label="Total to Add"
                      value={amountPreviewText}
                      valueClassName="text-2xl text-blue-600"
                    />
                  </div>

                  <SummaryRow
                    label="Status"
                    value="Pending Review"
                    valueClassName="text-orange-500"
                  />

                  <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
                    Your deposit will be reviewed after proof submission.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Payment Instructions
                </h3>

                <div className="mt-4 whitespace-pre-line text-sm font-medium leading-relaxed text-slate-600">
                  {instructions}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Secure & Trusted
                </h3>

                <div className="mt-4 space-y-3">
                  <TrustItem text="Manual verification for safety" />
                  <TrustItem text="Secure proof upload" />
                  <TrustItem text="Admin reviewed deposits" />
                  <TrustItem text="24/7 support available" />
                </div>
              </div>
            </aside>
          </div>

          {qrPreviewOpen && selectedMethod?.qr_url && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setQrPreviewOpen(false)}
                  className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <X size={20} />
                </button>

                <div className="pr-12">
                  <h3 className="text-2xl font-black text-slate-950">
                    {selectedMethod.name} QR Code
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Scan this QR code to send your payment.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <img
                    src={selectedMethod.qr_url}
                    alt={`${selectedMethod.name} QR Code`}
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

function processingLabelFor(method: PaymentMethod) {
  return method.processing_time || "Manual Review";
}

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
        {number}
      </span>

      <h2 className="text-lg font-black text-slate-950">{title}</h2>
    </div>
  );
}

function PaymentIcon({ src, name }: { src?: string; name: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name} icon`}
        className="h-12 w-12 rounded-xl object-contain"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
      <CreditCard size={26} />
    </div>
  );
}

function AccountBox({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="break-all text-sm font-black text-slate-900">{value}</p>

        <button
          type="button"
          onClick={onCopy}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p
        className={`text-right text-sm font-black text-slate-950 ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
      <CheckCircle2 size={17} className="text-blue-600" />
      {text}
    </div>
  );
}

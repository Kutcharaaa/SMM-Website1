"use client";

import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Wallet,
  X,
  XCircle,
  Banknote,
  CreditCard,
  Activity,
  ArrowRight,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

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
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

type Profile = {
  id?: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  balance: number;
};

type UserProfile = {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
};

type PaymentMethod = {
  id?: string;
  name: string;
  cash_account_id?: string | null;
  icon_url?: string | null;
  image_url?: string | null;
  logo_url?: string | null;
  icon?: string | null;
  [key: string]: unknown;
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

type AffiliateLevelRule = {
  level: number;
  name: string;
  requiredDeposits: number;
  commissionRate: number;
};

const AFFILIATE_LEVEL_RULES: AffiliateLevelRule[] = [
  {
    level: 1,
    name: "Starter Affiliate",
    requiredDeposits: 0,
    commissionRate: 1.25,
  },
  {
    level: 2,
    name: "Active Affiliate",
    requiredDeposits: 12000,
    commissionRate: 1.5,
  },
  {
    level: 3,
    name: "Pro Affiliate",
    requiredDeposits: 35000,
    commissionRate: 2,
  },
  {
    level: 4,
    name: "Elite Affiliate",
    requiredDeposits: 80000,
    commissionRate: 2.5,
  },
  {
    level: 5,
    name: "Ascend Partner",
    requiredDeposits: 200000,
    commissionRate: 3,
  },
];

function getAffiliateLevelByDeposits(totalReferralDeposits: number) {
  return AFFILIATE_LEVEL_RULES.reduce((current, level) => {
    if (totalReferralDeposits >= level.requiredDeposits) {
      return level;
    }

    return current;
  }, AFFILIATE_LEVEL_RULES[0]);
}

function getReferralName(userId: string, profiles: UserProfile[]) {
  const profile = profiles.find((item) => item.id === userId);

  if (!profile) return shortUserId(userId);

  if (profile.username) return profile.username;

  const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return fullName || shortUserId(userId);
}

function normalizeStatus(status?: string | null) {
  return String(status || "pending").toLowerCase().trim();
}

function formatMoney(value: number | string | null | undefined, currency = "PHP") {
  const amount = Number(value || 0);

  if (currency && currency !== "PHP") {
    return `${currency} ${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortDepositId(id: string) {
  return `DEP ${String(id).slice(0, 8).toUpperCase()}`;
}

function shortUserId(id: string) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

function getUserDisplayName(userId: string, profiles: UserProfile[]) {
  const profile = profiles.find((item) => item.id === userId);

  if (!profile) {
    return shortUserId(userId);
  }

  if (profile.username) {
    return profile.username;
  }

  const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return fullName || shortUserId(userId);
}


function getReviewerDisplayName(deposit: Deposit, profiles: UserProfile[]) {
  if (!deposit.reviewed_by) {
    return "Not reviewed yet";
  }

  return getUserDisplayName(deposit.reviewed_by, profiles);
}

function getReviewedLabel(deposit: Deposit, profiles: UserProfile[]) {
  const status = normalizeStatus(deposit.status);

  if (!deposit.reviewed_by || status === "pending") {
    return "Not reviewed yet";
  }

  const reviewer = getReviewerDisplayName(deposit, profiles);

  if (status === "approved") {
    return `Approved by ${reviewer}`;
  }

  if (status === "rejected") {
    return `Rejected by ${reviewer}`;
  }

  return reviewer;
}

function isToday(dateValue?: string | null) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getPaymentMethodIconUrl(method?: PaymentMethod | null) {
  if (!method) return null;

  const candidates = [
    method.icon_url,
    method.image_url,
    method.logo_url,
    method.icon,
    method.iconImage,
    method.icon_image,
    method.image,
    method.logo,
  ];

  const found = candidates.find((value) => typeof value === "string" && value.trim().length > 0);

  return typeof found === "string" ? found : null;
}

function getStatusBadgeClass(status?: string | null) {
  const clean = normalizeStatus(status);

  if (clean === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (clean === "rejected") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-orange-50 text-orange-700 ring-orange-100";
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${getStatusBadgeClass(
        status,
      )}`}
    >
      {normalizeStatus(status)}
    </span>
  );
}

function PaymentMethodBadge({
  methodName,
  method,
}: {
  methodName: string;
  method?: PaymentMethod | null;
}) {
  const iconUrl = getPaymentMethodIconUrl(method);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
        {iconUrl ? (
          <img src={iconUrl} alt={methodName} className="h-full w-full object-cover" />
        ) : (
          <CreditCard size={19} />
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-black text-slate-800">{methodName || "Manual Payment"}</p>
        <p className="text-xs font-semibold text-slate-400">Payment method</p>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone: "green" | "orange" | "red" | "blue";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  title,
  children,
  onClick,
  disabled,
  tone = "slate",
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "slate" | "green" | "red";
}) {
  const toneClass = {
    slate: "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    green: "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50",
    red: "border-red-200 text-red-700 hover:border-red-300 hover:bg-red-50",
  }[tone];

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-white transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function InfoBlock({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className={`mt-2 text-sm font-black ${valueClassName}`}>{value}</div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [message, setMessage] = useState("");

  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState("all");

  async function loadDeposits() {
    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setDeposits((data || []) as Deposit[]);
    setLoading(false);
  }

  async function loadPaymentMethods() {
    const { data, error } = await supabase.from("payment_methods").select("*").order("name");

    if (!error) {
      setPaymentMethods((data || []) as PaymentMethod[]);
    }
  }

async function loadProfiles() {
  let allProfiles: UserProfile[] = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const to = from + batchSize - 1;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, firstname, lastname")
      .range(from, to);

    if (error) {
      return;
    }

    const batch = (data || []) as UserProfile[];
    allProfiles = [...allProfiles, ...batch];

    if (batch.length < batchSize) {
      break;
    }

    from += batchSize;
  }

  setProfiles(allProfiles);
}

useEffect(() => {
  loadDeposits();
  loadPaymentMethods();
  loadProfiles();

  const interval = setInterval(() => {
    loadDeposits();
    loadPaymentMethods();
    loadProfiles();
  }, 3000);

  return () => clearInterval(interval);
}, []);

  function getPaymentMethod(methodName: string) {
    return (
      paymentMethods.find(
        (method) => String(method.name || "").toLowerCase() === String(methodName || "").toLowerCase(),
      ) || null
    );
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

  async function createAffiliateCommissionForDeposit(
    deposit: Deposit,
    approvedAmount: number,
  ) {
    try {
      if (!deposit.user_id || approvedAmount <= 0) {
        return "";
      }

      const { data: referral, error: referralError } = await supabase
        .from("affiliate_referrals")
        .select("*")
        .eq("referred_user_id", deposit.user_id)
        .maybeSingle();

      if (referralError) {
        console.error("AFFILIATE_REFERRAL_LOOKUP_ERROR:", referralError.message);
        return ` Deposit approved, but affiliate lookup failed: ${referralError.message}`;
      }

      if (!referral?.referrer_id) {
        return "";
      }

      if (referral.referrer_id === deposit.user_id) {
        return "";
      }

      const totalDepositsBefore = Number(referral.total_deposits || 0);
      const totalCommissionBefore = Number(referral.total_commission || 0);
      const totalDepositsAfter = totalDepositsBefore + approvedAmount;
      const affiliateLevel = getAffiliateLevelByDeposits(totalDepositsAfter);
      const commissionAmount = Number(
        ((approvedAmount * affiliateLevel.commissionRate) / 100).toFixed(2),
      );

      if (commissionAmount <= 0) {
        return "";
      }

      const referredUsername = getReferralName(deposit.user_id, profiles);

      const { error: commissionError } = await supabase
        .from("affiliate_commissions")
        .insert({
          referrer_id: referral.referrer_id,
          referred_user_id: deposit.user_id,
          referred_username: referredUsername,
          deposit_amount: approvedAmount,
          commission_rate: affiliateLevel.commissionRate,
          commission_amount: commissionAmount,
          used_amount: 0,
          status: "available",
        });

      if (commissionError) {
        console.error("AFFILIATE_COMMISSION_INSERT_ERROR:", commissionError.message);
        return ` Deposit approved, but affiliate commission failed: ${commissionError.message}`;
      }

      const { error: referralUpdateError } = await supabase
        .from("affiliate_referrals")
        .update({
          total_deposits: totalDepositsAfter,
          total_commission: totalCommissionBefore + commissionAmount,
          commission_rate: affiliateLevel.commissionRate,
          is_qualified: true,
          status: "qualified",
        })
        .eq("id", referral.id);

      if (referralUpdateError) {
        console.error("AFFILIATE_REFERRAL_UPDATE_ERROR:", referralUpdateError.message);
        return ` Deposit approved, commission created, but referral totals failed: ${referralUpdateError.message}`;
      }

      await supabase.from("notifications").insert({
        user_id: referral.referrer_id,
        title: "Affiliate Commission Earned",
        message: `You earned ${formatMoney(
          commissionAmount,
        )} affiliate commission from an approved deposit by ${referredUsername}.`,
        type: "affiliate_commission",
        is_read: false,
      });

      return ` Affiliate commission created: ${formatMoney(
        commissionAmount,
      )} at ${affiliateLevel.commissionRate}% (${affiliateLevel.name}).`;
    } catch (error) {
      console.error("AFFILIATE_COMMISSION_CREATE_ERROR:", error);
      return " Deposit approved, but affiliate commission could not be created.";
    }
  }

  async function approveDeposit(deposit: Deposit) {
    if (approving || rejecting) return;

    if (deposit.status === "approved") {
      setMessage("Deposit already approved.");
      return;
    }

    const creditAmount = Number(deposit.wallet_credit || deposit.amount || 0);

    if (creditAmount <= 0) {
      setMessage("Invalid deposit amount.");
      return;
    }

    const confirmApprove = confirm(
      `Approve this deposit and add ₱${creditAmount.toFixed(2)} to the user's wallet?`,
    );

    if (!confirmApprove) return;

    setApproving(true);
    setMessage("Approving deposit...");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const reviewerId = authData.user?.id || null;

      if (!reviewerId) {
        setMessage("Admin user not authenticated.");
        setApproving(false);
        return;
      }

      const localPaymentMethod = getPaymentMethod(deposit.method);

      let paymentMethod: PaymentMethod | null = localPaymentMethod;

      if (!paymentMethod) {
        const { data } = await supabase
          .from("payment_methods")
          .select("*")
          .eq("name", deposit.method)
          .single();

        paymentMethod = (data || null) as PaymentMethod | null;
      }

      let cashAccountId: string | null = null;

      if (paymentMethod?.cash_account_id) {
        cashAccountId = paymentMethod.cash_account_id;

        const { data: cashAccount, error: cashAccountError } = await supabase
          .from("cash_accounts")
          .select("balance")
          .eq("id", cashAccountId)
          .single();

        if (cashAccountError) {
          setMessage(cashAccountError.message);
          setApproving(false);
          return;
        }

        const currentCashBalance = Number(cashAccount?.balance || 0);
        const newCashBalance = currentCashBalance + creditAmount;

        const { error: cashUpdateError } = await supabase
          .from("cash_accounts")
          .update({
            balance: newCashBalance,
          })
          .eq("id", cashAccountId);

        if (cashUpdateError) {
          setMessage(cashUpdateError.message);
          setApproving(false);
          return;
        }

        await supabase.from("cash_movements").insert({
          cash_account_id: cashAccountId,
          type: "deposit",
          amount: creditAmount,
          description: `Deposit approved (${deposit.method})`,
          reference_type: "deposit",
          reference_id: deposit.id,
        });
      }

      const profile = await getUserProfile(deposit.user_id);

      if (!profile) {
        setApproving(false);
        return;
      }

      const currentBalance = Number(profile.balance || 0);
      const newBalance = currentBalance + creditAmount;

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
        })
        .eq("id", deposit.user_id);

      if (balanceError) {
        setMessage(balanceError.message);
        setApproving(false);
        return;
      }

      const { error: depositError } = await supabase
        .from("deposits")
        .update({
          status: "approved",
          reject_reason: null,
          cash_account_id: cashAccountId,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      if (depositError) {
        setMessage(depositError.message);
        setApproving(false);
        return;
      }

      const affiliateMessage = await createAffiliateCommissionForDeposit(
        deposit,
        creditAmount,
      );

      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: "Deposit Approved",
        message: `Your deposit has been approved. ₱${creditAmount.toFixed(
          2,
        )} has been added to your wallet.`,
        type: "deposit_approved",
        is_read: false,
      });

      await sendDepositEmail(deposit.id, "approved");

      setMessage(`Deposit approved and reviewer recorded.${affiliateMessage || ""}`);
      setSelectedDeposit(null);
      setShowRejectBox(false);
      setRejectReason("");

      loadDeposits();
      loadPaymentMethods();
    } catch {
      setMessage("Failed to approve deposit.");
    }

    setApproving(false);
  }

  async function rejectDeposit() {
    if (approving || rejecting) return;

    if (!selectedDeposit) return;

    if (!rejectReason.trim()) {
      setMessage("Please enter a rejection reason.");
      return;
    }

    const confirmReject = confirm("Reject this deposit request?");
    if (!confirmReject) return;

    setRejecting(true);
    setMessage("Rejecting deposit...");

    try {
      const { data: authData } = await supabase.auth.getUser();
      const reviewerId = authData.user?.id || null;

      if (!reviewerId) {
        setMessage("Admin user not authenticated.");
        setRejecting(false);
        return;
      }

      const { error: depositError } = await supabase
        .from("deposits")
        .update({
          status: "rejected",
          reject_reason: rejectReason,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedDeposit.id);

      if (depositError) {
        setMessage(depositError.message);
        setRejecting(false);
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

      setMessage("Deposit rejected and reviewer recorded.");
      setSelectedDeposit(null);
      setShowRejectBox(false);
      setRejectReason("");

      loadDeposits();
    } catch {
      setMessage("Failed to reject deposit.");
    }

    setRejecting(false);
  }

  const methodOptions = useMemo(() => {
    const methods = deposits.map((deposit) => deposit.method).filter(Boolean);

    paymentMethods.forEach((method) => {
      if (method.name) methods.push(method.name);
    });

    return Array.from(new Set(methods)).sort();
  }, [deposits, paymentMethods]);

  const stats = useMemo(() => {
    const pending = deposits.filter((deposit) => normalizeStatus(deposit.status) === "pending").length;
    const approvedToday = deposits.filter(
      (deposit) => normalizeStatus(deposit.status) === "approved" && isToday(deposit.created_at),
    ).length;
    const rejectedToday = deposits.filter(
      (deposit) => normalizeStatus(deposit.status) === "rejected" && isToday(deposit.created_at),
    ).length;
    const totalApprovedAmount = deposits
      .filter((deposit) => normalizeStatus(deposit.status) === "approved")
      .reduce((sum, deposit) => sum + Number(deposit.wallet_credit || deposit.amount || 0), 0);

    const manualMethods = deposits.filter((deposit) => normalizeStatus(deposit.status) === "pending").length;

    return {
      pending,
      approvedToday,
      rejectedToday,
      totalApprovedAmount,
      manualMethods,
    };
  }, [deposits]);

  const filteredDeposits = useMemo(() => {
    const query = search.toLowerCase().trim();

    return deposits.filter((deposit) => {
      const cleanStatus = normalizeStatus(deposit.status);

      const matchesStatus = statusFilter === "all" ? true : cleanStatus === statusFilter;
      const matchesMethod = methodFilter === "all" ? true : deposit.method === methodFilter;

      const matchesSearch =
        !query ||
        String(deposit.id).toLowerCase().includes(query) ||
        String(deposit.user_id).toLowerCase().includes(query) ||
        String(deposit.method || "").toLowerCase().includes(query) ||
        String(deposit.reference_number || "").toLowerCase().includes(query) ||
        String(deposit.currency || "").toLowerCase().includes(query);

      return matchesStatus && matchesMethod && matchesSearch;
    });
  }, [deposits, methodFilter, search, statusFilter]);

  const pendingDeposits = deposits.filter((deposit) => normalizeStatus(deposit.status) === "pending");
  const rejectedDeposits = deposits.filter((deposit) => normalizeStatus(deposit.status) === "rejected");

function exportDepositsToPDF() {
  const logoUrl = "/logo.png";

  const reportDate = new Date().toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const totalApprovedAmount = filteredDeposits
    .filter((deposit) => normalizeStatus(deposit.status) === "approved")
    .reduce(
      (sum, deposit) =>
        sum + Number(deposit.wallet_credit || deposit.amount || 0),
      0
    );

  const pendingCount = filteredDeposits.filter(
    (deposit) => normalizeStatus(deposit.status) === "pending"
  ).length;

  const approvedCount = filteredDeposits.filter(
    (deposit) => normalizeStatus(deposit.status) === "approved"
  ).length;

  const rejectedCount = filteredDeposits.filter(
    (deposit) => normalizeStatus(deposit.status) === "rejected"
  ).length;

  const rowsHtml = filteredDeposits
    .map((deposit) => {
      return `
        <tr>
          <td>${shortDepositId(deposit.id)}</td>
          <td>${deposit.user_id}</td>
          <td>${formatMoney(deposit.amount, deposit.currency || "PHP")}</td>
          <td>${formatMoney(deposit.wallet_credit || deposit.amount)}</td>
          <td>${deposit.method || "Manual Payment"}</td>
          <td>${deposit.reference_number || "—"}</td>
          <td>${normalizeStatus(deposit.status)}</td>
          <td>${getReviewedLabel(deposit, profiles)}</td>
          <td>${deposit.reviewed_at ? `${formatDate(deposit.reviewed_at)} ${formatTime(deposit.reviewed_at)}` : "—"}</td>
          <td>${formatDate(deposit.created_at)} ${formatTime(deposit.created_at)}</td>
        </tr>
      `;
    })
    .join("");

  const printWindow = window.open("", "_blank", "width=1200,height=900");

  if (!printWindow) {
    alert("Please allow popups to export PDF.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Deposits / Payments Report</title>
        <style>
          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, Helvetica, sans-serif;
            color: #0f172a;
            background: #ffffff;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .logo {
            width: 160px;
            max-height: 70px;
            object-fit: contain;
          }

          h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 900;
          }

          .muted {
            color: #64748b;
            font-size: 13px;
            font-weight: 700;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
            margin-bottom: 24px;
          }

          .card {
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 16px;
            background: #f8fafc;
          }

          .card span {
            display: block;
            font-size: 11px;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .card strong {
            display: block;
            margin-top: 8px;
            font-size: 22px;
            font-weight: 900;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            border: 1px solid #e2e8f0;
          }

          th {
            background: #f8fafc;
            color: #64748b;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.08em;
            font-weight: 900;
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            text-align: left;
          }

          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 700;
          }

          .footer {
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
          }

          @media print {
            body {
              padding: 18px;
            }

            table {
              font-size: 10px;
            }

            th, td {
              padding: 8px;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <div class="brand">
            <img src="${logoUrl}" class="logo" />
            <div>
              <h1>Deposits / Payments Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
          </div>

          <div class="muted">
            <div>Total Records: ${filteredDeposits.length}</div>
            <div>Status Filter: ${statusFilter}</div>
            <div>Method Filter: ${methodFilter}</div>
          </div>
        </div>

        <div class="summary">
          <div class="card">
            <span>Pending</span>
            <strong>${pendingCount}</strong>
          </div>

          <div class="card">
            <span>Approved</span>
            <strong>${approvedCount}</strong>
          </div>

          <div class="card">
            <span>Rejected</span>
            <strong>${rejectedCount}</strong>
          </div>

          <div class="card">
            <span>Approved Amount</span>
            <strong>${formatMoney(totalApprovedAmount)}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Deposit ID</th>
              <th>User ID</th>
              <th>Paid Amount</th>
              <th>Wallet Credit</th>
              <th>Method</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Reviewed By</th>
              <th>Reviewed At</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            ${
              rowsHtml ||
              `<tr>
                <td colspan="10" style="text-align:center; padding: 32px;">
                  No deposit records found.
                </td>
              </tr>`
            }
          </tbody>
        </table>

        <div class="footer">
          Ascend Service · Elevate Your Social Presence
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Deposits / Payments
            </h2>

            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Review, approve, reject, and monitor customer deposit requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                loadDeposits();
                loadPaymentMethods();
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>

<button
  type="button"
  onClick={exportDepositsToPDF}
  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
>
  <Banknote size={17} />
  Export PDF
</button>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Pending Deposits"
            value={String(stats.pending)}
            subtitle="Awaiting review"
            icon={<Clock3 size={26} />}
            tone="orange"
          />

          <StatCard
            title="Approved Today"
            value={String(stats.approvedToday)}
            subtitle="Total requests approved"
            icon={<CheckCircle2 size={26} />}
            tone="green"
          />

          <StatCard
            title="Rejected Today"
            value={String(stats.rejectedToday)}
            subtitle="Total requests rejected"
            icon={<XCircle size={26} />}
            tone="red"
          />

          <StatCard
            title="Total Approved Amount"
            value={formatMoney(stats.totalApprovedAmount)}
            subtitle="Across all approved deposits"
            icon={<Wallet size={26} />}
            tone="green"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-4 border-b border-slate-100 p-5 xl:grid-cols-[1.3fr_0.55fr_0.55fr_0.55fr]">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search deposits by ID, user, reference number..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              <select
                value={methodFilter}
                onChange={(event) => setMethodFilter(event.target.value)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                <option value="all">All Methods</option>
                {methodOptions.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setMethodFilter("all");
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Filter size={17} />
                Clear Filters
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Deposit ID</th>
                    <th className="px-5 py-4 text-left">User</th>
                    <th className="px-5 py-4 text-left">Paid Amount</th>
                    <th className="px-5 py-4 text-left">Wallet Credit</th>
                    <th className="px-5 py-4 text-left">Method</th>
                    <th className="px-5 py-4 text-left">Reference</th>
                    <th className="px-5 py-4 text-left">Proof</th>
                    <th className="px-5 py-4 text-left">Status</th>
                    <th className="px-5 py-4 text-left">Reviewed By</th>
                    <th className="px-5 py-4 text-left">Date</th>
                    <th className="px-5 py-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDeposits.map((deposit) => {
                    const method = getPaymentMethod(deposit.method);
                    const isPending = normalizeStatus(deposit.status) === "pending";

                    return (
                      <tr key={deposit.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top font-black text-emerald-700">
                          {shortDepositId(deposit.id)}
                        </td>

<td className="px-5 py-5 align-top">
  <p className="font-black text-slate-700">
    {getUserDisplayName(deposit.user_id, profiles)}
  </p>
  <p className="mt-1 max-w-[150px] truncate text-xs font-semibold text-slate-400">
    {shortUserId(deposit.user_id)}
  </p>
</td>

                        <td className="px-5 py-5 align-top font-black text-blue-600">
                          {formatMoney(deposit.amount, deposit.currency || "PHP")}
                        </td>

                        <td className="px-5 py-5 align-top font-black text-emerald-600">
                          {formatMoney(deposit.wallet_credit || deposit.amount)}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <PaymentMethodBadge methodName={deposit.method} method={method} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="max-w-[170px] truncate font-semibold text-slate-600">
                            {deposit.reference_number || "—"}
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          {deposit.proof_url ? (
                            <a
                              href={deposit.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                            >
                              <img
                                src={deposit.proof_url}
                                alt="Payment proof"
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ) : (
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                              <ImageIcon size={20} />
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge status={deposit.status} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="max-w-[170px] truncate font-black text-slate-700">
                            {getReviewedLabel(deposit, profiles)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {deposit.reviewed_at
                              ? `${formatDate(deposit.reviewed_at)} · ${formatTime(deposit.reviewed_at)}`
                              : "Awaiting review"}
                          </p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-slate-700">{formatDate(deposit.created_at)}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{formatTime(deposit.created_at)}</p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <ActionButton
                              title="Review deposit"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowRejectBox(false);
                                setRejectReason("");
                                setMessage("");
                              }}
                            >
                              <Eye size={16} />
                            </ActionButton>

                            <ActionButton
                              title="Approve deposit"
                              onClick={() => approveDeposit(deposit)}
                              disabled={!isPending || approving || rejecting}
                              tone="green"
                            >
                              {approving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </ActionButton>

                            <ActionButton
                              title="Reject deposit"
                              onClick={() => {
                                setSelectedDeposit(deposit);
                                setShowRejectBox(true);
                                setRejectReason("");
                                setMessage("");
                              }}
                              disabled={!isPending || approving || rejecting}
                              tone="red"
                            >
                              <X size={16} />
                            </ActionButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDeposits.length <= 0 && (
                    <tr>
                      <td colSpan={11} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-sm flex-col items-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                            <Wallet size={26} />
                          </div>
                          <h3 className="mt-4 text-lg font-black text-slate-950">No deposit requests found</h3>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            Try clearing your search or filters.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing <span className="font-black text-slate-800">{filteredDeposits.length}</span> of{" "}
                <span className="font-black text-slate-800">{deposits.length}</span> deposits
              </p>

              <p>{loading ? "Loading deposits..." : "Auto-refreshing every 15 seconds"}</p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity size={18} className="text-emerald-600" />
                <h3 className="text-lg font-black text-slate-950">Payment Health</h3>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-slate-600">Pending Review</span>
                  <span className="font-black text-orange-600">{stats.pending}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-slate-600">Manual Methods</span>
                  <span className="font-black text-blue-600">{methodOptions.length}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-slate-600">Rejected Requests</span>
                  <span className="font-black text-red-600">{rejectedDeposits.length}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-3">
                  <span className="font-semibold text-slate-600">Avg Approval Time</span>
                  <span className="font-black text-slate-700">Manual</span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <RefreshCw size={18} className="text-emerald-600" />
                <h3 className="text-lg font-black text-slate-950">Quick Actions</h3>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  View Pending Only
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setMethodFilter("all");
                    setSearch("");
                    const highValue = deposits.find((deposit) => Number(deposit.wallet_credit || deposit.amount || 0) >= 1000);
                    if (highValue) {
                      setSelectedDeposit(highValue);
                      setShowRejectBox(false);
                    }
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Open High Value Deposit
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("rejected")}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Review Rejected
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => setMethodFilter("all")}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cash Account Summary
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-600" />
                <h3 className="text-lg font-black text-slate-950">Pending Queue</h3>
              </div>

              <div className="space-y-3">
                {pendingDeposits.slice(0, 4).map((deposit) => (
                  <button
                    key={deposit.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeposit(deposit);
                      setShowRejectBox(false);
                      setRejectReason("");
                    }}
                    className="w-full rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-800">{shortDepositId(deposit.id)}</p>
                      <p className="text-sm font-black text-emerald-600">
                        {formatMoney(deposit.wallet_credit || deposit.amount)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {deposit.method} · {formatDate(deposit.created_at)}
                    </p>
                  </button>
                ))}

                {pendingDeposits.length <= 0 && (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                    No pending deposits.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedDeposit && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
          <div className="my-8 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Review Deposit</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Verify payment details before approving or rejecting.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedDeposit(null);
                  setShowRejectBox(false);
                  setRejectReason("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                disabled={approving || rejecting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_360px] lg:p-6">
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Deposit ID" value={shortDepositId(selectedDeposit.id)} />
                  <InfoBlock
  label="User"
  value={
    <div>
      <p>{getUserDisplayName(selectedDeposit.user_id, profiles)}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">
        {shortUserId(selectedDeposit.user_id)}
      </p>
    </div>
  }
/>
                  <InfoBlock
                    label="Paid Amount"
                    value={formatMoney(selectedDeposit.amount, selectedDeposit.currency || "PHP")}
                    valueClassName="text-blue-600"
                  />
                  <InfoBlock
                    label="Wallet Credit"
                    value={formatMoney(selectedDeposit.wallet_credit || selectedDeposit.amount)}
                    valueClassName="text-emerald-600"
                  />
                  <InfoBlock
                    label="Conversion Rate"
                    value={`1 ${selectedDeposit.currency || "PHP"} = ₱${Number(
                      selectedDeposit.conversion_rate || 1,
                    ).toFixed(2)}`}
                  />
                  <InfoBlock label="Status" value={<StatusBadge status={selectedDeposit.status} />} />
                  <InfoBlock
                    label="Reviewed By"
                    value={getReviewedLabel(selectedDeposit, profiles)}
                  />
                  <InfoBlock
                    label="Reviewed At"
                    value={
                      selectedDeposit.reviewed_at
                        ? `${formatDate(selectedDeposit.reviewed_at)} · ${formatTime(selectedDeposit.reviewed_at)}`
                        : "Not reviewed yet"
                    }
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                    Payment Method
                  </p>

                  <div className="mt-3">
                    <PaymentMethodBadge
                      methodName={selectedDeposit.method}
                      method={getPaymentMethod(selectedDeposit.method)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBlock label="Reference Number" value={selectedDeposit.reference_number || "—"} />
                  <InfoBlock
                    label="Submitted Date"
                    value={`${formatDate(selectedDeposit.created_at)} · ${formatTime(selectedDeposit.created_at)}`}
                  />
                </div>

                {selectedDeposit.reject_reason && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">
                      Reject Reason
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-red-700">
                      {selectedDeposit.reject_reason}
                    </p>
                  </div>
                )}

                {showRejectBox && (
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Rejection Reason
                    </label>

                    <textarea
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Example: Invalid reference number, wrong amount, unclear proof..."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">Payment Proof</p>

                  {selectedDeposit.proof_url && (
                    <a
                      href={selectedDeposit.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-black text-emerald-700"
                    >
                      Open
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>

                {selectedDeposit.proof_url ? (
                  <a href={selectedDeposit.proof_url} target="_blank" rel="noreferrer">
                    <img
                      src={selectedDeposit.proof_url}
                      alt="Payment proof"
                      className="h-[470px] w-full rounded-3xl border border-slate-200 bg-slate-50 object-contain"
                    />
                  </a>
                ) : (
                  <div className="flex h-[470px] w-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-slate-400">
                    <ImageIcon size={42} />
                    <p className="mt-3 text-sm font-bold">No proof uploaded</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 lg:flex-row lg:p-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedDeposit(null);
                  setShowRejectBox(false);
                  setRejectReason("");
                }}
                disabled={approving || rejecting}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              {selectedDeposit.status === "pending" && (
                <>
                  {!showRejectBox ? (
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(true)}
                      disabled={approving || rejecting}
                      className="rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={rejectDeposit}
                      disabled={approving || rejecting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {rejecting && <Loader2 size={17} className="animate-spin" />}
                      {rejecting ? "Rejecting..." : "Confirm Reject"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => approveDeposit(selectedDeposit)}
                    disabled={approving || rejecting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {approving && <Loader2 size={17} className="animate-spin" />}
                    {approving ? "Approving..." : "Approve"}
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

"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Crown,
  Diamond,
  Gift,
  Info,
  Link2,
  RefreshCw,
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type ProfileData = {
  id: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
  balance?: number | string | null;
};

type ReferralRecord = {
  id: string;
  referrer_id?: string | null;
  referred_user_id?: string | null;
  referred_username?: string | null;
  created_at: string;
  total_deposits?: number | string | null;
  total_commission?: number | string | null;
  commission_rate?: number | string | null;
  is_qualified?: boolean | null;
  status?: string | null;
};

type CommissionRecord = {
  id: string;
  referrer_id?: string | null;
  referred_user_id?: string | null;
  referred_username?: string | null;
  deposit_amount?: number | string | null;
  commission_rate?: number | string | null;
  commission_amount?: number | string | null;
  used_amount?: number | string | null;
  status?: string | null;
  created_at: string;
};

type TransferRecord = {
  id: string;
  amount: number | string;
  status: string;
  created_at: string;
};

type AffiliateLevel = {
  level: number;
  name: string;
  requiredDeposits: number;
  commissionRate: number;
  icon: any;
};

const AFFILIATE_LEVELS: AffiliateLevel[] = [
  {
    level: 1,
    name: "Starter Affiliate",
    requiredDeposits: 0,
    commissionRate: 1.25,
    icon: Star,
  },
  {
    level: 2,
    name: "Active Affiliate",
    requiredDeposits: 12000,
    commissionRate: 1.5,
    icon: ShieldCheck,
  },
  {
    level: 3,
    name: "Pro Affiliate",
    requiredDeposits: 35000,
    commissionRate: 2,
    icon: Crown,
  },
  {
    level: 4,
    name: "Elite Affiliate",
    requiredDeposits: 80000,
    commissionRate: 2.5,
    icon: Diamond,
  },
  {
    level: 5,
    name: "Ascend Partner",
    requiredDeposits: 200000,
    commissionRate: 3,
    icon: Trophy,
  },
];

const DEFAULT_MIN_TRANSFER_AMOUNT = 10;

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNumber(value: number | string | null | undefined) {
  return toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatPercent(value: number | string | null | undefined) {
  return `${toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits: 2,
  })}%`;
}

function getCurrentAffiliateLevel(totalReferralDeposits: number) {
  return AFFILIATE_LEVELS.reduce((current, level) => {
    if (totalReferralDeposits >= level.requiredDeposits) {
      return level;
    }

    return current;
  }, AFFILIATE_LEVELS[0]);
}

function getNextAffiliateLevel(currentLevel: number) {
  return AFFILIATE_LEVELS.find((level) => level.level === currentLevel + 1);
}

function getDisplayName(profile: ProfileData | null) {
  if (!profile) return "User";

  if (profile.username) return profile.username;
  if (profile.full_name) return profile.full_name;

  const name = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return name || "User";
}

function getAvailableCommissionAmount(item: CommissionRecord) {
  const status = String(item.status || "").toLowerCase();
  if (status !== "available") return 0;

  const commissionAmount = toNumber(item.commission_amount);
  const usedAmount = toNumber(item.used_amount);

  return Math.max(0, commissionAmount - usedAmount);
}

function cleanStatus(status?: string | null) {
  return String(status || "").toLowerCase().trim();
}

function getStatusBadgeClass(status?: string | null) {
  const clean = cleanStatus(status);

  if (["completed", "approved", "success", "available"].includes(clean)) {
    return "bg-green-100 text-green-700";
  }

  if (["pending", "processing"].includes(clean)) {
    return "bg-orange-100 text-orange-700";
  }

  if (["used", "transferred"].includes(clean)) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-700";
}

function formatStatus(status?: string | null) {
  if (!status) return "Available";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AffiliatesPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [allReferrals, setAllReferrals] = useState<ReferralRecord[]>([]);
  const [allCommissions, setAllCommissions] = useState<CommissionRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [loadingAllReferrals, setLoadingAllReferrals] = useState(false);
  const [loadingAllCommissions, setLoadingAllCommissions] = useState(false);

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showReferralsModal, setShowReferralsModal] = useState(false);
  const [showCommissionsModal, setShowCommissionsModal] = useState(false);

  const [transferAmount, setTransferAmount] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const [minTransferAmount, setMinTransferAmount] = useState(
    DEFAULT_MIN_TRANSFER_AMOUNT,
  );

  const { formatAmount } = useDisplayCurrency();

  async function loadAffiliateMinTransfer() {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "affiliate_min_transfer")
      .maybeSingle();

    if (error) {
      console.warn("AFFILIATE_MIN_TRANSFER_SETTING_ERROR:", error.message);
      setMinTransferAmount(DEFAULT_MIN_TRANSFER_AMOUNT);
      return DEFAULT_MIN_TRANSFER_AMOUNT;
    }

    const settingValue = Number(data?.value || DEFAULT_MIN_TRANSFER_AMOUNT);
    const finalValue =
      Number.isFinite(settingValue) && settingValue > 0
        ? settingValue
        : DEFAULT_MIN_TRANSFER_AMOUNT;

    setMinTransferAmount(finalValue);
    return finalValue;
  }

  async function loadAffiliateData() {
    setLoading(true);
    await loadAffiliateMinTransfer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setReferrals([]);
      setCommissions([]);
      setTransferHistory([]);
      setAllReferrals([]);
      setAllCommissions([]);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.warn("AFFILIATE_PROFILE_LOAD_ERROR:", profileError.message);
    }

    setProfile((profileData || null) as ProfileData | null);

    const { data: referralData, error: referralError } = await supabase
      .from("affiliate_referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (referralError) {
      console.warn("AFFILIATE_REFERRALS_NOT_READY:", referralError.message);
      setReferrals([]);
    } else {
      setReferrals((referralData || []) as ReferralRecord[]);
    }

    const { data: commissionData, error: commissionError } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (commissionError) {
      console.warn("AFFILIATE_COMMISSIONS_NOT_READY:", commissionError.message);
      setCommissions([]);
    } else {
      setCommissions((commissionData || []) as CommissionRecord[]);
    }

    const { data: transferData, error: transferError } = await supabase
      .from("affiliate_commission_transfers")
      .select("id, amount, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (transferError) {
      console.warn("AFFILIATE_TRANSFERS_NOT_READY:", transferError.message);
      setTransferHistory([]);
    } else {
      setTransferHistory((transferData || []) as TransferRecord[]);
    }

    setLoading(false);
  }

  async function loadAllReferrals() {
    setLoadingAllReferrals(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllReferrals([]);
      setLoadingAllReferrals(false);
      return;
    }

    const { data, error } = await supabase
      .from("affiliate_referrals")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("ALL_AFFILIATE_REFERRALS_ERROR:", error.message);
      setAllReferrals([]);
    } else {
      setAllReferrals((data || []) as ReferralRecord[]);
    }

    setLoadingAllReferrals(false);
  }

  async function loadAllCommissions() {
    setLoadingAllCommissions(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllCommissions([]);
      setLoadingAllCommissions(false);
      return;
    }

    const { data, error } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("ALL_AFFILIATE_COMMISSIONS_ERROR:", error.message);
      setAllCommissions([]);
    } else {
      setAllCommissions((data || []) as CommissionRecord[]);
    }

    setLoadingAllCommissions(false);
  }

  function openReferralsModal() {
    setShowReferralsModal(true);
    loadAllReferrals();
  }

  function openCommissionsModal() {
    setShowCommissionsModal(true);
    loadAllCommissions();
  }

  useEffect(() => {
    loadAffiliateData();
  }, []);

  const referralCode = useMemo(() => {
    if (profile?.referral_code) return profile.referral_code;
    if (profile?.id) return profile.id;
    return "user";
  }, [profile]);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `https://ascend-service.org/register?ref=${referralCode}`;

  const totalReferrals = referrals.length;

  const qualifiedReferrals = referrals.filter(
    (item) => toNumber(item.total_deposits) > 0,
  ).length;

  const totalReferralDeposits = referrals.reduce(
    (total, item) => total + toNumber(item.total_deposits),
    0,
  );

  const currentLevel = getCurrentAffiliateLevel(totalReferralDeposits);
  const nextLevel = getNextAffiliateLevel(currentLevel.level);

  const remainingDepositsToNext = nextLevel
    ? Math.max(0, nextLevel.requiredDeposits - totalReferralDeposits)
    : 0;

  const progressPercent = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalReferralDeposits - currentLevel.requiredDeposits) /
            (nextLevel.requiredDeposits - currentLevel.requiredDeposits)) *
            100,
        ),
      )
    : 100;

  const availableCommission = commissions.reduce(
    (total, item) => total + getAvailableCommissionAmount(item),
    0,
  );

  const totalEarnedCommission = commissions.reduce(
    (total, item) => total + toNumber(item.commission_amount),
    0,
  );

  const totalTransferred = transferHistory.reduce(
    (total, item) => total + toNumber(item.amount),
    0,
  );

  const amountToTransfer = toNumber(transferAmount);

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

  async function shareReferralLink() {
    if (navigator.share) {
      await navigator.share({
        title: "Join Ascend Service",
        text: "Register on Ascend Service using my referral link.",
        url: referralLink,
      });
      return;
    }

    copyReferralLink();
  }

  async function transferCommissionToBalance() {
    if (transferring) return;

    setTransferMessage("");

    const amount = toNumber(transferAmount);

    if (amount < minTransferAmount) {
      setTransferMessage(
        `Minimum transfer amount is ${formatAmount(minTransferAmount)}.`,
      );
      return;
    }

    if (amount > availableCommission) {
      setTransferMessage("Transfer amount is higher than your available commission.");
      return;
    }

    setTransferring(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setTransferMessage("You need to login again.");
      setTransferring(false);
      return;
    }

    try {
      const response = await fetch("/api/affiliate/transfer-commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setTransferMessage(
          result.message || "Failed to transfer affiliate commission.",
        );
        setTransferring(false);
        return;
      }

      setTransferMessage(
        result.message ||
          `${formatAmount(amount)} commission transferred to your balance.`,
      );

      setTransferAmount("");

      await loadAffiliateData();

      if (showCommissionsModal) {
        await loadAllCommissions();
      }
    } catch {
      setTransferMessage("Failed to transfer affiliate commission.");
    }

    setTransferring(false);
  }

  if (loading) {
    return (
      <DashboardGuard>
        <DashboardLayout>
          <div className="min-w-0">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm font-black text-slate-500">
                Loading affiliate dashboard...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </DashboardGuard>
    );
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="min-w-0">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-slate-950">Affiliates</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
              Invite friends and earn commission from every approved deposit made by your referrals.
            </p>
            </div>

          <section className="mt-6 min-w-0 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white shadow-sm sm:p-6 lg:p-8">
            <div className="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_1.05fr_220px] lg:items-center lg:gap-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Affiliate Level
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="min-w-0 break-words text-2xl font-black sm:text-3xl lg:text-5xl">
                      {currentLevel.name}
                    </h2>

                    <span className="rounded-xl bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20">
                      Level {currentLevel.level}
                    </span>
                  </div>

                  <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-blue-50">
                    All approved deposits from referred users are qualified for affiliate commission.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Qualified Referral Progress
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <p className="min-w-0 break-words text-2xl font-black sm:text-3xl lg:text-4xl">
                      {formatAmount(totalReferralDeposits)}
                    </p>

                    <p className="mb-1 text-xl font-semibold text-blue-100">
                      / {nextLevel ? formatAmount(nextLevel.requiredDeposits) : "Max"}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-blue-200"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-sm font-black text-white">
                      {progressPercent.toFixed(1)}%
                    </p>
                  </div>

                  <p className="mt-4 text-base font-semibold text-blue-50">
                    {nextLevel ? (
                      <>
                        {formatAmount(remainingDepositsToNext)} more referral deposits to reach{" "}
                        <span className="font-black text-white">{nextLevel.name}</span>
                      </>
                    ) : (
                      <span className="font-black text-white">
                        Maximum affiliate level reached
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/70 bg-white/10 shadow-2xl backdrop-blur sm:h-40 sm:w-40">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                        <User size={64} className="text-white sm:size-[72px]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

          <section className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Users}
                title="Total Referrals"
                value={formatNumber(totalReferrals)}
                subtitle="Users registered using your link"
                color="bg-blue-100 text-blue-600"
              />

              <StatCard
                icon={CheckCircle2}
                title="Earning Referrals"
                value={formatNumber(qualifiedReferrals)}
                subtitle="Referrals with approved deposits"
                color="bg-green-100 text-green-600"
              />

              <StatCard
                icon={Wallet}
                title="Available Commission"
                value={formatAmount(availableCommission)}
                subtitle="Ready to transfer to balance"
                color="bg-orange-100 text-orange-600"
                buttonLabel="Transfer"
                onButtonClick={() => setShowCommissionModal(true)}
              />

              <StatCard
                icon={Gift}
                title="Commission Rate"
                value={formatPercent(currentLevel.commissionRate)}
                subtitle={`${currentLevel.name} rate`}
                color="bg-purple-100 text-purple-600"
              />
            </section>

          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 text-xl font-black text-slate-950">
                    Affiliate Level Path
                  </h3>
                  <Info size={16} className="text-slate-400" />
                </div>

                <div className="mt-7 overflow-x-auto pb-2">
                  <div className="relative grid min-w-[900px] gap-4 md:min-w-0 md:grid-cols-5">
                    {AFFILIATE_LEVELS.map((level) => {
                      const Icon = level.icon;
                      const isCurrent = level.level === currentLevel.level;

                      return (
                        <div
                          key={level.level}
                          className={`rounded-2xl border p-4 text-center ${
                            isCurrent
                              ? "border-blue-300 bg-blue-50"
                              : "border-slate-100 bg-white"
                          }`}
                        >
                          <div
                            className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${
                              isCurrent
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <Icon size={21} />
                          </div>

                          <p
                            className={`mt-3 text-sm font-black ${
                              isCurrent ? "text-blue-700" : "text-slate-900"
                            }`}
                          >
                            {level.name}
                          </p>

                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Required: {formatAmount(level.requiredDeposits)}
                          </p>

                          <p className="mt-2 text-sm font-black text-green-600">
                            {formatPercent(level.commissionRate)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

            <section className="min-w-0 rounded-3xl bg-[#061c42] p-5 text-white shadow-sm sm:p-6">
                <h3 className="text-xl font-black">Affiliate Summary</h3>

                <div className="mt-6 space-y-4">
                  <SummaryRow label="Current Level" value={currentLevel.name} />
                  <SummaryRow
                    label="Commission Rate"
                    value={formatPercent(currentLevel.commissionRate)}
                  />
                  <SummaryRow
                    label="Referral Deposits"
                    value={formatAmount(totalReferralDeposits)}
                  />
                  <SummaryRow
                    label="Total Earned"
                    value={formatAmount(totalEarnedCommission)}
                  />
                  <SummaryRow
                    label="Transferred"
                    value={formatAmount(totalTransferred)}
                  />
                  <SummaryRow
                    label="Next Level"
                    value={nextLevel?.name || "Max Level"}
                  />
                </div>
              </section>
            </div>

          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Link2 size={21} />
                  </div>

                  <div>
                    <h3 className="min-w-0 text-xl font-black text-slate-950">
                      Referral Link
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Share your link and earn commission from approved deposits.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:flex-row">
                  <input
                    readOnly
                    value={referralLink}
                    className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm font-bold text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className="flex h-12 w-full items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 text-sm font-black text-blue-600 transition hover:bg-blue-50 sm:w-auto sm:border-l sm:border-t-0"
                  >
                    <Copy size={16} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
                  <button
                    type="button"
                    onClick={shareReferralLink}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 sm:w-auto"
                  >
                    <Share2 size={17} />
                    Share Referral Link
                  </button>

                  <button
                    type="button"
                    onClick={openReferralsModal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    <Users size={17} />
                    View All Referrals
                  </button>
                </div>
              </section>

            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <h3 className="min-w-0 text-xl font-black text-slate-950">
                    Commission History
                  </h3>

                  <button
                    type="button"
                    onClick={openCommissionsModal}
                    className="text-sm font-black text-blue-600 transition hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <CommissionList
                  items={commissions.slice(0, 5)}
                  emptyText="No commission yet."
                  formatAmount={formatAmount}
                />
              </section>
            </div>

          <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <h3 className="min-w-0 text-xl font-black text-slate-950">
                    Recent Referrals
                  </h3>

                  <button
                    type="button"
                    onClick={openReferralsModal}
                    className="text-sm font-black text-blue-600 transition hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <ReferralList
                  items={referrals}
                  emptyText="No referrals yet."
                  formatAmount={formatAmount}
                />
              </section>

            <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="min-w-0 text-xl font-black text-slate-950">
                  Transfer History
                </h3>

                <TransferList
                  items={transferHistory}
                  emptyText="No transfers yet."
                  formatAmount={formatAmount}
                />
              </section>
            </div>

          {showCommissionModal && (
            <Modal
              title="Transfer Commission to Balance"
              onClose={() => setShowCommissionModal(false)}
            >
              <div className="space-y-5">
                <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-orange-700">
                    Available Commission
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-slate-950">
                    {formatAmount(availableCommission)}
                  </h3>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Minimum transfer amount: {formatAmount(minTransferAmount)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Amount to Transfer
                  </label>

                  <input
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    type="number"
                    min={minTransferAmount}
                    step="0.01"
                    placeholder="Enter amount"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  />
                </div>

                {transferMessage && (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
                      transferMessage.toLowerCase().includes("transferred")
                        ? "border-green-100 bg-green-50 text-green-600"
                        : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    {transferMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={transferCommissionToBalance}
                  disabled={transferring || amountToTransfer <= 0}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {transferring ? "Transferring..." : "Transfer to Balance"}
                </button>
              </div>
            </Modal>
          )}

          {showReferralsModal && (
            <Modal title="All Referrals" onClose={() => setShowReferralsModal(false)}>
              {loadingAllReferrals ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  Loading referrals...
                </div>
              ) : (
                <ReferralList
                  items={allReferrals}
                  emptyText="No referrals found."
                  formatAmount={formatAmount}
                  large
                />
              )}
            </Modal>
          )}

          {showCommissionsModal && (
            <Modal
              title="All Commission History"
              onClose={() => setShowCommissionsModal(false)}
            >
              {loadingAllCommissions ? (
                <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                  Loading commissions...
                </div>
              ) : (
                <CommissionList
                  items={allCommissions}
                  emptyText="No commission history found."
                  formatAmount={formatAmount}
                  large
                />
              )}
            </Modal>
          )}
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  buttonLabel,
  onButtonClick,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}) {
  return (
    <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={26} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 min-w-0 break-words text-2xl font-black text-slate-950">
            {value}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-400">
            {subtitle}
          </p>

          {buttonLabel && onButtonClick && (
            <button
              type="button"
              onClick={onButtonClick}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
            >
              {buttonLabel}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
      <p className="min-w-0 flex-1 text-base font-semibold text-blue-50">{label}</p>
      <p className="min-w-0 max-w-[55%] break-words text-right text-base font-black text-white">{value}</p>
    </div>
  );
}

function ReferralList({
  items,
  emptyText,
  formatAmount,
  large = false,
}: {
  items: ReferralRecord[];
  emptyText: string;
  formatAmount: (value: number | string | null | undefined) => string;
  large?: boolean;
}) {
  return (
    <div className={`mt-5 min-w-0 overflow-hidden rounded-2xl border border-slate-100 ${large ? "" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4 text-left font-black">Referral</th>
              <th className="p-4 text-left font-black">Deposits</th>
              <th className="p-4 text-left font-black">Commission</th>
              <th className="p-4 text-left font-black">Status</th>
              <th className="p-4 text-left font-black">Date</th>
            </tr>
          </thead>

          <tbody>
            {items.length <= 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-sm font-semibold text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isEarning = toNumber(item.total_deposits) > 0;

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="max-w-[220px] truncate p-4 font-black text-slate-800">
                      {item.referred_username || "Referral User"}
                    </td>

                    <td className="whitespace-nowrap p-4 font-black text-slate-700">
                      {formatAmount(item.total_deposits)}
                    </td>

                    <td className="whitespace-nowrap p-4 font-black text-green-600">
                      {formatAmount(item.total_commission)}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          isEarning
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isEarning ? "Earning" : "Registered"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap p-4 font-semibold text-slate-500">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommissionList({
  items,
  emptyText,
  formatAmount,
  large = false,
}: {
  items: CommissionRecord[];
  emptyText: string;
  formatAmount: (value: number | string | null | undefined) => string;
  large?: boolean;
}) {
  return (
    <div className={`mt-5 min-w-0 overflow-hidden rounded-2xl border border-slate-100 ${large ? "" : ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4 text-left font-black">Referral</th>
              <th className="p-4 text-left font-black">Deposit</th>
              <th className="p-4 text-left font-black">Rate</th>
              <th className="p-4 text-left font-black">Commission</th>
              <th className="p-4 text-left font-black">Used</th>
              <th className="p-4 text-left font-black">Status</th>
              <th className="p-4 text-left font-black">Date</th>
            </tr>
          </thead>

          <tbody>
            {items.length <= 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-sm font-semibold text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="max-w-[220px] truncate p-4 font-black text-slate-800">
                    {item.referred_username || "Referral User"}
                  </td>

                  <td className="whitespace-nowrap p-4 font-black text-slate-700">
                    {formatAmount(item.deposit_amount)}
                  </td>

                  <td className="whitespace-nowrap p-4 font-black text-blue-600">
                    {formatPercent(item.commission_rate)}
                  </td>

                  <td className="whitespace-nowrap p-4 font-black text-green-600">
                    {formatAmount(item.commission_amount)}
                  </td>

                  <td className="whitespace-nowrap p-4 font-black text-orange-600">
                    {formatAmount(item.used_amount)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                        item.status,
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap p-4 font-semibold text-slate-500">
                    {formatDate(item.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransferList({
  items,
  emptyText,
  formatAmount,
}: {
  items: TransferRecord[];
  emptyText: string;
  formatAmount: (value: number | string | null | undefined) => string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4 text-left font-black">Amount</th>
              <th className="p-4 text-left font-black">Status</th>
              <th className="p-4 text-left font-black">Date</th>
            </tr>
          </thead>

          <tbody>
            {items.length <= 0 ? (
              <tr>
                <td colSpan={3} className="p-10 text-center text-sm font-semibold text-slate-500">
                  {emptyText}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap p-4 font-black text-green-600">
                    {formatAmount(item.amount)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(
                        item.status,
                      )}`}
                    >
                      {formatStatus(item.status)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap p-4 font-semibold text-slate-500">
                    {formatDateTime(item.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
      <div className="my-4 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:items-center sm:p-6">
          <h3 className="min-w-0 text-xl font-black text-slate-950 sm:text-2xl">{title}</h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={21} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

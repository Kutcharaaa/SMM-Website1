"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
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
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const MIN_TRANSFER_AMOUNT = 10;

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  const { formatAmount } = useDisplayCurrency();

  async function loadAffiliateData() {
    setLoading(true);

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

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
      .select("*")
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
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("AFFILIATE_ALL_REFERRALS_NOT_READY:", error.message);
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
      .order("created_at", { ascending: false })

    if (error) {
      console.warn("AFFILIATE_ALL_COMMISSIONS_NOT_READY:", error.message);
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

  const availableCommission = commissions
    .filter((item) => {
      const status = (item.status || "").toLowerCase();
      return status === "available";
    })
    .reduce((total, item) => {
      const commissionAmount = toNumber(item.commission_amount);
      const usedAmount = toNumber(item.used_amount);

      return total + Math.max(0, commissionAmount - usedAmount);
    }, 0);

  const totalEarnedCommission = commissions.reduce(
    (total, item) => total + toNumber(item.commission_amount),
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

  if (amount < MIN_TRANSFER_AMOUNT) {
    setTransferMessage(
      `Minimum transfer amount is ${formatAmount(MIN_TRANSFER_AMOUNT)}.`,
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
        <main className="min-h-screen bg-slate-50 text-slate-950">
          <DashboardSidebar />

          <section className="min-h-screen lg:ml-[260px]">
            <DashboardTopbar />

            <div className="p-4 lg:p-8">
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

                <p className="mt-4 text-sm font-bold text-slate-500">
                  Loading affiliate dashboard...
                </p>
              </div>
            </div>
          </section>
        </main>
      </DashboardGuard>
    );
  }

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <DashboardSidebar />

        <section className="min-h-screen lg:ml-[260px]">
          <DashboardTopbar />

          <div className="space-y-6 p-4 lg:p-8">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-7 text-white shadow-xl shadow-blue-950/10">
              <div className="grid gap-7 xl:grid-cols-[1.1fr_0.75fr_1.3fr_170px] xl:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Affiliate Level
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h1 className="text-4xl font-black tracking-tight md:text-5xl">
                      {currentLevel.name}
                    </h1>

                    <span className="rounded-2xl bg-white/15 px-4 py-2 text-sm font-black">
                      Level {currentLevel.level}
                    </span>
                  </div>

                  <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-blue-50">
                    Share your referral link and earn commission from every
                    approved add fund made by your referrals.
                  </p>
                </div>

                <div className="border-white/15 xl:border-l xl:pl-8">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Commission Rate
                  </p>

                  <h2 className="mt-3 text-5xl font-black">
                    {currentLevel.commissionRate}%
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-blue-100">
                    Based on total referred funds
                  </p>
                </div>

                <div className="border-white/15 xl:border-l xl:pl-8">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                      Next Level Progress
                    </p>

                    <p className="text-sm font-black">
                      {nextLevel
                        ? `${formatAmount(totalReferralDeposits)} / ${formatAmount(
                            nextLevel.requiredDeposits,
                          )}`
                        : "Max Level"}
                    </p>
                  </div>

                  <h3 className="mt-3 text-lg font-black">
                    {nextLevel
                      ? `${formatAmount(
                          remainingDepositsToNext,
                        )} more referred funds to unlock ${nextLevel.name}`
                      : "You reached the highest affiliate level."}
                  </h3>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-50">
                    <CheckCircle2 size={17} />
                    Level increases from total approved deposits by referrals.
                  </p>
                </div>

                <div className="flex justify-start xl:justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={getDisplayName(profile)}
                      className="h-32 w-32 rounded-full border-4 border-white/40 object-cover shadow-xl"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/40 bg-white/15 text-4xl font-black shadow-xl">
                      {getDisplayName(profile).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Referrals"
                value={String(totalReferrals)}
                subtitle="Users registered with your link"
                icon={Users}
                color="blue"
              />

              <StatCard
                title="Referral Funds"
                value={formatAmount(totalReferralDeposits)}
                subtitle="Total approved add funds"
                icon={ShieldCheck}
                color="green"
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                    <Wallet size={27} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-600">
                      Available Commission
                    </p>

                    <h3 className="mt-2 text-3xl font-black text-slate-950">
                      {formatAmount(availableCommission)}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      Ready to transfer to balance
                    </p>

                    <button
                      onClick={() => setShowCommissionModal(true)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      Use Commission
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <StatCard
                title="Commission Rate"
                value={`${currentLevel.commissionRate}%`}
                subtitle="Current affiliate level rate"
                icon={Gift}
                color="orange"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">
                      Affiliate Level Path
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      The more approved funds your referrals add, the higher your
                      commission rate.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-8 hidden h-1 bg-slate-200 md:block" />

                    <div className="relative grid gap-4 md:grid-cols-5">
                      {AFFILIATE_LEVELS.map((level) => {
                        const Icon = level.icon;
                        const active =
                          totalReferralDeposits >= level.requiredDeposits;
                        const current = level.level === currentLevel.level;

                        return (
                          <div
                            key={level.level}
                            className={`rounded-2xl border p-5 text-center transition ${
                              current
                                ? "border-blue-300 bg-blue-50 shadow-sm"
                                : active
                                ? "border-green-200 bg-green-50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div
                              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                                current
                                  ? "bg-blue-600 text-white"
                                  : active
                                  ? "bg-green-600 text-white"
                                  : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              <Icon size={28} />
                            </div>

                            <h3 className="mt-4 text-sm font-black text-slate-950">
                              {level.name}
                            </h3>

                            <p className="mt-2 text-xl font-black text-slate-950">
                              {level.commissionRate}%
                            </p>

                            <p className="mt-2 text-sm font-semibold text-slate-500">
                              {formatAmount(level.requiredDeposits)}
                            </p>

                            {current && (
                              <span className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                Current Level
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 shrink-0 text-blue-600" size={20} />

                      <div>
                        <h3 className="font-black text-blue-900">
                          Level Rule
                        </h3>

                        <p className="mt-1 text-sm font-semibold leading-6 text-blue-700">
                          Affiliate levels are now based on the total approved
                          add funds from all users registered using your referral
                          link. Every approved add fund can generate commission.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#071a45] p-6 text-white shadow-sm">
                <h2 className="text-2xl font-black">Affiliate Summary</h2>

                <div className="mt-6 space-y-4">
                  <SummaryRow label="Current Level" value={currentLevel.name} />
                  <SummaryRow label="Total Referrals" value={String(totalReferrals)} />
                  <SummaryRow
                    label="Referral Funds"
                    value={formatAmount(totalReferralDeposits)}
                  />
                  <SummaryRow
                    label="Total Earned"
                    value={formatAmount(totalEarnedCommission)}
                  />
                  <SummaryRow
                    label="Available Commission"
                    value={formatAmount(availableCommission)}
                  />
                  <SummaryRow
                    label="Current Rate"
                    value={`${currentLevel.commissionRate}%`}
                  />
                  <SummaryRow
                    label="Next Level"
                    value={nextLevel ? nextLevel.name : "Max Level"}
                  />
                </div>

                {nextLevel ? (
                  <div className="mt-6 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-blue-100">
                      Need{" "}
                      <span className="font-black text-white">
                        {formatAmount(remainingDepositsToNext)}
                      </span>{" "}
                      more referred funds to reach{" "}
                      <span className="font-black text-white">
                        {nextLevel.name}
                      </span>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-white/10 p-5">
                    <p className="text-sm font-semibold text-blue-100">
                      You already reached the highest affiliate level.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    Referral Link
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Share your permanent referral link. It will not break if you
                    change your username.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={copyReferralLink}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    <Copy size={18} />
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    onClick={shareReferralLink}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <Share2 size={18} />
                    Share
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Link2 className="shrink-0 text-blue-600" size={22} />

                <p className="truncate text-sm font-bold text-slate-600">
                  {referralLink}
                </p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Recent Referrals
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Latest users who registered using your link.
                    </p>
                  </div>

                  <button
                    onClick={openReferralsModal}
                    className="text-sm font-black text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-5 text-left font-black">User</th>
                        <th className="p-5 text-left font-black">Funds Added</th>
                        <th className="p-5 text-left font-black">Commission</th>
                        <th className="p-5 text-left font-black">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {referrals.length <= 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="p-8 text-center text-sm font-semibold text-slate-500"
                          >
                            No referrals yet.
                          </td>
                        </tr>
                      ) : (
                        referrals.map((item) => (
                          <tr
                            key={item.id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                  <User size={18} />
                                </div>

                                <div>
                                  <p className="font-black text-slate-950">
                                    {item.referred_username || "Referral"}
                                  </p>

                                  <p className="text-xs font-semibold text-slate-400">
                                    {formatDate(item.created_at)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-5 font-black text-slate-950">
                              {formatAmount(toNumber(item.total_deposits))}
                            </td>

                            <td className="p-5 font-black text-green-600">
                              {formatAmount(toNumber(item.total_commission))}
                            </td>

                            <td className="p-5">
                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black capitalize text-green-600">
                                {item.status || "active"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Commission History
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Commissions earned from referred add funds.
                    </p>
                  </div>

                  <button
                    onClick={openCommissionsModal}
                    className="text-sm font-black text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-5 text-left font-black">Referral</th>
                        <th className="p-5 text-left font-black">Funds Added</th>
                        <th className="p-5 text-left font-black">Rate</th>
                        <th className="p-5 text-left font-black">Commission</th>
                        <th className="p-5 text-left font-black">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {commissions.length <= 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-sm font-semibold text-slate-500"
                          >
                            No commission history yet.
                          </td>
                        </tr>
                      ) : (
                        commissions.map((item) => {
                          const commissionAmount = toNumber(
                            item.commission_amount,
                          );
                          const usedAmount = toNumber(item.used_amount);
                          const remaining = Math.max(
                            0,
                            commissionAmount - usedAmount,
                          );

                          return (
                            <tr
                              key={item.id}
                              className="border-t border-slate-100 hover:bg-slate-50"
                            >
                              <td className="p-5">
                                <p className="font-black text-slate-950">
                                  {item.referred_username || "Referral"}
                                </p>

                                <p className="text-xs font-semibold text-slate-400">
                                  {formatDate(item.created_at)}
                                </p>
                              </td>

                              <td className="p-5 font-black text-slate-950">
                                {formatAmount(toNumber(item.deposit_amount))}
                              </td>

                              <td className="p-5 font-black text-blue-600">
                                {toNumber(item.commission_rate)}%
                              </td>

                              <td className="p-5">
                                <p className="font-black text-green-600">
                                  {formatAmount(commissionAmount)}
                                </p>

                                {usedAmount > 0 && (
                                  <p className="mt-1 text-xs font-semibold text-slate-400">
                                    Remaining: {formatAmount(remaining)}
                                  </p>
                                )}
                              </td>

                              <td className="p-5">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                                    (item.status || "").toLowerCase() ===
                                    "available"
                                      ? "bg-green-50 text-green-600"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {item.status || "available"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">
                How It Works
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {[
                  {
                    title: "Share Your Link",
                    text: "Send your permanent referral link to friends or clients.",
                    icon: Link2,
                  },
                  {
                    title: "User Registers",
                    text: "When they create an account using your link, they become your referral.",
                    icon: Users,
                  },
                  {
                    title: "Referral Adds Funds",
                    text: "Every approved add fund can generate commission for you.",
                    icon: Wallet,
                  },
                  {
                    title: "Use Commission",
                    text: "Transfer available commission directly to your wallet balance.",
                    icon: Gift,
                  },
                ].map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <Icon size={24} />
                      </div>

                      <p className="mt-5 text-xs font-black text-blue-600">
                        STEP {index + 1}
                      </p>

                      <h3 className="mt-2 font-black text-slate-950">
                        {step.title}
                      </h3>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {step.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {showCommissionModal && (
          <Modal title="Use Commission" onClose={() => setShowCommissionModal(false)}>
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black text-slate-500">
                  Available Commission
                </p>

                <h3 className="mt-2 text-4xl font-black text-slate-950">
                  {formatAmount(availableCommission)}
                </h3>

                <p className="mt-2 text-sm font-semibold text-slate-500">
                  Minimum transfer amount: {formatAmount(MIN_TRANSFER_AMOUNT)}
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
                  min={MIN_TRANSFER_AMOUNT}
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
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                Loading referrals...
              </div>
            ) : allReferrals.length <= 0 ? (
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                No referrals yet.
              </div>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 text-left font-black">User</th>
                      <th className="p-4 text-left font-black">Funds Added</th>
                      <th className="p-4 text-left font-black">Commission</th>
                      <th className="p-4 text-left font-black">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {allReferrals.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-4 font-black text-slate-950">
                          {item.referred_username || "Referral"}
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {formatAmount(toNumber(item.total_deposits))}
                        </td>

                        <td className="p-4 font-black text-green-600">
                          {formatAmount(toNumber(item.total_commission))}
                        </td>

                        <td className="p-4 font-bold text-slate-500">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>
        )}

        {showCommissionsModal && (
          <Modal
            title="All Commissions"
            onClose={() => setShowCommissionsModal(false)}
          >
            {loadingAllCommissions ? (
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                Loading commissions...
              </div>
            ) : allCommissions.length <= 0 ? (
              <div className="p-8 text-center text-sm font-bold text-slate-500">
                No commissions yet.
              </div>
            ) : (
              <div className="max-h-[65vh] overflow-y-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 text-left font-black">Referral</th>
                      <th className="p-4 text-left font-black">Funds Added</th>
                      <th className="p-4 text-left font-black">Rate</th>
                      <th className="p-4 text-left font-black">Commission</th>
                      <th className="p-4 text-left font-black">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {allCommissions.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-4 font-black text-slate-950">
                          {item.referred_username || "Referral"}
                        </td>

                        <td className="p-4 font-bold text-slate-700">
                          {formatAmount(toNumber(item.deposit_amount))}
                        </td>

                        <td className="p-4 font-black text-blue-600">
                          {toNumber(item.commission_rate)}%
                        </td>

                        <td className="p-4 font-black text-green-600">
                          {formatAmount(toNumber(item.commission_amount))}
                        </td>

                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                              (item.status || "").toLowerCase() === "available"
                                ? "bg-green-50 text-green-600"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {item.status || "available"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>
        )}
      </main>
    </DashboardGuard>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorClass =
    color === "blue"
      ? "bg-blue-50 text-blue-600"
      : color === "green"
      ? "bg-green-50 text-green-600"
      : color === "purple"
      ? "bg-purple-50 text-purple-600"
      : "bg-orange-50 text-orange-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-5">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${colorClass}`}
        >
          <Icon size={27} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-600">{title}</p>

          <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>

          <p className="mt-1 text-sm font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-4">
      <p className="text-sm font-semibold text-blue-100">{label}</p>
      <p className="text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h3 className="text-2xl font-black text-slate-950">{title}</h3>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
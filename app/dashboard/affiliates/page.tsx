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
};

type ReferralRecord = {
  id: string;
  referred_user_id?: string | null;
  referred_username?: string | null;
  created_at: string;
  total_deposits?: number | string | null;
  is_qualified?: boolean | null;
  status?: string | null;
};

type CommissionRecord = {
  id: string;
  referred_username?: string | null;
  deposit_amount?: number | string | null;
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
    commissionRate: 1.5,
    icon: Star,
  },
  {
    level: 2,
    name: "Active Affiliate",
    requiredDeposits: 10000,
    commissionRate: 2,
    icon: ShieldCheck,
  },
  {
    level: 3,
    name: "Pro Affiliate",
    requiredDeposits: 50000,
    commissionRate: 2.5,
    icon: Crown,
  },
  {
    level: 4,
    name: "Elite Affiliate",
    requiredDeposits: 150000,
    commissionRate: 3,
    icon: Diamond,
  },
  {
    level: 5,
    name: "Ascend Partner",
    requiredDeposits: 300000,
    commissionRate: 3.5,
    icon: Trophy,
  },
];

const QUALIFICATION_AMOUNT = 1000;
const MIN_TRANSFER_AMOUNT = 10;

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

    const { error: refreshError } = await supabase.rpc(
      "refresh_my_affiliate_commissions",
    );

    if (refreshError) {
      console.warn("AFFILIATE_REFRESH_NOT_READY:", refreshError.message);
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
      .limit(4);

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
      .order("created_at", { ascending: false })
      .limit(4);

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

    await supabase.rpc("refresh_my_affiliate_commissions");

    const { data, error } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

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

  const qualifiedReferrals = referrals.filter((item) => {
    if (item.is_qualified) return true;
    return toNumber(item.total_deposits) >= QUALIFICATION_AMOUNT;
  }).length;

  const totalQualifiedDeposits = referrals
    .filter(
      (item) =>
        item.is_qualified ||
        toNumber(item.total_deposits) >= QUALIFICATION_AMOUNT,
    )
    .reduce((total, item) => total + toNumber(item.total_deposits), 0);

  const currentLevel = getCurrentAffiliateLevel(totalQualifiedDeposits);
  const nextLevel = getNextAffiliateLevel(currentLevel.level);

  const remainingToNext = nextLevel
    ? Math.max(0, nextLevel.requiredDeposits - totalQualifiedDeposits)
    : 0;

  const progressPercent = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalQualifiedDeposits - currentLevel.requiredDeposits) /
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

  const amountToTransfer = toNumber(transferAmount);

  const canTransfer =
    amountToTransfer >= MIN_TRANSFER_AMOUNT &&
    amountToTransfer <= availableCommission;

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      alert("Unable to copy referral link.");
    }
  }

  async function shareReferralLink() {
    if (navigator.share) {
      await navigator.share({
        title: "Join Ascend Service",
        text: "Join Ascend Service using my referral link.",
        url: referralLink,
      });
      return;
    }

    copyReferralLink();
  }

  function openCommissionModal() {
    setTransferAmount("");
    setTransferMessage("");
    setShowCommissionModal(true);
  }

  async function transferCommission() {
    if (transferring) return;

    setTransferMessage("");

    if (availableCommission <= 0) {
      setTransferMessage("You do not have available commission yet.");
      return;
    }

    if (amountToTransfer < MIN_TRANSFER_AMOUNT) {
      setTransferMessage(`Minimum transfer amount is ${formatAmount(MIN_TRANSFER_AMOUNT)}.`);
      return;
    }

    if (amountToTransfer > availableCommission) {
      setTransferMessage("Amount is higher than your available commission.");
      return;
    }

    setTransferring(true);

    const { error } = await supabase.rpc("transfer_affiliate_commission", {
      p_amount: amountToTransfer,
    });

    if (error) {
      console.error("TRANSFER_COMMISSION_ERROR:", error.message);
      setTransferMessage(error.message);
      setTransferring(false);
      return;
    }

    setTransferMessage(
      `Successfully transferred ${formatAmount(amountToTransfer)} to your wallet balance.`,
    );

    setTransferAmount("");
    await loadAffiliateData();
    await loadAllCommissions();
    setTransferring(false);
  }

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
        <DashboardSidebar />

        <section className="min-h-screen lg:ml-72">
          <DashboardTopbar />

          <div className="p-4 lg:p-8">
            <div>
              <h1 className="text-3xl font-black text-slate-950">
                Affiliates
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Invite friends, grow your network, and earn commission from qualified referrals.
              </p>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1557f6] via-[#3155f5] to-[#7c2df0] p-6 text-white shadow-sm lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.8fr_1fr_220px] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Affiliate Level
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black lg:text-5xl">
                      {loading ? "Loading..." : currentLevel.name}
                    </h2>

                    <span className="rounded-xl bg-white/15 px-4 py-2 text-sm font-black text-white ring-1 ring-white/20">
                      Level {currentLevel.level}
                    </span>
                  </div>

                  <p className="mt-4 max-w-md text-base font-semibold leading-7 text-blue-50">
                    Share your referral link and earn commission once your referrals become qualified.
                  </p>
                </div>

                <div className="border-white/15 lg:border-l lg:pl-8">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Commission Rate
                  </p>

                  <p className="mt-3 text-5xl font-black">
                    {currentLevel.commissionRate}%
                  </p>
                </div>

                <div className="border-white/15 lg:border-l lg:pl-8">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Qualification Rule
                  </p>

                  <p className="mt-2 text-lg font-black leading-7">
                    Referral must reach {formatAmount(QUALIFICATION_AMOUNT)} approved deposits
                  </p>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm font-black">
                      <span>Qualified Referral Progress</span>
                      <span>
                        {qualifiedReferrals} / {Math.max(10, qualifiedReferrals)}
                      </span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-green-400"
                        style={{
                          width: `${Math.min(100, (qualifiedReferrals / 10) * 100)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-50">
                      <CheckCircle2 size={16} />
                      Commission starts only after qualification.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-white/70 bg-white/10 shadow-2xl backdrop-blur">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                        <User size={72} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Users}
                title="Total Referrals"
                value={loading ? "..." : totalReferrals.toLocaleString()}
                subtitle="Users registered with your link"
                color="bg-blue-100 text-blue-600"
              />

              <MetricCard
                icon={ShieldCheck}
                title="Qualified Referrals"
                value={loading ? "..." : qualifiedReferrals.toLocaleString()}
                subtitle={`${formatAmount(QUALIFICATION_AMOUNT)} total deposits`}
                color="bg-green-100 text-green-600"
              />

              <CommissionMetricCard
                value={loading ? "..." : formatAmount(availableCommission)}
                onUse={openCommissionModal}
              />

              <MetricCard
                icon={Gift}
                title="Commission Rate"
                value={`${currentLevel.commissionRate}%`}
                subtitle="Current affiliate level rate"
                color="bg-orange-100 text-orange-500"
              />
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_520px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Affiliate Level Path
                </h3>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  The more qualified referral deposits you bring, the higher your commission rate.
                </p>

                <div className="mt-7">
                  <div className="relative grid grid-cols-5">
                    <div className="absolute left-[10%] right-[10%] top-8 h-0.5 bg-slate-200" />

                    {AFFILIATE_LEVELS.map((level) => {
                      const Icon = level.icon;
                      const isCurrent = level.level === currentLevel.level;

                      return (
                        <div key={level.level} className="relative z-10 text-center">
                          <div
                            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border text-sm font-black ${
                              isCurrent
                                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "border-slate-200 bg-white text-slate-500"
                            }`}
                          >
                            <Icon size={30} />
                          </div>

                          <div
                            className={`mt-4 min-h-[142px] rounded-xl border px-3 py-4 ${
                              isCurrent
                                ? "border-blue-300 bg-blue-50/60"
                                : "border-slate-100 bg-white"
                            }`}
                          >
                            <p
                              className={`text-sm font-black ${
                                isCurrent ? "text-blue-600" : "text-slate-950"
                              }`}
                            >
                              {level.name}
                            </p>

                            <p className="mt-3 text-lg font-black text-slate-800">
                              {level.commissionRate}%
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-600">
                              {formatAmount(level.requiredDeposits)}
                            </p>

                            {isCurrent && (
                              <span className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                Current Level
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center">
                  <p className="text-sm font-semibold text-slate-500">
                    Progress to next level:
                  </p>

                  <p className="text-sm font-black text-slate-700">
                    {formatAmount(totalQualifiedDeposits)} /{" "}
                    {formatAmount(nextLevel?.requiredDeposits || currentLevel.requiredDeposits)}
                  </p>

                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <p className="text-sm font-black text-blue-600">
                    {progressPercent.toFixed(0)}%
                  </p>
                </div>
              </section>

              <section className="rounded-2xl bg-[#061c42] p-6 text-white shadow-sm">
                <h3 className="text-xl font-black">Affiliate Summary</h3>

                <div className="mt-6 space-y-4">
                  <SummaryRow
                    label="Current Level"
                    value={`${currentLevel.name} (Level ${currentLevel.level})`}
                  />
                  <SummaryRow label="Total Referrals" value={`${totalReferrals}`} />
                  <SummaryRow label="Qualified Referrals" value={`${qualifiedReferrals}`} />
                  <SummaryRow
                    label="Total Qualified Deposits"
                    value={formatAmount(totalQualifiedDeposits)}
                  />
                  <SummaryRow
                    label="Current Rate"
                    value={`${currentLevel.commissionRate}%`}
                  />
                  <SummaryRow
                    label="Next Level"
                    value={
                      nextLevel
                        ? `${nextLevel.name} (${nextLevel.commissionRate}%)`
                        : "Max Level"
                    }
                  />
                </div>

                <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-blue-50">
                  {nextLevel
                    ? `Need ${formatAmount(remainingToNext)} more in qualified deposits to reach next level.`
                    : "You reached the highest affiliate level."}
                </p>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_0.9fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Referral Link
                </h3>

                <div className="mt-5 flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    readOnly
                    value={referralLink}
                    className="h-12 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-700 outline-none"
                  />

                  <button
                    onClick={copyReferralLink}
                    className="flex h-12 items-center gap-2 bg-blue-600 px-5 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <Copy size={17} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <button
                  onClick={shareReferralLink}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white text-sm font-black text-blue-600 transition hover:bg-blue-50"
                >
                  <Share2 size={17} />
                  Share Link
                </button>

                <div className="mt-5 rounded-xl bg-blue-50 p-4">
                  <p className="flex gap-2 text-sm font-semibold leading-6 text-blue-700">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    Your referrals must reach {formatAmount(QUALIFICATION_AMOUNT)} approved deposits before commissions begin.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950">
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

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 text-left font-black">User</th>
                        <th className="p-3 text-left font-black">Joined</th>
                        <th className="p-3 text-left font-black">Deposits</th>
                        <th className="p-3 text-left font-black">Status</th>
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
                        referrals.map((item) => {
                          const deposits = toNumber(item.total_deposits);
                          const isQualified =
                            item.is_qualified || deposits >= QUALIFICATION_AMOUNT;

                          return (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="p-3 font-black text-slate-700">
                                {item.referred_username || "User"}
                              </td>
                              <td className="p-3 font-semibold text-slate-500">
                                {formatDate(item.created_at)}
                              </td>
                              <td className="p-3 font-black text-slate-700">
                                {formatAmount(deposits)}
                              </td>
                              <td className="p-3">
                                <StatusBadge qualified={isQualified} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={openReferralsModal}
                  className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700"
                >
                  View All Referrals <ArrowRight size={16} />
                </button>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-950">
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

                <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-3 text-left font-black">Date</th>
                        <th className="p-3 text-left font-black">Referral</th>
                        <th className="p-3 text-left font-black">Deposit</th>
                        <th className="p-3 text-left font-black">Commission</th>
                        <th className="p-3 text-left font-black">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {commissions.length <= 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-sm font-semibold text-slate-500"
                          >
                            No commissions yet.
                          </td>
                        </tr>
                      ) : (
                        commissions.map((item) => {
                          const commissionAmount = toNumber(item.commission_amount);
                          const usedAmount = toNumber(item.used_amount);
                          const availableLeft = Math.max(
                            0,
                            commissionAmount - usedAmount,
                          );

                          return (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="p-3 font-semibold text-slate-500">
                                {formatDate(item.created_at)}
                              </td>
                              <td className="p-3 font-black text-slate-700">
                                {item.referred_username || "Referral"}
                              </td>
                              <td className="p-3 font-black text-slate-700">
                                {formatAmount(toNumber(item.deposit_amount))}
                              </td>
                              <td className="p-3 font-black text-slate-700">
                                {formatAmount(availableLeft)}
                              </td>
                              <td className="p-3">
                                <CommissionStatusBadge status={item.status || "pending"} />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={openCommissionsModal}
                  className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700"
                >
                  View All History <ArrowRight size={16} />
                </button>
              </section>
            </div>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">
                How It Works
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <HowItWorksStep
                  number="1"
                  icon={Link2}
                  title="Share your referral link"
                  text="Invite friends using your unique referral link."
                />

                <HowItWorksStep
                  number="2"
                  icon={Wallet}
                  title={`Referral reaches ${formatAmount(QUALIFICATION_AMOUNT)}`}
                  text={`Your referral must reach ${formatAmount(QUALIFICATION_AMOUNT)} total approved deposits.`}
                />

                <HowItWorksStep
                  number="3"
                  icon={TrendingIcon}
                  title="Earn commission"
                  text="Earn commission on future deposits based on your affiliate level."
                />
              </div>
            </section>
          </div>

          {showReferralsModal && (
            <ReferralsModal
              loading={loadingAllReferrals}
              referrals={allReferrals}
              onClose={() => setShowReferralsModal(false)}
              formatAmount={formatAmount}
            />
          )}

          {showCommissionsModal && (
            <CommissionsModal
              loading={loadingAllCommissions}
              commissions={allCommissions}
              onClose={() => setShowCommissionsModal(false)}
              formatAmount={formatAmount}
            />
          )}

          {showCommissionModal && (
            <CommissionTransferModal
              availableCommission={availableCommission}
              amountToTransfer={amountToTransfer}
              canTransfer={canTransfer}
              transferAmount={transferAmount}
              transferHistory={transferHistory}
              transferMessage={transferMessage}
              transferring={transferring}
              setTransferAmount={setTransferAmount}
              setShowCommissionModal={setShowCommissionModal}
              transferCommission={transferCommission}
              formatAmount={formatAmount}
            />
          )}
        </section>
      </main>
    </DashboardGuard>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={26} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-600">{title}</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function CommissionMetricCard({
  value,
  onUse,
}: {
  value: string;
  onUse: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
          <Wallet size={26} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-600">
            Available Commission
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black text-slate-950">{value}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                Ready to transfer to balance
              </p>
            </div>

            <button
              type="button"
              onClick={onUse}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Use Commission
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-blue-100">{label}</p>
      <p className="text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ qualified }: { qualified: boolean }) {
  if (qualified) {
    return (
      <span className="rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-700">
        Qualified
      </span>
    );
  }

  return (
    <span className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-black text-orange-600">
      Pending
    </span>
  );
}

function CommissionStatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();

  if (value === "paid" || value === "completed" || value === "used") {
    return (
      <span className="rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-700">
        {formatStatus(status)}
      </span>
    );
  }

  if (value === "available") {
    return (
      <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
        Available
      </span>
    );
  }

  return (
    <span className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-black text-orange-600">
      Pending
    </span>
  );
}

function HowItWorksStep({
  number,
  icon: Icon,
  title,
  text,
}: {
  number: string;
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-5 rounded-2xl bg-slate-50 p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
        {number}
      </div>

      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
        <Icon size={28} />
      </div>

      <div>
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function ReferralsModal({
  loading,
  referrals,
  onClose,
  formatAmount,
}: {
  loading: boolean;
  referrals: ReferralRecord[];
  onClose: () => void;
  formatAmount: (value: number | string | null | undefined) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <ModalHeader
          title="All Referrals"
          subtitle="View users who registered using your referral link."
          onClose={onClose}
        />

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
              Loading referrals...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 text-left font-black">User</th>
                      <th className="p-4 text-left font-black">Joined</th>
                      <th className="p-4 text-left font-black">Total Deposits</th>
                      <th className="p-4 text-left font-black">Qualification</th>
                      <th className="p-4 text-left font-black">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {referrals.length <= 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-12 text-center text-sm font-semibold text-slate-500"
                        >
                          No referrals yet.
                        </td>
                      </tr>
                    ) : (
                      referrals.map((item) => {
                        const deposits = toNumber(item.total_deposits);
                        const isQualified =
                          item.is_qualified || deposits >= QUALIFICATION_AMOUNT;
                        const remaining = Math.max(
                          0,
                          QUALIFICATION_AMOUNT - deposits,
                        );

                        return (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="p-4 font-black text-slate-700">
                              {item.referred_username || "User"}
                            </td>

                            <td className="p-4 font-semibold text-slate-500">
                              {formatDate(item.created_at)}
                            </td>

                            <td className="p-4 font-black text-slate-700">
                              {formatAmount(deposits)}
                            </td>

                            <td className="p-4 font-semibold text-slate-500">
                              {isQualified
                                ? `Reached ${formatAmount(QUALIFICATION_AMOUNT)}`
                                : `${formatAmount(remaining)} remaining`}
                            </td>

                            <td className="p-4">
                              <StatusBadge qualified={isQualified} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommissionsModal({
  loading,
  commissions,
  onClose,
  formatAmount,
}: {
  loading: boolean;
  commissions: CommissionRecord[];
  onClose: () => void;
  formatAmount: (value: number | string | null | undefined) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <ModalHeader
          title="All Commission History"
          subtitle="View all affiliate commissions, including pending, available, and used commissions."
          onClose={onClose}
        />

        <div className="overflow-y-auto p-6">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
              Loading commission history...
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="p-4 text-left font-black">Date</th>
                      <th className="p-4 text-left font-black">Referral</th>
                      <th className="p-4 text-left font-black">Deposit</th>
                      <th className="p-4 text-left font-black">Commission</th>
                      <th className="p-4 text-left font-black">Used</th>
                      <th className="p-4 text-left font-black">Available Left</th>
                      <th className="p-4 text-left font-black">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {commissions.length <= 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center text-sm font-semibold text-slate-500"
                        >
                          No commissions yet.
                        </td>
                      </tr>
                    ) : (
                      commissions.map((item) => {
                        const commissionAmount = toNumber(item.commission_amount);
                        const usedAmount = toNumber(item.used_amount);
                        const availableLeft = Math.max(
                          0,
                          commissionAmount - usedAmount,
                        );

                        return (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="p-4 font-semibold text-slate-500">
                              {formatDate(item.created_at)}
                            </td>
                            <td className="p-4 font-black text-slate-700">
                              {item.referred_username || "Referral"}
                            </td>
                            <td className="p-4 font-black text-slate-700">
                              {formatAmount(toNumber(item.deposit_amount))}
                            </td>
                            <td className="p-4 font-black text-slate-700">
                              {formatAmount(commissionAmount)}
                            </td>
                            <td className="p-4 font-black text-slate-700">
                              {formatAmount(usedAmount)}
                            </td>
                            <td className="p-4 font-black text-blue-600">
                              {formatAmount(availableLeft)}
                            </td>
                            <td className="p-4">
                              <CommissionStatusBadge status={item.status || "pending"} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommissionTransferModal({
  availableCommission,
  amountToTransfer,
  canTransfer,
  transferAmount,
  transferHistory,
  transferMessage,
  transferring,
  setTransferAmount,
  setShowCommissionModal,
  transferCommission,
  formatAmount,
}: {
  availableCommission: number;
  amountToTransfer: number;
  canTransfer: boolean;
  transferAmount: string;
  transferHistory: TransferRecord[];
  transferMessage: string;
  transferring: boolean;
  setTransferAmount: (value: string) => void;
  setShowCommissionModal: (value: boolean) => void;
  transferCommission: () => void;
  formatAmount: (value: number | string | null | undefined) => string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h3 className="text-xl font-black text-slate-950">
              Use Commission
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Transfer your available commission to wallet balance.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCommissionModal(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 overflow-y-auto p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-black text-slate-950">
              Transfer Commission to Balance
            </h4>

            <div className="mt-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Available Commission
              </p>

              <p className="mt-2 text-3xl font-black text-purple-600">
                {formatAmount(availableCommission)}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Ready to transfer
              </p>
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700">
              Amount to transfer
            </label>

            <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex h-12 items-center border-r border-slate-200 px-4 text-sm font-black text-slate-500">
                ₱
              </div>

              <input
                value={transferAmount}
                onChange={(event) => setTransferAmount(event.target.value)}
                type="number"
                min={MIN_TRANSFER_AMOUNT}
                max={availableCommission}
                placeholder="Enter amount"
                className="h-12 flex-1 px-4 text-sm font-semibold outline-none"
              />

              <div className="flex h-12 items-center border-l border-slate-200 px-4 text-sm font-black text-slate-500">
                .00
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setTransferAmount(String(amount))}
                  className="h-9 rounded-lg border border-blue-200 bg-blue-50 text-xs font-black text-blue-600 transition hover:bg-blue-600 hover:text-white"
                >
                  {formatAmount(amount)}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setTransferAmount(String(availableCommission))}
                className="h-9 rounded-lg border border-blue-200 bg-blue-50 text-xs font-black text-blue-600 transition hover:bg-blue-600 hover:text-white"
              >
                Max
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-semibold text-slate-600">
                You will receive
              </p>

              <p className="mt-1 text-3xl font-black text-green-600">
                {formatAmount(canTransfer ? amountToTransfer : 0)}
              </p>

              <p className="mt-1 text-sm font-semibold text-green-700">
                Will be added to your wallet balance
              </p>
            </div>

            {transferMessage && (
              <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                {transferMessage}
              </p>
            )}

            <button
              type="button"
              onClick={transferCommission}
              disabled={transferring}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transferring ? "Transferring..." : "Transfer to Balance"}
              <ArrowRight size={17} />
            </button>

            <p className="mt-3 text-center text-xs font-semibold text-slate-400">
              Minimum transfer amount is {formatAmount(MIN_TRANSFER_AMOUNT)}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h4 className="text-base font-black text-slate-950">
              Transfer History
            </h4>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 text-left font-black">Date</th>
                    <th className="p-4 text-left font-black">Amount</th>
                    <th className="p-4 text-left font-black">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transferHistory.length <= 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="p-10 text-center text-sm font-semibold text-slate-500"
                      >
                        No transfer history yet.
                      </td>
                    </tr>
                  ) : (
                    transferHistory.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="p-4 font-semibold text-slate-500">
                          {formatFullDate(item.created_at)}
                        </td>

                        <td className="p-4 font-black text-slate-700">
                          {formatAmount(toNumber(item.amount))}
                        </td>

                        <td className="p-4">
                          <span className="rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                            {formatStatus(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="border-t border-slate-100 p-5">
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
            <Info size={17} />
            Commission becomes available after 3 days cooldown period.
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 p-6">
      <div>
        <h3 className="text-2xl font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
      >
        <X size={20} />
      </button>
    </div>
  );
}

function TrendingIcon({ size = 28 }: { size?: number }) {
  return <Trophy size={size} />;
}

function getCurrentAffiliateLevel(totalQualifiedDeposits: number) {
  return (
    [...AFFILIATE_LEVELS]
      .reverse()
      .find((level) => totalQualifiedDeposits >= level.requiredDeposits) ||
    AFFILIATE_LEVELS[0]
  );
}

function getNextAffiliateLevel(currentLevel: number) {
  return AFFILIATE_LEVELS.find((level) => level.level === currentLevel + 1) || null;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCompact(value: number) {
  return value.toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status: string) {
  if (!status) return "Completed";

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

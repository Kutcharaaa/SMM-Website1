"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import {
  ArrowRightLeft,
  CheckCircle2,
  Flag,
  Info,
  Lock,
  RefreshCw,
  ShoppingCart,
  Star,
  Tag,
  Target,
  TrendingUp,
  Trophy,
  Unlock,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileData = {
  id?: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
  balance?: number | string | null;
  total_spent?: number | string | null;
  reseller_points?: number | string | null;
  reseller_level?: number | string | null;
  child_panel_access?: boolean | null;
  child_panel_access_type?: string | null;
  child_panel_subscription_status?: string | null;
  child_panel_subscription_expires_at?: string | null;
};

type ConversionRecord = {
  id: string;
  points_used?: number | string | null;
  points?: number | string | null;
  amount_credited?: number | string | null;
  wallet_credit?: number | string | null;
  created_at: string;
  status: string;
};

type ResellerLevel = {
  level: number;
  name: string;
  requiredSpend: number;
  discount: number;
  pointValueUsd: number;
  childPanel: boolean;
};

const RESELLER_LEVELS: ResellerLevel[] = [
  {
    level: 1,
    name: "New Reseller",
    requiredSpend: 0,
    discount: 0,
    pointValueUsd: 1,
    childPanel: false,
  },
  {
    level: 2,
    name: "Active Reseller",
    requiredSpend: 20000,
    discount: 1,
    pointValueUsd: 1,
    childPanel: false,
  },
  {
    level: 3,
    name: "Pro Reseller",
    requiredSpend: 60000,
    discount: 2,
    pointValueUsd: 1.25,
    childPanel: true,
  },
  {
    level: 4,
    name: "Master Reseller",
    requiredSpend: 150000,
    discount: 3,
    pointValueUsd: 1.5,
    childPanel: true,
  },
  {
    level: 5,
    name: "Elite Partner",
    requiredSpend: 250000,
    discount: 4,
    pointValueUsd: 1.75,
    childPanel: true,
  },
  {
    level: 6,
    name: "Ascend Partner",
    requiredSpend: 500000,
    discount: 5,
    pointValueUsd: 2,
    childPanel: true,
  },
];

const PHP_PER_USD = 56;
const MIN_CONVERT_POINTS = 100;
const CHILD_PANEL_PRICE = 349;

export default function ResellerPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [history, setHistory] = useState<ConversionRecord[]>([]);
  const [allHistory, setAllHistory] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllHistory, setLoadingAllHistory] = useState(false);
  const [converting, setConverting] = useState(false);
  const [subscribingChildPanel, setSubscribingChildPanel] = useState(false);
  const [childPanelModalOpen, setChildPanelModalOpen] = useState(false);
  const [childPanelAutoRenew, setChildPanelAutoRenew] = useState(false);
  const [cancellingAutoRenew, setCancellingAutoRenew] = useState(false);
  const [enablingAutoRenew, setEnablingAutoRenew] = useState(false);
  const [childPanelManageModalOpen, setChildPanelManageModalOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pointsInput, setPointsInput] = useState("100");
  const [message, setMessage] = useState("");
  const [childPanelModalMessage, setChildPanelModalMessage] = useState("");
  const [childPanelManageMessage, setChildPanelManageMessage] = useState("");

  const { formatAmount } = useDisplayCurrency();

  async function loadData() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setHistory([]);
      setChildPanelAutoRenew(false);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("RESELLER_PROFILE_ERROR:", profileError.message);
      setProfile(null);
      setHistory([]);
      setChildPanelAutoRenew(false);
      setLoading(false);
      return;
    }

    setProfile((profileData || null) as ProfileData);

    const { data: activeSubscription, error: subscriptionError } = await supabase
      .from("child_panel_subscriptions")
      .select("auto_renew")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error("CHILD_PANEL_SUBSCRIPTION_LOAD_ERROR:", subscriptionError.message);
      setChildPanelAutoRenew(false);
    } else {
      setChildPanelAutoRenew(Boolean(activeSubscription?.auto_renew));
    }

    const { data: historyData, error: historyError } = await supabase
      .from("reseller_point_conversions")
      .select(
        "id, points_used, points, amount_credited, wallet_credit, created_at, status",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historyError) {
      console.error("RESELLER_HISTORY_LOAD_ERROR:", historyError.message);
      setHistory([]);
    } else {
      setHistory((historyData || []) as ConversionRecord[]);
    }

    setLoading(false);
  }

  async function loadAllConversionHistory() {
    setLoadingAllHistory(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setAllHistory([]);
      setLoadingAllHistory(false);
      return;
    }

    const { data, error } = await supabase
      .from("reseller_point_conversions")
      .select(
        "id, points_used, points, amount_credited, wallet_credit, created_at, status",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("RESELLER_ALL_HISTORY_ERROR:", error.message);
      setAllHistory([]);
    } else {
      setAllHistory((data || []) as ConversionRecord[]);
    }

    setLoadingAllHistory(false);
  }

  function openHistoryModal() {
    setShowHistoryModal(true);
    loadAllConversionHistory();
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalSpend = toNumber(profile?.total_spent);
  const availablePoints = toNumber(profile?.reseller_points);
  const balance = toNumber(profile?.balance);

  const currentLevel = getCurrentLevel(totalSpend);
  const nextLevel = getNextLevel(currentLevel.level);

  const savedSubscriptionStatus = String(
    profile?.child_panel_subscription_status || "inactive",
  ).toLowerCase();

  const savedChildPanelType = String(
    profile?.child_panel_access_type || "locked",
  ).toLowerCase();

  const hasPaidChildPanel =
    savedSubscriptionStatus === "active" || savedChildPanelType === "paid";

  const hasManualChildPanel = savedChildPanelType === "manual";
  const hasLevelChildPanel = currentLevel.level >= 3 || currentLevel.childPanel;

  const childPanelUnlocked =
    hasLevelChildPanel ||
    hasPaidChildPanel ||
    hasManualChildPanel ||
    Boolean(profile?.child_panel_access);

  const childPanelAccessLabel = hasLevelChildPanel
    ? "Free Lifetime"
    : hasPaidChildPanel
      ? "Paid Active"
      : hasManualChildPanel
        ? "Manual Unlock"
        : "Locked";

  const requiredSpend = nextLevel?.requiredSpend || currentLevel.requiredSpend;
  const remainingSpend = nextLevel
    ? Math.max(0, nextLevel.requiredSpend - totalSpend)
    : 0;

  const progressPercent = nextLevel
    ? Math.min(
        100,
        Math.max(
          0,
          ((totalSpend - currentLevel.requiredSpend) /
            (nextLevel.requiredSpend - currentLevel.requiredSpend)) *
            100,
        ),
      )
    : 100;

  const pointsToConvert = Math.max(0, Math.floor(Number(pointsInput || 0)));
  const usdCredit = calculateUsdCredit(pointsToConvert, currentLevel.pointValueUsd);
  const phpCredit = usdCredit * PHP_PER_USD;

  async function convertPoints() {
    if (converting) return;

    setMessage("");

    if (pointsToConvert < MIN_CONVERT_POINTS) {
      setMessage(`Minimum conversion is ${MIN_CONVERT_POINTS} points.`);
      return;
    }

    if (pointsToConvert > availablePoints) {
      setMessage("You do not have enough reseller points.");
      return;
    }

    setConverting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in.");
      setConverting(false);
      return;
    }

    const newPoints = availablePoints - pointsToConvert;
    const newBalance = balance + phpCredit;

    const { error } = await supabase
      .from("profiles")
      .update({
        reseller_points: newPoints,
        balance: newBalance,
      })
      .eq("id", user.id);

    if (error) {
      console.error("CONVERT_POINTS_ERROR:", error.message);
      setMessage(error.message);
      setConverting(false);
      return;
    }

    const { data: newHistory, error: historyError } = await supabase
      .from("reseller_point_conversions")
      .insert({
        user_id: user.id,
        points_used: pointsToConvert,
        points: pointsToConvert,
        amount_credited: phpCredit,
        wallet_credit: phpCredit,
        usd_value: usdCredit,
        level_name: currentLevel.name,
        status: "completed",
      })
      .select(
        "id, points_used, points, amount_credited, wallet_credit, created_at, status",
      )
      .single();

    if (historyError) {
      console.error("CONVERSION_HISTORY_ERROR:", historyError.message);
      setConverting(false);
      await loadData();
      setMessage(
        `Points converted, but conversion history failed: ${historyError.message}`,
      );
      return;
    }

    if (newHistory) {
      setHistory((current) =>
        [newHistory as ConversionRecord, ...current].slice(0, 5),
      );
      setAllHistory((current) =>
        [newHistory as ConversionRecord, ...current].slice(0, 100),
      );
    }

    setPointsInput("100");
    setConverting(false);
    await loadData();
    setMessage(`Converted ${pointsToConvert} points to ${formatAmount(phpCredit)}.`);
  }

  async function subscribeChildPanel() {
    if (subscribingChildPanel) return;

    setMessage("");
    setChildPanelModalMessage("");
    setSubscribingChildPanel(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage("You must be logged in to subscribe.");
      setSubscribingChildPanel(false);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/subscribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        setChildPanelModalMessage(
          result.message || "Failed to subscribe to Child Panel.",
        );
        setSubscribingChildPanel(false);
        return;
      }

      setMessage(result.message || "Child Panel subscription activated.");
      setChildPanelModalOpen(false);
      await loadData();
    } catch {
      setMessage("Failed to subscribe to Child Panel.");
    }

    setSubscribingChildPanel(false);
  }

  async function cancelChildPanelAutoRenew() {
    if (cancellingAutoRenew) return;

    setMessage("");
    setChildPanelManageMessage("");
    setCancellingAutoRenew(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setChildPanelManageMessage("You must be logged in to cancel auto-renew.");
      setCancellingAutoRenew(false);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/cancel-auto-renew", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const text = await response.text();

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        result = JSON.parse(text);
      } catch {
        result = {
          success: false,
          message:
            "Cancel Auto Renew API route was not found or returned an invalid response. Please check app/api/child-panel/cancel-auto-renew/route.ts.",
        };
      }

      if (!response.ok || !result.success) {
        setChildPanelManageMessage(
          result.message || "Failed to cancel auto-renew.",
        );
        setCancellingAutoRenew(false);
        return;
      }

      setChildPanelAutoRenew(false);
      setChildPanelManageMessage(
        result.message || "Auto-renew cancelled successfully.",
      );

      await loadData();
    } catch {
      setChildPanelManageMessage("Failed to cancel auto-renew.");
    }

    setCancellingAutoRenew(false);
  }

  async function enableChildPanelAutoRenew() {
    if (enablingAutoRenew) return;

    setMessage("");
    setChildPanelManageMessage("");
    setEnablingAutoRenew(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setChildPanelManageMessage("You must be logged in to enable auto-renew.");
      setEnablingAutoRenew(false);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/enable-auto-renew", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const text = await response.text();

      let result: {
        success?: boolean;
        message?: string;
      } = {};

      try {
        result = JSON.parse(text);
      } catch {
        result = {
          success: false,
          message:
            "Enable Auto Renew API route was not found or returned an invalid response. Please check app/api/child-panel/enable-auto-renew/route.ts.",
        };
      }

      if (!response.ok || !result.success) {
        setChildPanelManageMessage(
          result.message || "Failed to enable auto-renew.",
        );
        setEnablingAutoRenew(false);
        return;
      }

      setChildPanelAutoRenew(true);
      setChildPanelManageMessage(
        result.message || "Auto-renew enabled successfully.",
      );

      await loadData();
    } catch {
      setChildPanelManageMessage("Failed to enable auto-renew.");
    }

    setEnablingAutoRenew(false);
  }

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
        <DashboardSidebar />

        <section className="min-h-screen lg:ml-72">
          <DashboardTopbar />

          <div className="p-4 lg:p-8">
            <div>
              <h1 className="text-3xl font-black text-slate-950">Reseller</h1>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Track your progress, convert points, and unlock more benefits as you grow.
              </p>
            </div>

            <section className="mt-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1557f6] via-[#3155f5] to-[#7c2df0] p-6 text-white shadow-sm lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr_220px] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Current Level
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
                    {nextLevel
                      ? "You're just getting started! Keep growing your spend to unlock more rewards."
                      : "You reached the highest reseller level. All premium rewards are active."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                    Total Spend
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <p className="text-3xl font-black lg:text-4xl">
                      {formatAmount(totalSpend)}
                    </p>

                    <p className="mb-1 text-xl font-semibold text-blue-100">
                      / {formatAmount(requiredSpend)}
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
                        {formatAmount(remainingSpend)} more to reach{" "}
                        <span className="font-black text-white">{nextLevel.name}</span>
                      </>
                    ) : (
                      <span className="font-black text-white">
                        Maximum level reached
                      </span>
                    )}
                  </p>
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
                icon={Star}
                title="Available Points"
                value={`${formatCompact(availablePoints)} pts`}
                subtitle={`Earn 1 point every ${formatAmount(200)} spend`}
                color="bg-blue-100 text-blue-600"
              />

              <MetricCard
                icon={Wallet}
                title="Point Value"
                value={`100 pts = $${currentLevel.pointValueUsd.toFixed(2)}`}
                subtitle="Value increases by level"
                color="bg-green-100 text-green-600"
              />

              <MetricCard
                icon={Tag}
                title="Your Discount"
                value={`${currentLevel.discount}%`}
                subtitle="Applies to all orders"
                color="bg-orange-100 text-orange-500"
              />

              <ChildPanelMetric
                isUnlocked={childPanelUnlocked}
                accessLabel={childPanelAccessLabel}
                price={CHILD_PANEL_PRICE}
                subscribing={subscribingChildPanel}
                autoRenew={childPanelAutoRenew}
                cancellingAutoRenew={cancellingAutoRenew}
                subscriptionExpiresAt={
                  profile?.child_panel_subscription_expires_at || null
                }
                onSubscribe={() => {
                  setChildPanelModalMessage("");
                  setChildPanelModalOpen(true);
                }}
                onManageSubscription={() => setChildPanelManageModalOpen(true)}
              />
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_520px]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-950">
                    Reseller Level Path
                  </h3>
                  <Info size={16} className="text-slate-400" />
                </div>

                <div className="mt-7">
                  <div className="relative grid grid-cols-6">
                    <div className="absolute left-[8%] right-[8%] top-5 h-0.5 bg-slate-200" />

                    {RESELLER_LEVELS.map((level) => {
                      const isCurrent = level.level === currentLevel.level;

                      return (
                        <div key={level.level} className="relative z-10 text-center">
                          <div
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${
                              isCurrent
                                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                : "border-slate-200 bg-white text-slate-600"
                            }`}
                          >
                            {level.level}
                          </div>

                          <div
                            className={`mt-5 min-h-[162px] rounded-xl border px-3 py-4 ${
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

                            <p className="mt-3 text-sm font-bold text-slate-700">
                              {formatAmount(level.requiredSpend)}
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              {level.discount}%
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-700">
                              100 pts = ${level.pointValueUsd.toFixed(2)}
                            </p>

                            <p
                              className={`mt-4 flex items-center justify-center gap-1 text-xs font-black ${
                                level.childPanel ? "text-green-600" : "text-red-500"
                              }`}
                            >
                              {level.childPanel ? <Unlock size={13} /> : <Lock size={13} />}
                              {level.childPanel ? "Unlocked" : "Locked"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl bg-[#061c42] p-6 text-white shadow-sm">
                <h3 className="text-xl font-black">Reseller Summary</h3>

                <div className="mt-6 space-y-4">
                  <SummaryRow
                    icon={User}
                    label="Current Level"
                    value={currentLevel.name}
                    badge={`Level ${currentLevel.level}`}
                  />
                  <SummaryRow
                    icon={Wallet}
                    label="Total Spent"
                    value={formatAmount(totalSpend)}
                  />
                  <SummaryRow
                    icon={TrendingUp}
                    label="Next Level"
                    value={nextLevel?.name || "Max Level"}
                  />
                  <SummaryRow
                    icon={Target}
                    label="Required Spend"
                    value={formatAmount(requiredSpend)}
                  />
                  <SummaryRow
                    icon={Flag}
                    label="Remaining to Next Level"
                    value={nextLevel ? formatAmount(remainingSpend) : "Completed"}
                  />
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_0.9fr_1fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <ArrowRightLeft size={20} />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Convert Points to Balance
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Convert your reseller points to wallet balance.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 divide-x divide-slate-200 rounded-xl bg-slate-50 p-4">
                  <div className="pr-4 text-center">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Available Points
                    </p>
                    <p className="mt-2 text-lg font-black text-blue-600">
                      {formatCompact(availablePoints)} pts
                    </p>
                  </div>

                  <div className="pl-4 text-center">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Point Value
                    </p>
                    <p className="mt-2 text-lg font-black text-green-600">
                      100 pts = ${currentLevel.pointValueUsd.toFixed(2)}
                    </p>
                  </div>
                </div>

                <label className="mt-5 block text-sm font-black text-slate-700">
                  Points to Convert
                </label>

                <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <input
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    type="number"
                    min={MIN_CONVERT_POINTS}
                    max={availablePoints}
                    placeholder="Enter points"
                    className="h-12 flex-1 px-4 text-sm font-semibold outline-none"
                  />

                  <div className="flex h-12 items-center border-l border-slate-200 px-4 text-sm font-black text-slate-600">
                    pts
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-500">
                    You will receive
                  </p>

                  <div className="text-right">
                    <p className="text-xl font-black text-slate-950">
                      {formatAmount(phpCredit)}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      ${usdCredit.toFixed(2)}
                    </p>
                  </div>
                </div>

                {message && (
                  <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                    {message}
                  </p>
                )}

                <button
                  onClick={convertPoints}
                  disabled={loading || converting}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRightLeft size={18} />
                  {converting ? "Converting..." : "Convert to Balance"}
                </button>

                <p className="mt-3 text-xs font-semibold text-slate-400">
                  Minimum {MIN_CONVERT_POINTS} points required. Conversions are final.
                </p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Recent Conversions
                  </h3>

                  <button
                    type="button"
                    onClick={openHistoryModal}
                    className="text-sm font-black text-blue-600 transition hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>

                <ConversionTable
                  records={history}
                  emptyText="No conversions yet."
                  formatAmount={formatAmount}
                  compact
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                    <Star size={20} />
                  </div>

                  <h3 className="text-xl font-black text-slate-950">
                    How to Earn Points
                  </h3>
                </div>

                <div className="mt-5 space-y-5">
                  <HowToEarnItem
                    icon={ShoppingCart}
                    title="Spend to Earn"
                    text={`Earn 1 point for every ${formatAmount(200)} spent on orders and services.`}
                    color="bg-blue-600 text-white"
                  />

                  <HowToEarnItem
                    icon={Wallet}
                    title="Convert & Save"
                    text="Convert your points to balance based on your level's rate."
                    color="bg-green-600 text-white"
                  />

                  <HowToEarnItem
                    icon={Trophy}
                    title="More Spend, More Rewards"
                    text="Reach higher levels to increase your point value and discounts."
                    color="bg-orange-500 text-white"
                  />
                </div>
              </section>
            </div>
          </div>

          {showHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      All Recent Conversions
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      View your reseller point conversion history.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                  >
                    <X size={21} />
                  </button>
                </div>

                <div className="overflow-y-auto p-6">
                  {loadingAllHistory ? (
                    <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
                      Loading conversion history...
                    </div>
                  ) : (
                    <ConversionTable
                      records={allHistory}
                      emptyText="No conversion history found."
                      formatAmount={formatAmount}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {childPanelManageModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Child Panel Subscription
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage your paid Child Panel access and auto-renew settings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setChildPanelManageModalOpen(false)}
                  disabled={cancellingAutoRenew || enablingAutoRenew}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                      <Unlock size={26} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black uppercase tracking-wide text-green-700">
                        Paid Active
                      </p>

                      <h4 className="mt-2 text-2xl font-black text-slate-950">
                        Child Panel is unlocked
                      </h4>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        You can open your Child Panel anytime while your subscription is active.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Monthly Price
                    </p>
                    <p className="mt-2 text-2xl font-black text-blue-600">
                      ₱{CHILD_PANEL_PRICE}/month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Expires At
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {profile?.child_panel_subscription_expires_at
                        ? formatDate(profile.child_panel_subscription_expires_at)
                        : "No expiry date"}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        Auto Renew
                      </p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        {childPanelAutoRenew
                          ? `Your subscription renews automatically for ₱${CHILD_PANEL_PRICE}/month if you have enough balance.`
                          : "Auto-renew is off. Your access will stay active until the current expiry date."}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase ${
                        childPanelAutoRenew
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {childPanelAutoRenew ? "Enabled" : "Off"}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {childPanelAutoRenew ? (
                      <button
                        type="button"
                        onClick={cancelChildPanelAutoRenew}
                        disabled={cancellingAutoRenew || enablingAutoRenew}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingAutoRenew ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <X size={17} />
                        )}
                        {cancellingAutoRenew ? "Cancelling..." : "Turn Off Auto Renew"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={enableChildPanelAutoRenew}
                        disabled={cancellingAutoRenew || enablingAutoRenew}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {enablingAutoRenew ? (
                          <RefreshCw size={17} className="animate-spin" />
                        ) : (
                          <CheckCircle2 size={17} />
                        )}
                        {enablingAutoRenew ? "Enabling..." : "Turn On Auto Renew"}
                      </button>
                    )}

                    <Link
                      href="/dashboard/child-panel"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      <Unlock size={17} />
                      Open Child Panel
                    </Link>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                  Turning off auto-renew will not remove your current access. Your Child Panel stays active until the current expiry date.
                </div>
              </div>
            </div>
          </div>
        )}

        {childPanelModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    Subscribe to Child Panel
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Unlock your own reseller child panel for ₱{CHILD_PANEL_PRICE}/month.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setChildPanelModalOpen(false)}
                  disabled={subscribingChildPanel}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                {childPanelModalMessage && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {childPanelModalMessage}
                  </div>
                )}

                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                    What is Child Panel?
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                    Child Panel lets you run your own reseller panel under Ascend Service.
                    You can give your own users access to services, manage their orders,
                    and grow your own mini SMM panel while still using Ascend Service as
                    your main provider system.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Monthly Price
                    </p>
                    <p className="mt-2 text-2xl font-black text-blue-600">
                      ₱{CHILD_PANEL_PRICE}/month
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                      Auto Renew
                    </p>
                    <p className="mt-2 text-2xl font-black text-emerald-600">
                      Enabled
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-black text-slate-950">
                    Perks and Benefits
                  </p>

                  <div className="mt-4 space-y-3">
                    <BenefitItem text="Create your own reseller panel for your customers." />
                    <BenefitItem text="Manage your own clients, orders, and service access." />
                    <BenefitItem text="Use Ascend Service as your main provider while growing your own brand." />
                    <BenefitItem text="Level 3 and above gets Child Panel free lifetime as a reseller perk." />
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                  By confirming, ₱{CHILD_PANEL_PRICE} will be deducted from your wallet
                  balance. If your balance is not enough, the subscription will not proceed.
                  Your subscription will auto-renew every month if you have enough balance.
                </div>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setChildPanelModalOpen(false)}
                  disabled={subscribingChildPanel}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={subscribeChildPanel}
                  disabled={subscribingChildPanel}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {subscribingChildPanel ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  {subscribingChildPanel
                    ? "Subscribing..."
                    : `Confirm Subscribe ₱${CHILD_PANEL_PRICE}/mo`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </DashboardGuard>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-600" />
      <p className="text-sm font-semibold leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

function ConversionTable({
  records,
  emptyText,
  formatAmount,
  compact = false,
}: {
  records: ConversionRecord[];
  emptyText: string;
  formatAmount: (value: number | string | null | undefined) => string;
  compact?: boolean;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-4 text-left font-black">Date</th>
              <th className="p-4 text-left font-black">Points</th>
              <th className="p-4 text-left font-black">Amount</th>
              <th className="p-4 text-left font-black">Status</th>
            </tr>
          </thead>

          <tbody>
            {records.length <= 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className={`text-center text-sm font-semibold text-slate-500 ${
                    compact ? "p-8" : "p-12"
                  }`}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              records.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-slate-600">
                    {formatDate(item.created_at)}
                  </td>

                  <td className="p-4 font-black text-slate-700">
                    {formatCompact(toNumber(item.points_used ?? item.points))} pts
                  </td>

                  <td className="p-4 font-black text-slate-700">
                    {formatAmount(toNumber(item.amount_credited ?? item.wallet_credit))}
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                      <CheckCircle2 size={13} />
                      {formatStatus(item.status)}
                    </span>
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
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChildPanelMetric({
  isUnlocked,
  accessLabel,
  price,
  subscribing,
  autoRenew,
  cancellingAutoRenew,
  subscriptionExpiresAt,
  onSubscribe,
  onManageSubscription,
}: {
  isUnlocked: boolean;
  accessLabel: string;
  price: number;
  subscribing: boolean;
  autoRenew: boolean;
  cancellingAutoRenew: boolean;
  subscriptionExpiresAt?: string | null;
  onSubscribe: () => void;
  onManageSubscription: () => void;
}) {
  if (isUnlocked) {
    const isPaidActive = accessLabel === "Paid Active";

    if (isPaidActive) {
      return (
        <button
          type="button"
          onClick={onManageSubscription}
          className="rounded-2xl border border-green-200 bg-white p-5 text-left shadow-sm transition hover:border-green-400 hover:bg-green-50"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
              <Unlock size={26} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Child Panel Access
              </p>

              <h3 className="mt-2 text-2xl font-black text-green-600">
                Open Panel
              </h3>

              <p className="mt-1 text-sm font-semibold text-slate-400">
                Paid Active · Manage
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                autoRenew
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {autoRenew ? "Auto" : "Off"}
            </span>
          </div>
        </button>
      );
    }

    return (
      <Link
        href="/dashboard/child-panel"
        className="block rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:border-green-400 hover:bg-green-50"
      >
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-600">
            <Unlock size={26} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Child Panel Access
            </p>

            <h3 className="mt-2 text-2xl font-black text-green-600">
              Open Panel
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-400">
              {accessLabel}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onSubscribe}
      disabled={subscribing}
      className="rounded-2xl border border-blue-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Lock size={26} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Child Panel Access
          </p>

          <h3 className="mt-2 text-2xl font-black text-blue-600">
            {subscribing ? "Subscribing..." : `Subscribe ₱${price}/mo`}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-400">
            Auto-renew enabled by default
          </p>
        </div>
      </div>
    </button>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: any;
  label: string;
  value: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-white/10 pb-4 last:border-b-0 last:pb-0">
      <Icon size={22} className="text-blue-100" />

      <p className="flex-1 text-base font-semibold text-blue-50">{label}</p>

      <div className="flex items-center gap-3">
        <p className="text-right text-base font-black text-white">{value}</p>

        {badge && (
          <span className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-black text-white">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function HowToEarnItem({
  icon: Icon,
  title,
  text,
  color,
}: {
  icon: any;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div className="flex gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        <Icon size={22} />
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

function getCurrentLevel(totalSpend: number) {
  return [...RESELLER_LEVELS]
    .reverse()
    .find((level) => totalSpend >= level.requiredSpend) || RESELLER_LEVELS[0];
}

function getNextLevel(currentLevel: number) {
  return RESELLER_LEVELS.find((level) => level.level === currentLevel + 1) || null;
}

function calculateUsdCredit(points: number, pointValueUsd: number) {
  return (points / 100) * pointValueUsd;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatCompact(value: number) {
  return value.toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
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

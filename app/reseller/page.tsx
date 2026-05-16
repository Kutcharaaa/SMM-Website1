"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import {
  ArrowRightLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  Lock,
  Percent,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trophy,
  Unlock,
  User,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
};

type ConversionRecord = {
  id: string;
  points_used: number;
  amount_credited: number;
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

export default function ResellerPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [pointsInput, setPointsInput] = useState("100");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ConversionRecord[]>([]);

  async function loadProfile() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("RESELLER_PROFILE_ERROR:", error.message);
      setProfile(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    setProfile((data || null) as ProfileData);

    const { data: historyData, error: historyError } = await supabase
      .from("reseller_point_conversions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!historyError && historyData) {
      setHistory(historyData as ConversionRecord[]);
    } else {
      setHistory([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const totalSpend = toNumber(profile?.total_spent);
  const availablePoints = toNumber(profile?.reseller_points);
  const balance = toNumber(profile?.balance);

  const currentLevel = getCurrentLevel(totalSpend);
  const nextLevel = getNextLevel(currentLevel.level);
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

    await supabase.from("reseller_point_conversions").insert({
      user_id: user.id,
      points_used: pointsToConvert,
      amount_credited: phpCredit,
      usd_value: usdCredit,
      level_name: currentLevel.name,
      status: "completed",
    });

    setMessage(`Converted ${pointsToConvert} points to ₱${formatMoney(phpCredit)}.`);
    setPointsInput("100");
    setConverting(false);
    loadProfile();
  }

  const displayName =
    profile?.firstname ||
    profile?.username ||
    profile?.full_name ||
    "Reseller";

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
        <DashboardSidebar />

        <section className="min-h-screen lg:ml-72">
          <DashboardTopbar />

          <div className="p-4 lg:p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-black text-slate-950">
                Reseller
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Track your progress, convert points, and unlock more benefits as you grow.
              </p>
            </div>

            <section className="overflow-hidden rounded-2xl border border-blue-950/10 bg-gradient-to-r from-[#061c42] via-[#102a7a] to-[#6d28d9] p-6 text-white shadow-sm lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr_220px] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
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

                  <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-blue-50">
                    {nextLevel
                      ? "Great start! Keep growing and reach the next level to unlock better rewards and benefits."
                      : "You reached the highest reseller level. All premium rewards are active."}
                  </p>
                </div>

                <div className="border-white/10 lg:border-l lg:pl-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Total Spend
                  </p>

                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <p className="text-3xl font-black">
                      ₱{formatMoney(totalSpend)}
                    </p>

                    <p className="mb-1 text-lg font-bold text-blue-100">
                      / ₱{formatMoney(requiredSpend)}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-sm font-black text-white">
                      {progressPercent.toFixed(1)}%
                    </p>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-blue-50">
                    {nextLevel ? (
                      <>
                        ₱{formatMoney(remainingSpend)} more to reach{" "}
                        <span className="font-black text-white">{nextLevel.name}</span>
                      </>
                    ) : (
                      <span className="font-black text-white">
                        Top level unlocked
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-white/70 bg-white/10 shadow-2xl backdrop-blur">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                        <User size={62} className="text-white" />
                      </div>
                    )}

                    <div className="absolute -bottom-3 rounded-xl bg-white px-4 py-1 text-sm font-black text-blue-700 shadow-lg">
                      LEVEL {currentLevel.level}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={Star}
                title="Available Points"
                value={`${formatCompact(availablePoints)} pts`}
                subtitle="Earn 1 point every ₱200 spend"
                color="bg-blue-100 text-blue-600"
              />

              <MetricCard
                icon={ArrowRightLeft}
                title="Point Value"
                value={`100 pts = $${currentLevel.pointValueUsd.toFixed(2)}`}
                subtitle="Value increases by level"
                color="bg-purple-100 text-purple-600"
              />

              <MetricCard
                icon={Percent}
                title="Your Discount"
                value={`${currentLevel.discount}%`}
                subtitle="Applies to all orders"
                color="bg-green-100 text-green-600"
              />

              <MetricCard
                icon={currentLevel.childPanel ? Unlock : Lock}
                title="Child Panel Access"
                value={currentLevel.childPanel ? "Unlocked" : "Locked"}
                subtitle={
                  currentLevel.childPanel
                    ? "You can create child panels"
                    : "Unlock at Pro Reseller"
                }
                color={
                  currentLevel.childPanel
                    ? "bg-green-100 text-green-600"
                    : "bg-orange-100 text-orange-500"
                }
              />
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-950">
                      Reseller Level Path
                    </h3>
                    <Info size={16} className="text-slate-400" />
                  </div>

                  <div className="mt-8">
                    <div className="relative grid grid-cols-6 gap-0">
                      <div className="absolute left-[8%] right-[8%] top-5 h-0.5 bg-slate-200" />

                      {RESELLER_LEVELS.map((level) => {
                        const isCurrent = level.level === currentLevel.level;
                        const isUnlocked = currentLevel.level >= level.level;

                        return (
                          <div
                            key={level.level}
                            className="relative z-10 text-center"
                          >
                            <div
                              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black ${
                                isCurrent
                                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                  : isUnlocked
                                    ? "border-blue-200 bg-blue-50 text-blue-600"
                                    : "border-slate-200 bg-slate-100 text-slate-500"
                              }`}
                            >
                              {level.level}
                            </div>

                            <div
                              className={`mt-5 rounded-xl border p-4 ${
                                isCurrent
                                  ? "border-blue-300 bg-blue-50/60"
                                  : "border-slate-100 bg-white"
                              }`}
                            >
                              <p
                                className={`text-sm font-black ${
                                  isCurrent ? "text-blue-600" : "text-slate-800"
                                }`}
                              >
                                {level.name}
                              </p>

                              <p className="mt-2 text-xs font-bold text-slate-600">
                                Spend ₱{formatCompact(level.requiredSpend)}
                              </p>

                              <p className="mt-2 text-xs font-bold text-slate-600">
                                {level.discount}% Discount
                              </p>

                              <p className="mt-2 text-xs font-bold text-slate-600">
                                100 pts = ${level.pointValueUsd.toFixed(2)}
                              </p>

                              <p
                                className={`mt-3 flex items-center justify-center gap-1 text-xs font-black ${
                                  level.childPanel
                                    ? "text-green-600"
                                    : "text-red-500"
                                }`}
                              >
                                {level.childPanel ? (
                                  <Unlock size={13} />
                                ) : (
                                  <Lock size={13} />
                                )}
                                Child Panel {level.childPanel ? "Unlocked" : "Locked"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <div className="grid gap-4 text-xs font-bold text-slate-500 md:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <Wallet size={15} />
                        Required Spend
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent size={15} />
                        Discount
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={15} />
                        Point Value
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock size={15} />
                        Child Panel Access
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <ArrowRightLeft size={22} />
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          Convert Points to Balance
                        </h3>
                        <p className="text-sm font-semibold text-slate-500">
                          Convert your reseller points to wallet balance.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="text-xs font-black uppercase text-slate-400">
                          Available Points
                        </p>
                        <p className="mt-2 text-xl font-black text-blue-600">
                          {formatCompact(availablePoints)} pts
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
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
                      <div className="flex h-12 items-center border-l border-slate-200 px-4 text-sm font-black text-slate-500">
                        pts
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-500">
                          You will receive
                        </p>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-950">
                            ${usdCredit.toFixed(2)}
                          </p>
                          <p className="text-xs font-bold text-slate-400">
                            ₱{formatMoney(phpCredit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {message && (
                      <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                        {message}
                      </p>
                    )}

                    <button
                      onClick={convertPoints}
                      disabled={converting || loading}
                      className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowRightLeft size={18} />
                      {converting ? "Converting..." : "Convert to Balance"}
                    </button>

                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      Minimum {MIN_CONVERT_POINTS} points required. Point conversions are final.
                    </p>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-black text-slate-950">
                        Recent Conversions
                      </h3>

                      <button className="text-sm font-black text-blue-600">
                        View All
                      </button>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-4 text-left font-black">Date</th>
                            <th className="p-4 text-left font-black">Points</th>
                            <th className="p-4 text-left font-black">Amount</th>
                            <th className="p-4 text-left font-black">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {history.length <= 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="p-8 text-center text-sm font-semibold text-slate-500"
                              >
                                No conversions yet.
                              </td>
                            </tr>
                          ) : (
                            history.map((item) => (
                              <tr
                                key={item.id}
                                className="border-t border-slate-100"
                              >
                                <td className="p-4 font-semibold text-slate-600">
                                  {formatDate(item.created_at)}
                                </td>
                                <td className="p-4 font-black text-slate-700">
                                  {item.points_used} pts
                                </td>
                                <td className="p-4 font-black text-slate-700">
                                  ₱{formatMoney(item.amount_credited)}
                                </td>
                                <td className="p-4">
                                  <span className="rounded-lg bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                                    Completed
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
              </div>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-blue-950/10 bg-[#061c42] p-5 text-white shadow-sm">
                  <h3 className="text-lg font-black">Reseller Summary</h3>

                  <div className="mt-5 space-y-4">
                    <SummaryRow label="Current Level" value={currentLevel.name} />
                    <SummaryRow label="Level" value={`Level ${currentLevel.level}`} />
                    <SummaryRow label="Total Spend" value={`₱${formatMoney(totalSpend)}`} />
                    <SummaryRow
                      label="Next Level"
                      value={nextLevel?.name || "Max Level"}
                    />
                    <SummaryRow
                      label="Required Spend"
                      value={`₱${formatMoney(requiredSpend)}`}
                    />
                    <SummaryRow
                      label="Remaining to Next Level"
                      value={
                        nextLevel
                          ? `₱${formatMoney(remainingSpend)}`
                          : "Completed"
                      }
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <Star size={20} />
                    </div>

                    <h3 className="text-lg font-black text-slate-950">
                      How to Earn Points
                    </h3>
                  </div>

                  <div className="mt-5 space-y-5">
                    <HowToEarnItem
                      icon={ShoppingCart}
                      title="Spend to Earn"
                      text="Earn 1 point for every ₱200 spent on orders and services."
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

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        currentLevel.childPanel
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {currentLevel.childPanel ? <Unlock size={23} /> : <Lock size={23} />}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        Child Panel Access
                      </h3>

                      <p
                        className={`mt-2 text-sm font-black ${
                          currentLevel.childPanel
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {currentLevel.childPanel ? "Unlocked" : "Locked"}
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {currentLevel.childPanel
                          ? "You can create and manage child panels for your clients."
                          : "Reach Pro Reseller level to unlock child panel access."}
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          </div>
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
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-400">{subtitle}</p>
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
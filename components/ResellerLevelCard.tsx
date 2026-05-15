"use client";

import { supabase } from "@/lib/supabase";

import { useEffect, useState } from "react";

import {
    BadgeCheck,
    Zap,
    ShieldCheck,
    Crown,
    Gem,
    Trophy,
    Check,
    X,
} from "lucide-react";

const levels = [
    {
        level: 1,
        name: "New Reseller",
        required: 0,
        discount: "0%",
        points: "$1",
        child: false,
        icon: BadgeCheck,
        gradient: "from-blue-600 to-blue-400",
    },
    {
        level: 2,
        name: "Active Reseller",
        required: 20000,
        discount: "1%",
        points: "$1",
        child: false,
        icon: Zap,
        gradient: "from-cyan-500 to-sky-400",
    },
    {
        level: 3,
        name: "Pro Reseller",
        required: 60000,
        discount: "2%",
        points: "$1.25",
        child: false,
        icon: ShieldCheck,
        gradient: "from-violet-600 to-purple-400",
    },
    {
        level: 4,
        name: "Master Reseller",
        required: 150000,
        discount: "3%",
        points: "$1.5",
        child: true,
        icon: Crown,
        gradient: "from-amber-500 to-yellow-400",
    },
    {
        level: 5,
        name: "Elite Partner",
        required: 250000,
        discount: "5%",
        points: "$1.75",
        child: true,
        icon: Gem,
        gradient: "from-emerald-500 to-green-400",
    },
    {
        level: 6,
        name: "Ascend Partner",
        required: 500000,
        discount: "8%",
        points: "$2",
        child: true,
        icon: Trophy,
        gradient: "from-[#0038ff] to-[#00c6ff]",
    },
];

export default function ResellerLevelCard() {
    const [open, setOpen] = useState(false);

    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        async function loadProfile() {
            const { data: authData } =
                await supabase.auth.getUser();

            if (!authData.user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("total_spent")
                .eq("id", authData.user.id)
                .single();

            setTotalSpent(
                Number(profile?.total_spent || 0)
            );
        }

        loadProfile();
    }, []);

    const currentLevel =
        [...levels]
            .reverse()
            .find(
                (level) => totalSpent >= level.required
            ) || levels[0];

    const nextLevel =
        levels.find(
            (level) =>
                level.required > currentLevel.required
        ) || currentLevel;

    const progress =
        currentLevel.level === 6
            ? 100
            : Math.min(
                100,
                ((totalSpent -
                    currentLevel.required) /
                    (nextLevel.required -
                        currentLevel.required)) *
                100
            );

    const CurrentIcon = currentLevel.icon;

    return (
        <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-[17px] font-black text-slate-950">
                        Reseller Level
                    </h3>

                    <button
                        onClick={() => setOpen(true)}
                        className="text-xs font-black text-blue-600 hover:text-blue-700"
                    >
                        View All Levels
                    </button>
                </div>

                <div
                    className={`mt-4 overflow-hidden rounded-2xl bg-gradient-to-r ${currentLevel.gradient}`}
                >
                    <div className="flex items-center gap-4 p-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                            <CurrentIcon
                                size={34}
                                className="text-white"
                            />
                        </div>

                        <div>
                            <h4 className="text-4xl font-black text-white">
                                {currentLevel.name}
                            </h4>

                            <p className="mt-1 text-sm font-medium text-white/80">
                                You&apos;re doing great!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>
                            Next Level: {nextLevel.name}
                        </span>

                        <span>
                            ₱{totalSpent.toFixed(2)} / ₱
                            {nextLevel.required.toLocaleString()}
                        </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            style={{ width: `${progress}%` }}
                            className="h-full rounded-full bg-blue-600"
                        />
                    </div>

                    <p className="mt-2 text-right text-xs font-semibold text-slate-400">
                        {progress.toFixed(2)}%
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                    {[
                        `${currentLevel.discount} Order Discount`,
                        `100 Points = ${currentLevel.points}`,
                        "Child Panel",
                    ].map((perk) => (
                        <div
                            key={perk}
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Check
                                    size={12}
                                    strokeWidth={3}
                                />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                                {perk}
                            </span>

                            {perk === "Child Panel" && (
                                <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-black ${currentLevel.child
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-600"
                                        }`}
                                >
                                    {currentLevel.child
                                        ? "Eligible"
                                        : "Locked"}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div>
                                <h3 className="text-2xl font-black text-slate-950">
                                    Reseller Levels
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Unlock better perks as you
                                    spend more
                                </p>
                            </div>

                            <button
                                onClick={() => setOpen(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[75vh] overflow-y-auto p-6">
                            <div className="grid gap-4">
                                {levels.map((level) => {
                                    const Icon = level.icon;

                                    return (
                                        <div
                                            key={level.level}
                                            className="rounded-2xl border border-slate-200 p-5"
                                        >
                                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${level.gradient} text-white shadow-lg`}
                                                    >
                                                        <Icon size={28} />
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-950">
                                                            Level {level.level} •{" "}
                                                            {level.name}
                                                        </h4>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Required Total
                                                            Spent: ₱
                                                            {level.required.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 lg:w-[420px]">
                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-bold text-slate-400">
                                                            Discount
                                                        </p>

                                                        <h5 className="mt-2 text-lg font-black text-slate-950">
                                                            {level.discount}
                                                        </h5>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-bold text-slate-400">
                                                            Points
                                                        </p>

                                                        <h5 className="mt-2 text-lg font-black text-slate-950">
                                                            {level.points}
                                                        </h5>
                                                    </div>

                                                    <div className="rounded-xl bg-slate-50 p-4">
                                                        <p className="text-xs font-bold text-slate-400">
                                                            Child Panel
                                                        </p>

                                                        <h5
                                                            className={`mt-2 text-lg font-black ${level.child
                                                                    ? "text-green-600"
                                                                    : "text-red-500"
                                                                }`}
                                                        >
                                                            {level.child
                                                                ? "Yes"
                                                                : "No"}
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
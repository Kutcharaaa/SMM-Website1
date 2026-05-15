"use client";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";

const USD_TO_PHP = 56;

function getPointValue(level: string) {
  if (level === "New Reseller") return 1;
  if (level === "Power Reseller") return 1;
  if (level === "Pro Reseller") return 1.25;
  if (level === "Master Reseller") return 1.5;
  if (level === "Premium Partner") return 1.75;
  if (level === "Elite Partner") return 2;
  return 1;
}

export default function ResellerPointsCard() {
  const { showToast } = useToast();

  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState(0);
  const [balance, setBalance] = useState(0);
  const [level, setLevel] = useState("New Reseller");
  const [open, setOpen] = useState(false);
  const [pointsToConvert, setPointsToConvert] = useState("");
  const [converting, setConverting] = useState(false);

  async function loadPoints() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    setUserId(authData.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, reseller_points, reseller_level")
      .eq("id", authData.user.id)
      .single();

    if (profile) {
      setBalance(Number(profile.balance || 0));
      setPoints(Number(profile.reseller_points || 0));
      setLevel(profile.reseller_level || "New Reseller");
    }
  }

  useEffect(() => {
    loadPoints();
  }, []);

  const pointValueUsd = getPointValue(level);
  const estimatedUsd = (points / 100) * pointValueUsd;
  const estimatedPhp = estimatedUsd * USD_TO_PHP;

  const convertAmount = Number(pointsToConvert || 0);
  const convertUsd = (convertAmount / 100) * pointValueUsd;
  const convertPhp = convertUsd * USD_TO_PHP;

  async function handleConvertPoints() {
    if (converting) return;

    if (!userId) {
      showToast("User not authenticated.", "error");
      return;
    }

    if (convertAmount <= 0) {
      showToast("Enter points to convert.", "warning");
      return;
    }

    if (convertAmount > points) {
      showToast("You do not have enough points.", "error");
      return;
    }

    setConverting(true);

    const newPoints = points - convertAmount;
    const newBalance = balance + convertPhp;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        reseller_points: newPoints,
        balance: newBalance,
      })
      .eq("id", userId);

    if (profileError) {
      showToast(profileError.message, "error");
      setConverting(false);
      return;
    }

    const { error: conversionError } = await supabase
      .from("point_conversions")
      .insert({
        user_id: userId,
        points_used: convertAmount,
        usd_value: convertUsd,
        php_value: convertPhp,
        reseller_level: level,
      });

    if (conversionError) {
      showToast(conversionError.message, "error");
      setConverting(false);
      return;
    }

    showToast("Points converted successfully.", "success");

    setPoints(newPoints);
    setBalance(newBalance);
    setPointsToConvert("");
    setOpen(false);
    setConverting(false);
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-black text-slate-950">
            Reseller Points
          </h3>

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Star size={28} fill="currentColor" />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-500">
            Available Points
          </p>

          <h4 className="mt-4 text-4xl font-black text-slate-950">
            {points.toLocaleString()}
            <span className="ml-2 text-lg font-bold text-slate-400">
              pts
            </span>
          </h4>
        </div>

        <div className="my-6 h-px bg-slate-100" />

        <div>
          <p className="text-sm font-semibold text-slate-500">
            Estimated Wallet Credit
          </p>

          <h4 className="mt-3 text-3xl font-black text-blue-600">
            ₱{estimatedPhp.toFixed(2)}
          </h4>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            (100 pts = ${pointValueUsd.toFixed(2)})
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="mt-7 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
        >
          Convert Points
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Convert Points
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Convert reseller points into wallet balance.
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Available Points
                </p>

                <h4 className="mt-2 text-3xl font-black text-blue-600">
                  {points.toLocaleString()} pts
                </h4>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  Your rate: 100 pts = ${pointValueUsd.toFixed(2)}
                </p>
              </div>

              <label className="mt-6 block text-sm font-bold text-slate-700">
                Points to Convert
              </label>

              <input
                type="number"
                min="1"
                value={pointsToConvert}
                onChange={(e) => setPointsToConvert(e.target.value)}
                placeholder="Example: 100"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
              />

              <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  You will receive
                </p>

                <h4 className="mt-2 text-3xl font-black text-slate-950">
                  ₱{convertPhp.toFixed(2)}
                </h4>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  ${convertUsd.toFixed(2)} × ₱{USD_TO_PHP}
                </p>
              </div>

              <button
                onClick={handleConvertPoints}
                disabled={converting}
                className="mt-6 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {converting ? "Converting..." : "Confirm Conversion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
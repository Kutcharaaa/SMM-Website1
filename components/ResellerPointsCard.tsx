"use client";

import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";

const USD_TO_PHP = 56;

type ConversionHistory = {
  id: string;
  points_used: number;
  usd_value: number;
  php_value: number;
  reseller_level: string;
  created_at: string;
};

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
  const { formatAmount } = useDisplayCurrency();

  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState(0);
  const [balance, setBalance] = useState(0);
  const [level, setLevel] = useState("New Reseller");

  const [open, setOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversionHistory, setConversionHistory] = useState<
    ConversionHistory[]
  >([]);

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

  async function loadConversionHistory() {
    if (!userId) return;

    const { data } = await supabase
      .from("point_conversions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    setConversionHistory(data || []);
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

    await loadConversionHistory();
  }

  return (
    <>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[17px] font-black text-slate-950">
              Reseller Points
            </h3>

            <button
              type="button"
              onClick={async () => {
                await loadConversionHistory();
                setHistoryOpen(true);
              }}
              className="mt-1 text-left text-xs font-black text-blue-600 hover:text-blue-700"
            >
              Conversion History
            </button>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-14 sm:w-14">
            <Star size={26} fill="currentColor" />
          </div>
        </div>

        <div className="mt-6 min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            Available Points
          </p>

          <h4 className="mt-4 min-w-0 truncate text-3xl font-black text-slate-950 sm:text-4xl">
            {points.toLocaleString()}
            <span className="ml-2 text-base font-bold text-slate-400 sm:text-lg">
              pts
            </span>
          </h4>
        </div>

        <div className="my-6 h-px bg-slate-100" />

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            Estimated Wallet Credit
          </p>

          <h4 className="mt-3 min-w-0 truncate text-2xl font-black text-blue-600 sm:text-3xl">
            {formatAmount(estimatedPhp)}
          </h4>

          <p className="mt-2 text-xs font-semibold text-slate-400">
            (100 pts = ${pointValueUsd.toFixed(2)})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-7 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
        >
          Convert Points
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Convert Points
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Convert reseller points into wallet balance.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
              <div className="rounded-2xl bg-blue-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Available Points
                </p>

                <h4 className="mt-2 truncate text-2xl font-black text-blue-600 sm:text-3xl">
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

                <h4 className="mt-2 truncate text-2xl font-black text-slate-950 sm:text-3xl">
                  {formatAmount(convertPhp)}
                </h4>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  ${convertUsd.toFixed(2)} × ₱{USD_TO_PHP}
                </p>
              </div>

              <button
                type="button"
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

      {historyOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                  Conversion History
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest reseller point conversions
                </p>
              </div>

              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto">
              {conversionHistory.length <= 0 ? (
                <div className="p-10 text-center text-slate-500">
                  No conversion history yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-5 text-left font-bold">Date</th>
                        <th className="p-5 text-left font-bold">Points</th>
                        <th className="p-5 text-left font-bold">USD</th>
                        <th className="p-5 text-left font-bold">Amount</th>
                        <th className="p-5 text-left font-bold">Level</th>
                      </tr>
                    </thead>

                    <tbody>
                      {conversionHistory.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="whitespace-nowrap p-5 text-slate-500">
                            {new Date(item.created_at).toLocaleString()}
                          </td>

                          <td className="whitespace-nowrap p-5 font-black text-slate-950">
                            {item.points_used} pts
                          </td>

                          <td className="whitespace-nowrap p-5 font-semibold text-slate-700">
                            ${Number(item.usd_value).toFixed(2)}
                          </td>

                          <td className="whitespace-nowrap p-5 font-black text-blue-600">
                            {formatAmount(item.php_value)}
                          </td>

                          <td className="max-w-[220px] truncate p-5 text-slate-500">
                            {item.reseller_level}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
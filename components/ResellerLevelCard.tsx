"use client";

import { useState } from "react";

import {
  BadgeCheck,
  Check,
  X,
  Crown,
} from "lucide-react";

const levels = [
  {
    level: 1,
    name: "New Reseller",
    spent: "₱0",
    discount: "0.5%",
    points: "1x",
    child: false,
  },
  {
    level: 2,
    name: "Active Reseller",
    spent: "₱2,500",
    discount: "1%",
    points: "1.1x",
    child: false,
  },
  {
    level: 3,
    name: "Pro Reseller",
    spent: "₱7,500",
    discount: "2%",
    points: "1.25x",
    child: false,
  },
  {
    level: 4,
    name: "Master Reseller",
    spent: "₱15,000",
    discount: "3%",
    points: "1.5x",
    child: true,
  },
  {
    level: 5,
    name: "Elite Partner",
    spent: "₱35,000",
    discount: "5%",
    points: "1.8x",
    child: true,
  },
  {
    level: 6,
    name: "Ascend Partner",
    spent: "₱75,000",
    discount: "8%",
    points: "2x",
    child: true,
  },
];

export default function ResellerLevelCard() {
  const [open, setOpen] = useState(false);

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

        <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1565ff] to-[#4da3ff]">
          <div className="flex items-center gap-4 p-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BadgeCheck size={34} className="text-white" />
            </div>

            <div>
              <h4 className="text-4xl font-black text-white">
                Pro Reseller
              </h4>

              <p className="mt-1 text-sm font-medium text-blue-100">
                You&apos;re doing great!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Next Level: Master Reseller</span>

            <span>₱2,345.60 / ₱15,000</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[16%] rounded-full bg-blue-600" />
          </div>

          <p className="mt-2 text-right text-xs font-semibold text-slate-400">
            15.64%
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {[
            "2% Order Discount",
            "+1.25x Point Conversion",
            "Child Panel",
          ].map((perk) => (
            <div
              key={perk}
              className="flex items-center gap-3"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Check size={12} strokeWidth={3} />
              </div>

              <span className="text-sm font-semibold text-slate-700">
                {perk}
              </span>

              {perk === "Child Panel" && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-black text-green-700">
                  Eligible
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  Reseller Levels
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Unlock better perks as you spend more
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
                {levels.map((level) => (
                  <div
                    key={level.level}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <Crown size={28} />
                        </div>

                        <div>
                          <h4 className="text-xl font-black text-slate-950">
                            Level {level.level} • {level.name}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            Required Total Spent: {level.spent}
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
                            className={`mt-2 text-lg font-black ${
                              level.child
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {level.child ? "Yes" : "No"}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
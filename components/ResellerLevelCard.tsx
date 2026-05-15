import { BadgeCheck, CheckCircle2 } from "lucide-react";

export default function ResellerLevelCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">
        Reseller Level
      </h3>

      <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
            <BadgeCheck size={34} />
          </div>

          <div>
            <h4 className="text-3xl font-black">Pro Reseller</h4>
            <p className="mt-1 text-sm text-blue-100">
              You&apos;re doing great!
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Next Level: Master Reseller</span>
          <span>₱2,345.60 / ₱15,000</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[16%] rounded-full bg-blue-600" />
        </div>

        <p className="mt-2 text-right text-xs font-semibold text-slate-500">
          15.64%
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {[
          "2% Order Discount",
          "+1.25x Point Conversion",
          "Child Panel Eligible",
        ].map((perk) => (
          <div
            key={perk}
            className="flex items-center gap-3 text-sm font-semibold text-slate-700"
          >
            <CheckCircle2 size={18} className="text-blue-600" />
            {perk}
          </div>
        ))}
      </div>
    </div>
  );
}
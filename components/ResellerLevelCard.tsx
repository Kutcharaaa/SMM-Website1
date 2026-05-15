import { BadgeCheck, Check } from "lucide-react";

export default function ResellerLevelCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-[17px] font-black text-slate-950">
        Reseller Level
      </h3>

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
  );
}
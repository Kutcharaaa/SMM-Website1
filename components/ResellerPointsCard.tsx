import { Star } from "lucide-react";

export default function ResellerPointsCard() {
  return (
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
          235
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
          ₱165.25
        </h4>

        <p className="mt-2 text-xs font-semibold text-slate-400">
          (100 pts = $1.25)
        </p>
      </div>

      <button className="mt-7 w-full rounded-xl bg-blue-600 py-3.5 text-sm font-black text-white transition hover:bg-blue-700">
        Convert Points
      </button>
    </div>
  );
}
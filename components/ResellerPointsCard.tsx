import { Star } from "lucide-react";

export default function ResellerPointsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">
        Reseller Points
      </h3>

      <div className="mt-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            Available Points
          </p>

          <h4 className="mt-3 text-4xl font-black text-slate-950">
            235
            <span className="ml-2 text-lg font-bold text-slate-400">
              pts
            </span>
          </h4>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Star size={30} fill="currentColor" />
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="text-sm font-semibold text-slate-500">
          Estimated Wallet Credit
        </p>

        <h4 className="mt-2 text-3xl font-black text-blue-600">
          ₱165.25
        </h4>

        <p className="mt-2 text-xs font-semibold text-slate-400">
          (100 pts = $1.25)
        </p>
      </div>

      <button className="mt-8 w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700">
        Convert Points
      </button>
    </div>
  );
}
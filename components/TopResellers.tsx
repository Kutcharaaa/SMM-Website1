import {
  Trophy,
  Crown,
  Gem,
  ShieldCheck,
} from "lucide-react";

function maskName(name: string) {
  return name
    .split(" ")
    .map((part) => {
      if (part.length <= 4) {
        return part[0] + "***";
      }

      return (
        part.slice(0, 4) +
        "*".repeat(part.length - 4)
      );
    })
    .join(" ");
}

export default function TopResellers() {
  const topResellers = [
    {
      name: "Rowelle Nuque",
      level: "Ascend Partner",
      spent: "₱125,500",
      orders: "12,450",
      icon: Trophy,
      color: "from-[#0038ff] to-[#00c6ff]",
    },
    {
      name: "BoostKing",
      level: "Elite Partner",
      spent: "₱84,200",
      orders: "8,240",
      icon: Gem,
      color: "from-emerald-500 to-green-400",
    },
    {
      name: "SocialFlow",
      level: "Master Reseller",
      spent: "₱55,800",
      orders: "5,630",
      icon: Crown,
      color: "from-amber-500 to-yellow-400",
    },
    {
      name: "TikTokHub",
      level: "Pro Reseller",
      spent: "₱24,500",
      orders: "2,440",
      icon: ShieldCheck,
      color: "from-violet-500 to-purple-400",
    },
    {
      name: "Ascend Media",
      level: "Active Reseller",
      spent: "₱14,200",
      orders: "1,440",
      icon: ShieldCheck,
      color: "from-cyan-500 to-sky-400",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-black text-slate-950">
          Top Resellers
        </h3>

        <a
          href="/dashboard/reseller"
          className="text-xs font-black text-blue-600 hover:text-blue-700"
        >
          View Rankings
        </a>
      </div>

      <div className="mt-5 max-h-[250px] space-y-4 overflow-y-auto pr-1">
        {topResellers.map((reseller) => {
          const Icon = reseller.icon;

          return (
            <div
              key={reseller.name}
              className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 transition hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${reseller.color} text-white shadow-lg`}
                >
                  <Icon size={26} />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-950">
                    {maskName(reseller.name)}
                  </h4>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {reseller.level}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <h5 className="text-sm font-black text-slate-950">
                  {reseller.spent}
                </h5>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {reseller.orders} orders
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import {
  ShoppingCart,
  Wallet,
  BarChart3,
  Ticket,
} from "lucide-react";

export default function DashboardStats() {
  const stats = [
    {
      title: "Total Spent",
      value: "₱0.00",
      subtitle: "Lifetime",
      icon: Wallet,
    },
    {
      title: "Available Balance",
      value: "₱0.00",
      subtitle: "Wallet",
      icon: Wallet,
    },
    {
      title: "Total Orders",
      value: "0",
      subtitle: "All Time",
      icon: BarChart3,
    },
    {
      title: "Open Tickets",
      value: "0",
      subtitle: "Awaiting Reply",
      icon: Ticket,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {stat.title}
                </p>

                <h3 className="mt-4 text-4xl font-black text-slate-950">
                  {stat.value}
                </h3>

                <p className="mt-3 text-sm font-medium text-slate-400">
                  {stat.subtitle}
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon size={24} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
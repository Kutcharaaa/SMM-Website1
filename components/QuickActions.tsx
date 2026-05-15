import {
  PlusCircle,
  Wallet,
  LifeBuoy,
  Code2,
} from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "New Order",
      desc: "Place a new order",
      href: "/dashboard/new-order",
      icon: PlusCircle,
    },
    {
      title: "Add Funds",
      desc: "Deposit balance",
      href: "/dashboard/add-funds",
      icon: Wallet,
    },
    {
      title: "Open Ticket",
      desc: "Get support",
      href: "/dashboard/tickets",
      icon: LifeBuoy,
    },
    {
      title: "API Access",
      desc: "Get your API key",
      href: "/dashboard/api",
      icon: Code2,
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950">
            Quick Actions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Fast access to important tools
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <a
              key={action.title}
              href={action.href}
              className="group rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={22} strokeWidth={2.2} />
              </div>

              <h4 className="text-base font-black text-slate-950">
                {action.title}
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                {action.desc}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}
export default function QuickActions() {
  const actions = [
    {
      title: "New Order",
      desc: "Place a new social media order",
      href: "/dashboard/new-order",
    },
    {
      title: "Add Funds",
      desc: "Deposit balance into your wallet",
      href: "/dashboard/wallet",
    },
    {
      title: "Open Ticket",
      desc: "Contact support team instantly",
      href: "/dashboard/tickets",
    },
    {
      title: "API Access",
      desc: "Connect your reseller applications",
      href: "/dashboard/api",
    },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-black">Quick Actions</h3>

          <p className="text-sm text-zinc-500 mt-1">
            Fast access to important tools
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {actions.map((action) => (
          <a
            key={action.title}
            href={action.href}
            className="group rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-blue-500/60 transition"
          >
            <h4 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition">
              {action.title}
            </h4>

            <p className="text-sm text-zinc-500 leading-relaxed">
              {action.desc}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
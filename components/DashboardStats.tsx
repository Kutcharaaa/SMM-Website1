export default function DashboardStats() {
  const stats = [
    { title: "Total Orders", value: "0", change: "+0%" },
    { title: "Total Spent", value: "$0.00", change: "+0%" },
    { title: "Balance", value: "$0.00", change: "Starter" },
    { title: "Open Tickets", value: "0", change: "No issues" },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-blue-500/60 transition"
        >
          <p className="text-sm text-zinc-500">{stat.title}</p>

          <h3 className="text-3xl font-black mt-3">{stat.value}</h3>

          <p className="text-sm text-blue-400 mt-4">{stat.change}</p>
        </div>
      ))}
    </div>
  );
}
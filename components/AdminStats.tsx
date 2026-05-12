export default function AdminStats() {
  const stats = [
    {
      title: "Total Users",
      value: "12,540",
      change: "+12%",
    },
    {
      title: "Total Orders",
      value: "1.2M",
      change: "+18%",
    },
    {
      title: "Revenue",
      value: "$58,240",
      change: "+24%",
    },
    {
      title: "Open Tickets",
      value: "28",
      change: "-5%",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-red-500/60 transition"
        >
          <p className="text-sm text-zinc-500">
            {stat.title}
          </p>

          <h3 className="text-3xl font-black mt-3">
            {stat.value}
          </h3>

          <p className="text-sm text-red-400 mt-4">
            {stat.change}
          </p>
        </div>
      ))}
    </div>
  );
}
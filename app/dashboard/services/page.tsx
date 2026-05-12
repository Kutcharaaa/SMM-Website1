import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

export default function DashboardServicesPage() {
  const services = [
    { id: "101", name: "TikTok Followers - Fast", rate: "$2.50", min: "100", max: "10,000", refill: "30 Days" },
    { id: "102", name: "Instagram Likes - Premium", rate: "$1.20", min: "50", max: "20,000", refill: "No Refill" },
    { id: "103", name: "YouTube Views - Stable", rate: "$4.00", min: "1,000", max: "100,000", refill: "7 Days" },
    { id: "104", name: "Telegram Members - Non Drop", rate: "$3.50", min: "100", max: "50,000", refill: "Lifetime" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Services</h2>

          <p className="text-zinc-400 mb-8">
            Browse available services, rates, limits, and refill details.
          </p>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">ID</th>
                  <th className="text-left p-5">Service</th>
                  <th className="text-left p-5">Rate / 1000</th>
                  <th className="text-left p-5">Min</th>
                  <th className="text-left p-5">Max</th>
                  <th className="text-left p-5">Refill</th>
                </tr>
              </thead>

              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-zinc-900">
                    <td className="p-5 text-zinc-400">#{service.id}</td>
                    <td className="p-5 font-medium">{service.name}</td>
                    <td className="p-5 text-blue-400 font-semibold">{service.rate}</td>
                    <td className="p-5 text-zinc-400">{service.min}</td>
                    <td className="p-5 text-zinc-400">{service.max}</td>
                    <td className="p-5 text-zinc-300">{service.refill}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
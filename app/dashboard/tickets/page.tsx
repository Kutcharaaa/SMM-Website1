import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

export default function TicketsPage() {
  const tickets = [
    {
      id: "#501",
      subject: "Order Delay",
      status: "Open",
      updated: "2 mins ago",
    },
    {
      id: "#502",
      subject: "Refill Request",
      status: "Answered",
      updated: "1 hour ago",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-black mb-3">Tickets</h2>

              <p className="text-zinc-400">
                Contact support and manage conversations.
              </p>
            </div>

            <button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition">
              New Ticket
            </button>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">Ticket ID</th>
                  <th className="text-left p-5">Subject</th>
                  <th className="text-left p-5">Status</th>
                  <th className="text-left p-5">Last Updated</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-zinc-900">
                    <td className="p-5 text-zinc-400">{ticket.id}</td>

                    <td className="p-5 font-medium">
                      {ticket.subject}
                    </td>

                    <td className="p-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          ticket.status === "Answered"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="p-5 text-zinc-400">
                      {ticket.updated}
                    </td>
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
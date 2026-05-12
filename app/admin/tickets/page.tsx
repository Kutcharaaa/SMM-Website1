import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

export default function AdminTicketsPage() {
  const tickets = [
    { id: "#501", user: "Maria Cruz", subject: "Order Delay", status: "Open", priority: "High" },
    { id: "#502", user: "John Doe", subject: "Refill Request", status: "Answered", priority: "Medium" },
    { id: "#503", user: "Alex Tan", subject: "Payment Issue", status: "Closed", priority: "Low" },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Tickets</h2>

          <p className="text-zinc-400 mb-8">
            Manage support requests from all users.
          </p>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">Ticket ID</th>
                  <th className="text-left p-5">User</th>
                  <th className="text-left p-5">Subject</th>
                  <th className="text-left p-5">Status</th>
                  <th className="text-left p-5">Priority</th>
                  <th className="text-left p-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-zinc-900">
                    <td className="p-5 text-zinc-400">{ticket.id}</td>
                    <td className="p-5 font-medium">{ticket.user}</td>
                    <td className="p-5 text-zinc-300">{ticket.subject}</td>
                    <td className="p-5">{ticket.status}</td>
                    <td className="p-5 text-blue-400">{ticket.priority}</td>
                    <td className="p-5">
                      <button className="text-blue-400 hover:text-blue-300 font-semibold">
                        Reply
                      </button>
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
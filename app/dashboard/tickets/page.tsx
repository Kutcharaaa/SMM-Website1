"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import EmptyState from "@/components/EmptyState";
import LoadingTable from "@/components/LoadingTable";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string;
  created_at: string;
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);

  async function loadTickets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingTickets(false);
      return;
    }

    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setTickets(data || []);
    setLoadingTickets(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function createTicket() {
    if (loading) return;

    if (!subject || !message) {
      alert("Please complete all fields.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        subject,
        category,
        status: "open",
        priority: "medium",
      })
      .select()
      .single();

    if (error || !ticket) {
      setLoading(false);
      alert(error?.message || "Failed to create ticket.");
      return;
    }

    await supabase.from("ticket_replies").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      message,
      sender_role: "user",
    });

    setSubject("");
    setCategory("");
    setMessage("");
    setLoading(false);

    loadTickets();
  }

  function getStatusStyle(status: string) {
    if (status === "closed") return "bg-red-500/10 text-red-400";
    if (status === "answered") return "bg-green-500/10 text-green-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-black text-white">
        <DashboardSidebar />

        <section className="lg:ml-72 min-h-screen">
          <DashboardTopbar />

          <div className="p-4 lg:p-8">
            <div className="mb-10">
              <h2 className="text-4xl font-black mb-3">Support Tickets</h2>

              <p className="text-zinc-400">
                Contact support and manage your tickets.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-1 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 lg:p-6">
                <h3 className="text-2xl font-black mb-6">Create Ticket</h3>

                <div className="flex flex-col gap-4">
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ticket subject"
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="order">Order</option>
                    <option value="payment">Payment</option>
                    <option value="refill">Refill</option>
                    <option value="other">Other</option>
                  </select>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your issue..."
                    rows={6}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
                  />

                  <button
                    onClick={createTicket}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Ticket"}
                  </button>
                </div>
              </div>

              <div className="xl:col-span-2">
                {loadingTickets ? (
                  <LoadingTable rows={5} />
                ) : tickets.length <= 0 ? (
                  <EmptyState
                    icon="🎫"
                    title="No tickets yet"
                    description="Create your first support ticket if you need help from support."
                  />
                ) : (
                  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-sm">
                        <thead className="bg-black/60 text-zinc-500">
                          <tr>
                            <th className="text-left p-5">Subject</th>
                            <th className="text-left p-5">Category</th>
                            <th className="text-left p-5">Status</th>
                            <th className="text-left p-5">Created</th>
                          </tr>
                        </thead>

                        <tbody>
                          {tickets.map((ticket) => (
                            <tr
                              key={ticket.id}
                              onClick={() => {
                                window.location.href = `/dashboard/tickets/${ticket.id}`;
                              }}
                              className="border-t border-zinc-900 hover:bg-zinc-900/60 cursor-pointer transition"
                            >
                              <td className="p-5 font-medium">
                                {ticket.subject}
                              </td>

                              <td className="p-5 text-zinc-400 capitalize">
                                {ticket.category || "-"}
                              </td>

                              <td className="p-5">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                                    ticket.status
                                  )}`}
                                >
                                  {ticket.status}
                                </span>
                              </td>

                              <td className="p-5 text-zinc-500">
                                {new Date(ticket.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardGuard>
  );
}
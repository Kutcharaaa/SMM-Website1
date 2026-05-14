"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  last_reply_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username?: string;
    email?: string;
  };
};

type Reply = {
  id: string;
  message: string;
  sender_role: string;
  created_at: string;
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");

  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function loadTickets() {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        profiles (
          username,
          email
        )
      `
      )
      .order("updated_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTickets(data || []);
  }

  async function loadReplies(ticketId: string) {
    const { data, error } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      return;
    }

    setReplies(data || []);
  }

  useEffect(() => {
    loadTickets();

    const interval = setInterval(() => {
      loadTickets();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket);
    setReply("");
    setMessage("");
    loadReplies(ticket.id);
  }

  function getStatusStyle(status: string) {
    if (status === "closed") return "bg-red-500/10 text-red-400";
    if (status === "answered") return "bg-green-500/10 text-green-400";
    return "bg-yellow-500/10 text-yellow-400";
  }

  function getPriorityStyle(priority: string) {
    if (priority === "high") return "text-red-400";
    if (priority === "low") return "text-zinc-400";
    return "text-blue-400";
  }

  async function sendAdminReply() {
    if (sendingReply) return;

    setSendingReply(true);
    if (!selectedTicket) {
      setSendingReply(false);
      return;
    }

    if (!reply.trim()) {
      setMessage("Please enter a reply.");
      setSendingReply(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Admin session not found.");
      setSendingReply(false);
      return;
    }

    const { error: replyError } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      message: reply,
      sender_role: "admin",
    });

    if (replyError) {
      setMessage(replyError.message);
      setSendingReply(false);
      return;
    }

    await supabase
      .from("tickets")
      .update({
        status: "answered",
        last_reply_by: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id);

    await supabase.from("notifications").insert({
      user_id: selectedTicket.user_id,
      title: "Support Ticket Answered",
      message: `Support replied to your ticket: ${selectedTicket.subject}`,
      type: "ticket_answered",
      is_read: false,
    });

    setReply("");
    setMessage("Reply sent successfully.");
    setSendingReply(false);
    loadReplies(selectedTicket.id);
    loadTickets();
  }

  async function updateTicketStatus(status: string) {
    if (updatingStatus) return;

    setUpdatingStatus(true);

    if (!selectedTicket) {
      setUpdatingStatus(false);
      return;
    }

    const { error } = await supabase
      .from("tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedTicket.id);

    if (error) {
      setMessage(error.message);
      setUpdatingStatus(false);
      return;
    }

    setMessage(`Ticket marked as ${status}.`);
    setUpdatingStatus(false);
    loadTickets();

    setSelectedTicket({
      ...selectedTicket,
      status,
    });
  }

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

          {message && <p className="text-sm text-blue-400 mb-4">{message}</p>}

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 text-zinc-500">
                <tr>
                  <th className="text-left p-5">User</th>
                  <th className="text-left p-5">Subject</th>
                  <th className="text-left p-5">Category</th>
                  <th className="text-left p-5">Status</th>
                  <th className="text-left p-5">Priority</th>
                  <th className="text-left p-5">Updated</th>
                  <th className="text-left p-5">Action</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-zinc-900">
                    <td className="p-5">
                      <p className="font-medium">
                        {ticket.profiles?.username || "User"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {ticket.profiles?.email || ""}
                      </p>
                    </td>

                    <td className="p-5 text-zinc-300">{ticket.subject}</td>

                    <td className="p-5 text-zinc-400 capitalize">
                      {ticket.category || "other"}
                    </td>

                    <td className="p-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs capitalize ${getStatusStyle(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td
                      className={`p-5 capitalize font-semibold ${getPriorityStyle(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority || "medium"}
                    </td>

                    <td className="p-5 text-zinc-500">
                      {new Date(ticket.updated_at || ticket.created_at).toLocaleString()}
                    </td>

                    <td className="p-5">
                      <button
                        onClick={() => openTicket(ticket)}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Reply
                      </button>
                    </td>
                  </tr>
                ))}

                {tickets.length <= 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-zinc-500">
                      No tickets yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black">{selectedTicket.subject}</h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {selectedTicket.profiles?.username || "User"} •{" "}
                  {selectedTicket.category || "other"} • {selectedTicket.status}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setReplies([]);
                  setReply("");
                  setMessage("");
                }}
                className="text-zinc-500 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 max-h-[520px] overflow-y-auto space-y-4">
              {replies.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 ${item.sender_role === "admin"
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-zinc-800 bg-black"
                    }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold capitalize">
                      {item.sender_role === "admin" ? "Support" : "User"}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-zinc-300 whitespace-pre-line">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-zinc-800 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => updateTicketStatus("open")}
                  disabled={updatingStatus}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? "Updating..." : "Mark Open"}
                </button>

                <button
                  onClick={() => updateTicketStatus("answered")}
                  disabled={updatingStatus}
                  className="rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? "Updating..." : "Mark Answered"}
                </button>

                <button
                  onClick={() => updateTicketStatus("closed")}
                  disabled={updatingStatus}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? "Updating..." : "Close"}
                </button>
              </div>

              {selectedTicket.status !== "closed" && (
                <>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    placeholder="Write support reply..."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
                  />
                  <button
                    onClick={sendAdminReply}
                    disabled={sendingReply}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? "Sending..." : "Send Reply"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
"use client";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};

type Reply = {
  id: string;
  message: string;
  sender_role: string;
  created_at: string;
};

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = String(params.id);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");

  async function loadTicket() {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    setTicket(data || null);

    const { data: replyData } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    setReplies(replyData || []);
  }

  useEffect(() => {
    loadTicket();
  }, []);

  async function sendReply() {
    if (!reply.trim()) {
      setMessage("Please enter a reply.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: reply,
      sender_role: "user",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase
      .from("tickets")
      .update({
        status: "open",
        last_reply_by: "user",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    setReply("");
    setMessage("");
    loadTicket();
  }

  async function closeTicket() {
    const confirmClose = confirm("Close this ticket?");
    if (!confirmClose) return;

    await supabase
      .from("tickets")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    loadTicket();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">
          <a
            href="/dashboard/tickets"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Tickets
          </a>

          <div className="flex items-center justify-between mt-6 mb-8">
            <div>
              <h2 className="text-4xl font-black mb-3">
                {ticket?.subject || "Ticket"}
              </h2>

              <p className="text-zinc-400">
                Status:{" "}
                <span className="capitalize text-blue-400">
                  {ticket?.status || "loading"}
                </span>
              </p>
            </div>

            {ticket?.status !== "closed" && (
              <button
                onClick={closeTicket}
                className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl px-5 py-3 font-semibold transition"
              >
                Close Ticket
              </button>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 mb-6">
            <h3 className="text-xl font-black mb-5">Conversation</h3>

            <div className="space-y-4">
              {replies.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 ${
                    item.sender_role === "admin"
                      ? "border-blue-500/30 bg-blue-500/10"
                      : "border-zinc-800 bg-black"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold capitalize">
                      {item.sender_role === "admin"
                        ? "Support"
                        : "You"}
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
          </div>

          {ticket?.status !== "closed" && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
              <h3 className="text-xl font-black mb-4">Reply</h3>

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={5}
                placeholder="Write your reply..."
                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 resize-none"
              />

              {message && (
                <p className="text-sm text-blue-400 mt-3">{message}</p>
              )}

              <button
                onClick={sendReply}
                className="mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition"
              >
                Send Reply
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
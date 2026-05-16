"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  TicketIcon,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Ticket = {
  id: string;
  ticket_code?: string | null;
  user_id?: string;
  subject: string;
  category: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string | null;
  last_reply_by?: string | null;
};

type Reply = {
  id: string;
  ticket_id?: string;
  user_id?: string;
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
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);

  async function loadTicket() {
    setLoadingTicket(true);

    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (ticketError) {
      console.error("TICKET_LOAD_ERROR:", ticketError.message);
      setTicket(null);
      setReplies([]);
      setLoadingTicket(false);
      return;
    }

    const { data: replyData, error: replyError } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (replyError) {
      console.error("TICKET_REPLIES_LOAD_ERROR:", replyError.message);
      setReplies([]);
    } else {
      setReplies((replyData || []) as Reply[]);
    }

    setTicket((ticketData || null) as Ticket | null);
    setLoadingTicket(false);
  }

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  async function sendReply() {
    if (sendingReply) return;

    if (!reply.trim()) {
      setMessage("Please enter a reply.");
      return;
    }

    setSendingReply(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSendingReply(false);
      setMessage("You must be logged in to reply.");
      return;
    }

    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: ticketId,
      user_id: user.id,
      message: reply.trim(),
      sender_role: "user",
    });

    if (error) {
      console.error("SEND_REPLY_ERROR:", error.message);
      setSendingReply(false);
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
    setSendingReply(false);

    loadTicket();
  }

  async function closeTicket() {
    if (closingTicket) return;

    const confirmClose = confirm("Close this ticket?");
    if (!confirmClose) return;

    setClosingTicket(true);

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (error) {
      console.error("CLOSE_TICKET_ERROR:", error.message);
      setMessage(error.message);
      setClosingTicket(false);
      return;
    }

    setClosingTicket(false);
    loadTicket();
  }

  const displayTicketCode = ticket?.ticket_code || formatTicketId(ticketId);
  const normalizedStatus = normalizeStatus(ticket?.status || "open");
  const normalizedPriority = normalizePriority(ticket?.priority || "medium");
  const isClosed = normalizedStatus === "Closed";

  const firstMessage = useMemo(() => {
    return replies[0]?.message || "No message available.";
  }, [replies]);

  return (
    <DashboardGuard>
      <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
        <DashboardSidebar />

        <section className="min-h-screen lg:ml-72">
          <DashboardTopbar />

          <div className="grid min-h-[calc(100vh-80px)] gap-6 p-4 lg:grid-cols-[1fr_360px] lg:p-8">
            <div>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <Link
                    href="/dashboard/tickets"
                    className="inline-flex items-center gap-2 text-sm font-black text-blue-600 transition hover:text-blue-700"
                  >
                    <ArrowLeft size={17} />
                    Back to Tickets
                  </Link>

                  <h1 className="mt-5 text-3xl font-black text-slate-950">
                    {loadingTicket ? "Loading ticket..." : ticket?.subject || "Ticket"}
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Ticket {displayTicketCode} • Created{" "}
                    {ticket?.created_at ? formatFullDate(ticket.created_at) : "loading"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-xl px-4 py-3 text-sm font-black ${getStatusStyle(
                      normalizedStatus,
                    )}`}
                  >
                    {normalizedStatus}
                  </span>

                  {!isClosed && (
                    <button
                      onClick={closeTicket}
                      disabled={closingTicket}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 text-sm font-black text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      {closingTicket ? "Closing..." : "Close Ticket"}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                  icon={TicketIcon}
                  title="Ticket ID"
                  value={displayTicketCode}
                  color="bg-blue-100 text-blue-600"
                />

                <InfoCard
                  icon={CategoryIconOnly}
                  title="Category"
                  value={ticket?.category || "General Question"}
                  color="bg-green-100 text-green-600"
                />

                <InfoCard
                  icon={AlertTriangle}
                  title="Priority"
                  value={normalizedPriority}
                  color={getPriorityCardColor(normalizedPriority)}
                />

                <InfoCard
                  icon={Clock3}
                  title="Last Update"
                  value={
                    ticket?.updated_at || ticket?.created_at
                      ? formatRelativeDate(ticket.updated_at || ticket.created_at)
                      : "Loading"
                  }
                  color="bg-purple-100 text-purple-600"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Ticket Summary
                    </h2>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      This is the original issue submitted for this ticket.
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-xl px-4 py-2 text-xs font-black ${getPriorityStyle(
                      normalizedPriority,
                    )}`}
                  >
                    {normalizedPriority} Priority
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                  <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-700">
                    {firstMessage}
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        Conversation
                      </h2>

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Follow updates from support and send replies here.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                      <MessageSquare size={24} />
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  {loadingTicket ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                      Loading conversation...
                    </div>
                  ) : replies.length <= 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                      No replies yet.
                    </div>
                  ) : (
                    replies.map((item) => {
                      const isAdmin = item.sender_role === "admin";
                      const isSupport =
                        item.sender_role === "admin" ||
                        item.sender_role === "support" ||
                        item.sender_role === "staff";

                      return (
                        <div
                          key={item.id}
                          className={`flex ${
                            isSupport ? "justify-start" : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[88%] rounded-2xl border p-5 ${
                              isSupport
                                ? "border-blue-100 bg-blue-50"
                                : "border-slate-200 bg-white shadow-sm"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between gap-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                                    isSupport
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {isSupport ? (
                                    <Headphones size={18} />
                                  ) : (
                                    <User size={18} />
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-black text-slate-800">
                                    {isSupport ? "Support" : "You"}
                                  </p>

                                  <p className="text-xs font-semibold text-slate-400">
                                    {isAdmin ? "Admin Reply" : "User Reply"}
                                  </p>
                                </div>
                              </div>

                              <p className="text-xs font-bold text-slate-400">
                                {formatFullDate(item.created_at)}
                              </p>
                            </div>

                            <p className="whitespace-pre-line text-sm font-semibold leading-7 text-slate-700">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {!isClosed ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        Send Reply
                      </h2>

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Add more information or reply to support.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                      <Send size={22} />
                    </div>
                  </div>

                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={6}
                    placeholder="Write your reply..."
                    className="mt-5 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                  />

                  {message && (
                    <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">
                      {message}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs font-semibold text-slate-400">
                      Please avoid sending duplicate replies while waiting for support.
                    </p>

                    <button
                      onClick={sendReply}
                      disabled={sendingReply}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send size={17} />
                      {sendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Lock size={22} />
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-slate-950">
                        This ticket is closed
                      </h2>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        You can create a new ticket if you still need help.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Ticket Details
                  </h3>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <ShieldCheck size={24} />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <DetailRow label="Ticket ID" value={displayTicketCode} />
                  <DetailRow label="Subject" value={ticket?.subject || "Loading"} />
                  <DetailRow label="Category" value={ticket?.category || "General Question"} />
                  <DetailRow label="Priority" value={normalizedPriority} />
                  <DetailRow label="Status" value={normalizedStatus} />
                  <DetailRow
                    label="Created"
                    value={ticket?.created_at ? formatFullDate(ticket.created_at) : "Loading"}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Support Center
                  </h3>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
                    <Headphones size={24} />
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                  We usually reply within{" "}
                  <span className="font-black text-slate-950">1 - 3 hours.</span>
                </p>

                <div className="mt-5 space-y-3">
                  <SupportItem icon={TicketIcon} title="Order Problem" color="bg-blue-50 text-blue-600" />
                  <SupportItem icon={CreditCard} title="Payment Problem" color="bg-green-50 text-green-600" />
                  <SupportItem icon={Wallet} title="Refund Request" color="bg-red-50 text-red-500" />
                  <SupportItem icon={LifeBuoy} title="API Help" color="bg-purple-50 text-purple-600" />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Support Tips
                  </h3>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                    <AlertTriangle size={22} />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    "Include your Order ID",
                    "Explain the issue clearly",
                    "Send proof if payment related",
                    "Wait for admin reply",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm font-bold text-slate-700"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <CheckCircle2 size={14} />
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Need urgent help?
                </h3>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                  For urgent issues please contact us on our social media channels.
                </p>

                <button className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white">
                  Contact Support
                  <ExternalLink size={16} />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </DashboardGuard>
  );
}

function InfoCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={25} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-black text-slate-600">{title}</p>
          <h3 className="mt-2 truncate text-xl font-black text-slate-950">
            {value}
          </h3>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SupportItem({
  icon: Icon,
  title,
  color,
}: {
  icon: any;
  title: string;
  color: string;
}) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={17} />
      </span>

      <span className="text-sm font-black text-slate-700">{title}</span>
    </div>
  );
}

function CategoryIconOnly() {
  return <HelpCircle size={25} />;
}

function normalizeStatus(status: string) {
  const value = (status || "open").toLowerCase();

  if (value.includes("closed")) return "Closed";
  if (value.includes("resolved")) return "Resolved";
  if (value.includes("answer")) return "Answered";
  if (value.includes("pending") || value.includes("waiting")) return "Pending";

  return "Open";
}

function normalizePriority(priority: string) {
  const value = (priority || "medium").toLowerCase();

  if (value.includes("urgent")) return "Urgent";
  if (value.includes("high")) return "High";
  if (value.includes("low")) return "Low";

  return "Medium";
}

function getStatusStyle(status: string) {
  if (status === "Closed") return "bg-slate-100 text-slate-600";
  if (status === "Resolved") return "bg-green-100 text-green-700";
  if (status === "Answered") return "bg-green-100 text-green-700";
  if (status === "Pending") return "bg-orange-100 text-orange-600";

  return "bg-blue-100 text-blue-700";
}

function getPriorityStyle(priority: string) {
  if (priority === "Urgent") return "bg-red-100 text-red-600";
  if (priority === "High") return "bg-rose-100 text-rose-600";
  if (priority === "Medium") return "bg-blue-100 text-blue-600";

  return "bg-slate-100 text-slate-600";
}

function getPriorityCardColor(priority: string) {
  if (priority === "Urgent") return "bg-red-100 text-red-600";
  if (priority === "High") return "bg-rose-100 text-rose-600";
  if (priority === "Medium") return "bg-blue-100 text-blue-600";

  return "bg-slate-100 text-slate-600";
}

function formatTicketId(id: string) {
  const clean = id.replace(/\D/g, "");
  const fallback = id.slice(0, 6).toUpperCase();

  if (!clean) return `AS-${fallback}`;

  return `AS-${clean.slice(0, 4).padStart(4, "0")}`;
}

function formatFullDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}
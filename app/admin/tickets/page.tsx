"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  Filter,
  LifeBuoy,
  MessageCircle,
  RefreshCw,
  Reply,
  Search,
  Send,
  ShieldCheck,
  Timer,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type TicketStatus = "Open" | "Pending" | "Answered" | "Resolved" | "Closed";
type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

type Ticket = {
  id: string;
  ticket_code?: string | null;
  user_id: string;
  subject: string;
  category: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string | null;
};

type TicketReply = {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  message?: string | null;
  sender_role: string;
  created_at: string;
};

type Profile = {
  id: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

type StatusFilter = "all" | "open" | "pending" | "answered" | "resolved" | "closed";
type PriorityFilter = "all" | "low" | "medium" | "high" | "urgent";
type CategoryFilter =
  | "all"
  | "Order Issue"
  | "Payment Issue"
  | "Add Funds"
  | "Service Problem"
  | "Refund Request"
  | "General Question"
  | "API Issue"
  | "Reseller Concern";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Answered", value: "answered" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const priorityFilters: { label: string; value: PriorityFilter }[] = [
  { label: "All Priorities", value: "all" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const categoryFilters: { label: string; value: CategoryFilter }[] = [
  { label: "All Categories", value: "all" },
  { label: "Order Issue", value: "Order Issue" },
  { label: "Payment Issue", value: "Payment Issue" },
  { label: "Add Funds", value: "Add Funds" },
  { label: "Service Problem", value: "Service Problem" },
  { label: "Refund Request", value: "Refund Request" },
  { label: "General Question", value: "General Question" },
  { label: "API Issue", value: "API Issue" },
  { label: "Reseller Concern", value: "Reseller Concern" },
];

function normalizeStatus(status?: string | null): TicketStatus {
  const clean = String(status || "Open").toLowerCase().trim();

  if (clean === "pending") return "Pending";
  if (clean === "answered") return "Answered";
  if (clean === "closed") return "Closed";
  if (clean === "resolved") return "Resolved";

  return "Open";
}

function normalizePriority(priority?: string | null): TicketPriority {
  const clean = String(priority || "Medium").toLowerCase().trim();

  if (clean === "low") return "Low";
  if (clean === "high") return "High";
  if (clean === "urgent") return "Urgent";

  return "Medium";
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTicketCode(ticket: Ticket) {
  if (ticket.ticket_code) return ticket.ticket_code;

  return `TK-${ticket.id.slice(0, 6).toUpperCase()}`;
}

function getDisplayName(profile?: Profile | null) {
  if (!profile) return "User";

  if (profile.username) return profile.username;
  if (profile.full_name) return profile.full_name;

  const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return fullName || "User";
}

function getFullName(profile?: Profile | null) {
  if (!profile) return "User";

  const fullName = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return fullName || profile.full_name || profile.username || "User";
}

function getUserEmail(profile?: Profile | null) {
  return profile?.email || "No email";
}

function getInitial(profile?: Profile | null) {
  return getDisplayName(profile).charAt(0).toUpperCase();
}

function getLastUpdate(ticket: Ticket, replies: TicketReply[]) {
  const latestReply = replies
    .filter((reply) => reply.ticket_id === ticket.id)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];

  return latestReply?.created_at || ticket.updated_at || ticket.created_at;
}

function getAverageResponse(replies: TicketReply[], tickets: Ticket[]) {
  const firstAdminReplyTimes: number[] = [];

  for (const ticket of tickets) {
    const firstAdminReply = replies
      .filter(
        (reply) =>
          reply.ticket_id === ticket.id &&
          String(reply.sender_role || "").toLowerCase() !== "user",
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )[0];

    if (!firstAdminReply) continue;

    const diff =
      new Date(firstAdminReply.created_at).getTime() -
      new Date(ticket.created_at).getTime();

    if (diff > 0) firstAdminReplyTimes.push(diff);
  }

  if (firstAdminReplyTimes.length <= 0) return "—";

  const averageMs =
    firstAdminReplyTimes.reduce((sum, item) => sum + item, 0) /
    firstAdminReplyTimes.length;

  const minutes = Math.round(averageMs / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours <= 0) return `${remainingMinutes}m`;

  return `${hours}h ${remainingMinutes}m`;
}

function StatusBadge({ status }: { status: string }) {
  const clean = normalizeStatus(status);

  const className =
    clean === "Open"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : clean === "Pending"
        ? "bg-orange-50 text-orange-700 ring-orange-100"
        : clean === "Answered"
          ? "bg-blue-50 text-blue-700 ring-blue-100"
          : clean === "Resolved"
            ? "bg-cyan-50 text-cyan-700 ring-cyan-100"
            : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          clean === "Open"
            ? "bg-emerald-500"
            : clean === "Pending"
              ? "bg-orange-500"
              : clean === "Answered"
                ? "bg-blue-500"
                : clean === "Resolved"
                  ? "bg-cyan-500"
                  : "bg-slate-400"
        }`}
      />
      {clean}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const clean = normalizePriority(priority);

  const className =
    clean === "Urgent"
      ? "bg-purple-50 text-purple-700 ring-purple-100"
      : clean === "High"
        ? "bg-red-50 text-red-700 ring-red-100"
        : clean === "Medium"
          ? "bg-orange-50 text-orange-700 ring-orange-100"
          : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}>
      {clean}
    </span>
  );
}

function UserAvatar({ profile }: { profile?: Profile | null }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 font-black text-emerald-700 ring-1 ring-emerald-100">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={getDisplayName(profile)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(profile)
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone: "green" | "blue" | "orange" | "purple" | "cyan";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  dotClass,
  percent,
}: {
  label: string;
  value: string;
  dotClass: string;
  percent?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />
      <p className="flex-1 text-sm font-black text-slate-700">{label}</p>
      {percent && <p className="text-xs font-bold text-slate-400">{percent}</p>}
      <p className="text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAllRows<T>(table: string, orderColumn = "created_at") {
    let rows: T[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(orderColumn, { ascending: false })
        .range(from, to);

      if (error) {
        console.warn(`${table}_LOAD_ERROR:`, error.message);
        return rows;
      }

      const batch = (data || []) as T[];
      rows = [...rows, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    return rows;
  }

  async function loadTickets() {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    setCurrentAdminId(authData.user?.id || null);

    const [ticketRows, replyRows, profileRows] = await Promise.all([
      loadAllRows<Ticket>("tickets", "updated_at"),
      loadAllRows<TicketReply>("ticket_replies", "created_at"),
      loadAllRows<Profile>("profiles", "created_at"),
    ]);

    setTickets(ticketRows);
    setReplies(replyRows);
    setProfiles(profileRows);
    setLoading(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();

    for (const profile of profiles) {
      map.set(profile.id, profile);
    }

    return map;
  }, [profiles]);

  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tickets.filter((ticket) => {
      const userProfile = profileMap.get(ticket.user_id);
      const ticketStatus = normalizeStatus(ticket.status).toLowerCase();
      const ticketPriority = normalizePriority(ticket.priority).toLowerCase();

      const matchesSearch =
        !query ||
        getTicketCode(ticket).toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        String(ticket.category || "").toLowerCase().includes(query) ||
        getDisplayName(userProfile).toLowerCase().includes(query) ||
        getUserEmail(userProfile).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ? true : ticketStatus === statusFilter;

      const matchesCategory =
        categoryFilter === "all" ? true : ticket.category === categoryFilter;

      const matchesPriority =
        priorityFilter === "all" ? true : ticketPriority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [categoryFilter, priorityFilter, profileMap, search, statusFilter, tickets]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((item) => normalizeStatus(item.status) === "Open").length;
    const pending = tickets.filter((item) => normalizeStatus(item.status) === "Pending").length;
    const answered = tickets.filter((item) => normalizeStatus(item.status) === "Answered").length;
    const resolved = tickets.filter((item) =>
      ["Resolved", "Closed"].includes(normalizeStatus(item.status)),
    ).length;

    return {
      total,
      open,
      pending,
      answered,
      resolved,
      averageResponse: getAverageResponse(replies, tickets),
    };
  }, [replies, tickets]);

  const priorityStats = useMemo(() => {
    return {
      urgent: tickets.filter((item) => normalizePriority(item.priority) === "Urgent").length,
      high: tickets.filter((item) => normalizePriority(item.priority) === "High").length,
      medium: tickets.filter((item) => normalizePriority(item.priority) === "Medium").length,
      low: tickets.filter((item) => normalizePriority(item.priority) === "Low").length,
    };
  }, [tickets]);

  const selectedReplies = useMemo(() => {
    if (!selectedTicket) return [];

    return replies
      .filter((reply) => reply.ticket_id === selectedTicket.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [replies, selectedTicket]);

  const recentActivity = useMemo(() => {
    return replies
      .slice(0, 6)
      .map((reply) => {
        const ticket = tickets.find((item) => item.id === reply.ticket_id);

        return {
          id: reply.id,
          title:
            String(reply.sender_role || "").toLowerCase() === "user"
              ? `Customer replied to ${ticket ? getTicketCode(ticket) : "ticket"}`
              : `Admin replied to ${ticket ? getTicketCode(ticket) : "ticket"}`,
          date: reply.created_at,
          role: reply.sender_role,
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [replies, tickets]);

  async function updateTicketStatus(ticket: Ticket, nextStatus: TicketStatus) {
    setMessage("");

    const { error } = await supabase
      .from("tickets")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTickets((current) =>
      current.map((item) =>
        item.id === ticket.id
          ? { ...item, status: nextStatus, updated_at: new Date().toISOString() }
          : item,
      ),
    );

    setSelectedTicket((current) =>
      current?.id === ticket.id
        ? { ...current, status: nextStatus, updated_at: new Date().toISOString() }
        : current,
    );

    await supabase.from("notifications").insert({
      user_id: ticket.user_id,
      title: `Ticket ${nextStatus}`,
      message: `Your ticket ${getTicketCode(ticket)} has been marked as ${nextStatus}.`,
      type: "ticket_status_updated",
      is_read: false,
    });

    setMessage(`Ticket marked as ${nextStatus}.`);
  }

  async function sendAdminReply() {
    if (!selectedTicket || !replyMessage.trim() || replying) return;

    setReplying(true);
    setMessage("");

    const adminId = currentAdminId;

    if (!adminId) {
      setMessage("Admin session not found. Please login again.");
      setReplying(false);
      return;
    }

    const now = new Date().toISOString();

    const { data: newReply, error: replyError } = await supabase
      .from("ticket_replies")
      .insert({
        ticket_id: selectedTicket.id,
        user_id: adminId,
        message: replyMessage.trim(),
        sender_role: "admin",
      })
      .select("*")
      .single();

    if (replyError) {
      setMessage(replyError.message);
      setReplying(false);
      return;
    }

    const { error: ticketError } = await supabase
      .from("tickets")
      .update({
        status: "Answered",
        updated_at: now,
      })
      .eq("id", selectedTicket.id);

    if (ticketError) {
      setMessage(ticketError.message);
      setReplying(false);
      return;
    }

    setReplies((current) => [...current, newReply as TicketReply]);
    setTickets((current) =>
      current.map((item) =>
        item.id === selectedTicket.id
          ? { ...item, status: "Answered", updated_at: now }
          : item,
      ),
    );
    setSelectedTicket((current) =>
      current ? { ...current, status: "Answered", updated_at: now } : current,
    );

    await supabase.from("notifications").insert({
      user_id: selectedTicket.user_id,
      title: "Ticket Reply",
      message: `Admin replied to your ticket ${getTicketCode(selectedTicket)}.`,
      type: "ticket_reply",
      is_read: false,
    });

    setReplyMessage("");
    setReplying(false);
    setMessage("Reply sent successfully.");
  }

  function exportTicketsToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredTickets
      .map((ticket) => {
        const userProfile = profileMap.get(ticket.user_id);
        const replyCount = replies.filter((reply) => reply.ticket_id === ticket.id).length;

        return `
          <tr>
            <td>${escapeHtml(getTicketCode(ticket))}</td>
            <td>${escapeHtml(getDisplayName(userProfile))}</td>
            <td>${escapeHtml(ticket.subject)}</td>
            <td>${escapeHtml(ticket.category || "General")}</td>
            <td>${escapeHtml(normalizePriority(ticket.priority))}</td>
            <td>${escapeHtml(normalizeStatus(ticket.status))}</td>
            <td>${replyCount}</td>
            <td>${formatDate(getLastUpdate(ticket, replies))} ${formatTime(getLastUpdate(ticket, replies))}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1200,height=900");

    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tickets Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
            .muted { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.7; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
            .card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
            .card strong { display: block; margin-top: 8px; font-size: 22px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em; font-weight: 900; padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #334155; vertical-align: top; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Tickets Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Tickets: ${tickets.length}</div>
              <div>Filtered Tickets: ${filteredTickets.length}</div>
              <div>Average Response: ${stats.averageResponse}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Tickets</span><strong>${stats.total}</strong></div>
            <div class="card"><span>Open</span><strong>${stats.open}</strong></div>
            <div class="card"><span>Pending</span><strong>${stats.pending}</strong></div>
            <div class="card"><span>Answered</span><strong>${stats.answered}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>User</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Replies</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="8" style="text-align:center; padding:32px;">No tickets found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Ticket Management Report</span>
            <span>This report was generated from the Admin Tickets page.</span>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Tickets
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage customer support tickets, replies, priorities, and status updates.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadTickets}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportTicketsToPDF}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Download size={17} />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title="Total Tickets"
              value={String(stats.total)}
              subtitle="All customer tickets"
              icon={<LifeBuoy size={26} />}
              tone="green"
            />

            <StatCard
              title="Open Tickets"
              value={String(stats.open)}
              subtitle="Currently open"
              icon={<MessageCircle size={26} />}
              tone="blue"
            />

            <StatCard
              title="Pending Reply"
              value={String(stats.pending)}
              subtitle="Waiting for response"
              icon={<Clock3 size={26} />}
              tone="orange"
            />

            <StatCard
              title="Answered Tickets"
              value={String(stats.answered)}
              subtitle="Admin replied"
              icon={<CheckCircle2 size={26} />}
              tone="purple"
            />

            <StatCard
              title="Average Response"
              value={stats.averageResponse}
              subtitle="Average first response"
              icon={<Timer size={26} />}
              tone="cyan"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_190px_220px_190px_auto]">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="text-slate-400" />

                    <input
                      type="text"
                      placeholder="Search tickets, users, or subjects..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {statusFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {categoryFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {priorityFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("all");
                      setCategoryFilter("all");
                      setPriorityFilter("all");
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Filter size={17} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1160px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Ticket ID</th>
                        <th className="px-5 py-4 text-left">User</th>
                        <th className="px-5 py-4 text-left">Subject</th>
                        <th className="px-5 py-4 text-left">Category</th>
                        <th className="px-5 py-4 text-left">Priority</th>
                        <th className="px-5 py-4 text-left">Status</th>
                        <th className="px-5 py-4 text-left">Replies</th>
                        <th className="px-5 py-4 text-left">Last Update</th>
                        <th className="px-5 py-4 text-left">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredTickets.map((ticket) => {
                        const userProfile = profileMap.get(ticket.user_id);
                        const replyCount = replies.filter((reply) => reply.ticket_id === ticket.id).length;
                        const lastUpdate = getLastUpdate(ticket, replies);

                        return (
                          <tr key={ticket.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {getTicketCode(ticket)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-3">
                                <UserAvatar profile={userProfile} />

                                <div className="min-w-0">
                                  <p className="max-w-[160px] truncate font-black text-slate-950">
                                    {getFullName(userProfile)}
                                  </p>
                                  <p className="mt-1 max-w-[160px] truncate text-xs font-semibold text-slate-500">
                                    {getUserEmail(userProfile)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="max-w-[230px] truncate font-black text-slate-950">
                                {ticket.subject}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Created {formatDate(ticket.created_at)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top font-black text-slate-700">
                              {ticket.category || "General Question"}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <PriorityBadge priority={ticket.priority} />
                            </td>

                            <td className="px-5 py-5 align-top">
                              <StatusBadge status={ticket.status} />
                            </td>

                            <td className="px-5 py-5 align-top font-black text-slate-800">
                              {replyCount}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-800">
                                {formatDate(lastUpdate)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {formatTime(lastUpdate)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setReplyMessage("");
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="View ticket"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredTickets.length <= 0 && (
                        <tr>
                          <td colSpan={9} className="px-5 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                <LifeBuoy size={26} />
                              </div>

                              <h3 className="mt-4 text-lg font-black text-slate-950">
                                No tickets found
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                Try clearing your search or filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing <span className="font-black text-slate-800">{filteredTickets.length}</span>{" "}
                    of <span className="font-black text-slate-800">{tickets.length}</span> tickets
                  </p>

                  <p>{loading ? "Loading tickets..." : "Ticket data loaded"}</p>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Ticket Health</h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow
                    label="Open"
                    value={String(stats.open)}
                    dotClass="bg-emerald-500"
                    percent={stats.total > 0 ? `${((stats.open / stats.total) * 100).toFixed(1)}%` : "0%"}
                  />
                  <SummaryRow
                    label="Pending"
                    value={String(stats.pending)}
                    dotClass="bg-orange-500"
                    percent={stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : "0%"}
                  />
                  <SummaryRow
                    label="Answered"
                    value={String(stats.answered)}
                    dotClass="bg-blue-500"
                    percent={stats.total > 0 ? `${((stats.answered / stats.total) * 100).toFixed(1)}%` : "0%"}
                  />
                  <SummaryRow
                    label="Resolved / Closed"
                    value={String(stats.resolved)}
                    dotClass="bg-cyan-500"
                    percent={stats.total > 0 ? `${((stats.resolved / stats.total) * 100).toFixed(1)}%` : "0%"}
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Priority Summary</h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow label="Urgent" value={String(priorityStats.urgent)} dotClass="bg-purple-500" />
                  <SummaryRow label="High" value={String(priorityStats.high)} dotClass="bg-red-500" />
                  <SummaryRow label="Medium" value={String(priorityStats.medium)} dotClass="bg-orange-500" />
                  <SummaryRow label="Low" value={String(priorityStats.low)} dotClass="bg-emerald-500" />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>
                </div>

                <div className="space-y-4">
                  {recentActivity.length <= 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No recent ticket activity.
                    </p>
                  ) : (
                    recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            String(item.role).toLowerCase() === "user"
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(item.date)} {formatTime(item.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {selectedTicket && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-6xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {getTicketCode(selectedTicket)} · {selectedTicket.subject}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Manage customer support conversation and ticket status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[78vh] overflow-hidden xl:grid-cols-[1fr_340px]">
                <div className="overflow-y-auto p-6">
                  <div className="mb-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Category</p>
                      <p className="mt-2 text-sm font-black text-slate-900">{selectedTicket.category || "General Question"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Priority</p>
                      <div className="mt-2"><PriorityBadge priority={selectedTicket.priority} /></div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Status</p>
                      <div className="mt-2"><StatusBadge status={selectedTicket.status} /></div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">Created</p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {formatDate(selectedTicket.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5">
                    {selectedReplies.length <= 0 ? (
                      <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500">
                        No replies yet.
                      </p>
                    ) : (
                      selectedReplies.map((reply) => {
                        const isAdmin =
                          String(reply.sender_role || "").toLowerCase() !== "user";
                        const senderProfile = reply.user_id
                          ? profileMap.get(reply.user_id)
                          : null;

                        return (
                          <div
                            key={reply.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-3xl px-5 py-4 shadow-sm ${
                                isAdmin
                                  ? "bg-emerald-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <span
                                  className={`text-xs font-black uppercase tracking-wide ${
                                    isAdmin ? "text-emerald-50" : "text-slate-500"
                                  }`}
                                >
                                  {isAdmin ? "Admin Support" : getDisplayName(senderProfile)}
                                </span>

                                <span
                                  className={`text-xs font-semibold ${
                                    isAdmin ? "text-emerald-100" : "text-slate-400"
                                  }`}
                                >
                                  {formatDate(reply.created_at)} {formatTime(reply.created_at)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                                {reply.message || "No message content."}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
                    <label className="block text-sm font-black text-slate-700">
                      Reply as Admin
                    </label>

                    <textarea
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                      placeholder="Type your reply to the customer..."
                      rows={5}
                      className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                    />

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => updateTicketStatus(selectedTicket, "Pending")}
                        className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-black text-orange-600 transition hover:bg-orange-50"
                      >
                        Mark Pending
                      </button>

                      <button
                        type="button"
                        onClick={sendAdminReply}
                        disabled={replying || !replyMessage.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {replying ? <RefreshCw size={17} className="animate-spin" /> : <Send size={17} />}
                        {replying ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>

                <aside className="overflow-y-auto border-t border-slate-200 bg-slate-50/70 p-6 xl:border-l xl:border-t-0">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-black text-slate-950">Customer</h4>

                    <div className="mt-4 flex items-center gap-3">
                      <UserAvatar profile={profileMap.get(selectedTicket.user_id)} />

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {getFullName(profileMap.get(selectedTicket.user_id))}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {getUserEmail(profileMap.get(selectedTicket.user_id))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-black text-slate-950">Quick Status</h4>

                    <div className="mt-4 grid gap-3">
                      {(["Open", "Pending", "Answered", "Resolved", "Closed"] as TicketStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateTicketStatus(selectedTicket, status)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                          Mark as {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h4 className="text-lg font-black text-slate-950">Ticket Info</h4>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="font-bold text-slate-500">Ticket ID</span>
                        <span className="font-black text-slate-900">{getTicketCode(selectedTicket)}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="font-bold text-slate-500">Replies</span>
                        <span className="font-black text-slate-900">{selectedReplies.length}</span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="font-bold text-slate-500">Last Update</span>
                        <span className="font-black text-slate-900">
                          {formatDate(getLastUpdate(selectedTicket, replies))}
                        </span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

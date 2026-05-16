"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  ExternalLink,
  Eye,
  Filter,
  Headphones,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Plus,
  Search,
  Send,
  TicketIcon,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TicketReply = {
  id: string;
  ticket_id: string;
  sender_role: string;
  created_at: string;
};

type Ticket = {
  id: string;
  ticket_code?: string | null;
  subject: string;
  category: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string | null;
  ticket_replies?: TicketReply[];
};

const TICKETS_PER_PAGE = 8;

const categories = [
  "Order Issue",
  "Payment Issue",
  "Add Funds",
  "Service Problem",
  "Refund Request",
  "General Question",
  "API Issue",
  "Reseller Concern",
];

const priorities = ["Low", "Medium", "High", "Urgent"];

const statuses = ["All Status", "Open", "Pending", "Answered", "Closed"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Order Issue");
  const [priority, setPriority] = useState("Medium");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [priorityFilter, setPriorityFilter] = useState("All Priority");
  const [currentPage, setCurrentPage] = useState(1);

  async function loadTickets() {
    setLoadingTickets(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setTickets([]);
      setLoadingTickets(false);
      return;
    }

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_replies (
          id,
          ticket_id,
          sender_role,
          created_at
        )
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("TICKETS_LOAD_ERROR:", error.message);
      setTickets([]);
      setLoadingTickets(false);
      return;
    }

    setTickets((data || []) as Ticket[]);
    setLoadingTickets(false);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function createTicket() {
    if (loading) return;

    if (!subject.trim() || !message.trim()) {
      alert("Please complete the subject and message.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      alert("You must be logged in to create a ticket.");
      return;
    }

    const finalMessage = relatedOrderId.trim()
      ? `Related Order ID: ${relatedOrderId.trim()}\n\n${message.trim()}`
      : message.trim();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category,
        status: "open",
        priority: priority.toLowerCase(),
      })
      .select()
      .single();

    if (error || !ticket) {
      console.error("CREATE_TICKET_ERROR:", error?.message);
      setLoading(false);
      alert(error?.message || "Failed to create ticket.");
      return;
    }

    const { error: replyError } = await supabase.from("ticket_replies").insert({
      ticket_id: ticket.id,
      user_id: user.id,
      message: finalMessage,
      sender_role: "user",
    });

    if (replyError) {
      console.error("CREATE_TICKET_REPLY_ERROR:", replyError.message);
      setLoading(false);
      alert(replyError.message || "Ticket created but message failed.");
      return;
    }

    setSubject("");
    setCategory("Order Issue");
    setPriority("Medium");
    setRelatedOrderId("");
    setMessage("");
    setShowCreateModal(false);
    setLoading(false);

    loadTickets();
  }

  const filteredTickets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const status = normalizeStatus(ticket.status);
      const ticketCategory = ticket.category || "";
      const ticketPriority = normalizePriority(ticket.priority);
      const ticketCode = ticket.ticket_code || "";

      const matchesSearch =
        keyword.length <= 0 ||
        ticketCode.toLowerCase().includes(keyword) ||
        ticket.id.toLowerCase().includes(keyword) ||
        ticket.subject.toLowerCase().includes(keyword) ||
        ticketCategory.toLowerCase().includes(keyword) ||
        ticketPriority.toLowerCase().includes(keyword) ||
        status.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "All Status"
          ? true
          : statusFilter === "Closed"
            ? status === "Closed" || status === "Resolved"
            : status.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All Categories"
          ? true
          : ticketCategory.toLowerCase() === categoryFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === "All Priority"
          ? true
          : ticketPriority.toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tickets, search, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, priorityFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTickets.length / TICKETS_PER_PAGE),
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * TICKETS_PER_PAGE;
    return filteredTickets.slice(startIndex, startIndex + TICKETS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  const startItem =
    filteredTickets.length > 0 ? (currentPage - 1) * TICKETS_PER_PAGE + 1 : 0;

  const endItem = Math.min(
    currentPage * TICKETS_PER_PAGE,
    filteredTickets.length,
  );

  const openTickets = tickets.filter(
    (ticket) => normalizeStatus(ticket.status) === "Open",
  ).length;

  const pendingTickets = tickets.filter(
    (ticket) => normalizeStatus(ticket.status) === "Pending",
  ).length;

  const resolvedTickets = tickets.filter((ticket) => {
    const status = normalizeStatus(ticket.status);
    return status === "Closed" || status === "Resolved";
  }).length;

  const averageResponse = calculateAverageResponseTime(tickets);

  function applyStatusFilter(status: string) {
    setStatusFilter(status);
    setCategoryFilter("All Categories");
    setPriorityFilter("All Priority");
    setSearch("");
    setCurrentPage(1);
  }

  function resetTicketFilters() {
    setStatusFilter("All Status");
    setCategoryFilter("All Categories");
    setPriorityFilter("All Priority");
    setSearch("");
    setCurrentPage(1);
  }

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
                  <h1 className="text-3xl font-black text-slate-950">
                    Tickets
                  </h1>

                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Need help? Create a ticket and our support team will assist you.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Create Ticket
                </button>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={MessageSquare}
                  title="Open Tickets"
                  value={loadingTickets ? "..." : openTickets.toLocaleString()}
                  link="View all open"
                  color="bg-blue-100 text-blue-600"
                  onClick={() => applyStatusFilter("Open")}
                />

                <StatCard
                  icon={Clock3}
                  title="Pending Reply"
                  value={loadingTickets ? "..." : pendingTickets.toLocaleString()}
                  link="View pending"
                  color="bg-orange-100 text-orange-500"
                  onClick={() => applyStatusFilter("Pending")}
                />

                <StatCard
                  icon={CheckCircle2}
                  title="Resolved Tickets"
                  value={loadingTickets ? "..." : resolvedTickets.toLocaleString()}
                  link="View resolved"
                  color="bg-green-100 text-green-600"
                  onClick={() => applyStatusFilter("Closed")}
                />

                <StatCard
                  icon={Clock3}
                  title="Average Response"
                  value={loadingTickets ? "..." : averageResponse}
                  link="View statistics"
                  color="bg-purple-100 text-purple-600"
                  onClick={resetTicketFilters}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_190px_220px_190px_54px]">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search ticket..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    <option>All Categories</option>
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    <option>All Priority</option>
                    {priorities.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={resetTicketFilters}
                    className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                    title="Reset filters"
                  >
                    <Filter size={19} />
                  </button>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-5 text-left font-black">Ticket ID</th>
                        <th className="p-5 text-left font-black">Subject</th>
                        <th className="p-5 text-left font-black">Category</th>
                        <th className="p-5 text-left font-black">Priority</th>
                        <th className="p-5 text-left font-black">Status</th>
                        <th className="p-5 text-left font-black">Last Update</th>
                        <th className="p-5 text-left font-black">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingTickets ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-sm font-semibold text-slate-500"
                          >
                            Loading tickets...
                          </td>
                        </tr>
                      ) : filteredTickets.length <= 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-sm font-semibold text-slate-500"
                          >
                            No tickets found. Create a ticket if you need support.
                          </td>
                        </tr>
                      ) : (
                        paginatedTickets.map((ticket) => {
                          const status = normalizeStatus(ticket.status);
                          const ticketPriority = normalizePriority(ticket.priority);
                          const displayCode =
                            ticket.ticket_code || formatTicketId(ticket.id);

                          return (
                            <tr
                              key={ticket.id}
                              className="border-t border-slate-100 transition hover:bg-blue-50/40"
                            >
                              <td className="p-5">
                                <Link
                                  href={`/dashboard/tickets/${ticket.id}`}
                                  className="font-black text-blue-600"
                                >
                                  {displayCode}
                                </Link>
                              </td>

                              <td className="p-5">
                                <p className="font-black text-slate-800">
                                  {ticket.subject}
                                </p>
                              </td>

                              <td className="p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                  <CategoryIcon category={ticket.category || ""} />
                                  {ticket.category || "General Question"}
                                </div>
                              </td>

                              <td className="p-5">
                                <span
                                  className={`rounded-lg px-3 py-1 text-xs font-black ${getPriorityStyle(
                                    ticketPriority,
                                  )}`}
                                >
                                  {ticketPriority}
                                </span>
                              </td>

                              <td className="p-5">
                                <span
                                  className={`rounded-lg px-3 py-1 text-xs font-black ${getStatusStyle(
                                    status,
                                  )}`}
                                >
                                  {status}
                                </span>
                              </td>

                              <td className="p-5 font-semibold text-slate-600">
                                {formatRelativeDate(
                                  ticket.updated_at || ticket.created_at,
                                )}
                              </td>

                              <td className="p-5">
                                <Link
                                  href={`/dashboard/tickets/${ticket.id}`}
                                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
                                >
                                  <Eye size={16} />
                                  View
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-4 border-t border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    Showing{" "}
                    <span className="font-black text-slate-700">
                      {startItem.toLocaleString()} to {endItem.toLocaleString()}
                    </span>{" "}
                    of{" "}
                    <span className="font-black text-slate-700">
                      {filteredTickets.length.toLocaleString()}
                    </span>{" "}
                    tickets
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20">
                      {currentPage}
                    </button>

                    <button
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Support Center
                  </h3>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                    <Headphones size={24} />
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                  We usually reply within{" "}
                  <span className="font-black text-slate-950">1 - 3 hours.</span>
                </p>

                <div className="mt-5 space-y-3">
                  <QuickHelpButton
                    icon={TicketIcon}
                    title="Order Problem"
                    color="text-blue-600 bg-blue-50"
                  />

                  <QuickHelpButton
                    icon={CreditCard}
                    title="Payment Problem"
                    color="text-green-600 bg-green-50"
                  />

                  <QuickHelpButton
                    icon={Wallet}
                    title="Refund Request"
                    color="text-red-500 bg-red-50"
                  />

                  <QuickHelpButton
                    icon={LifeBuoy}
                    title="API Help"
                    color="text-purple-600 bg-purple-50"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-xl font-black text-slate-950">
                    Before you create a ticket
                  </h3>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-500">
                    <AlertTriangle size={22} />
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    "Include your Order ID",
                    "Explain the issue clearly",
                    "Attach proof if payment related",
                    "Do not create duplicate tickets",
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

          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Create Ticket
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Send your issue to our support team.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Subject
                    </label>

                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Example: Order not starting"
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">
                        Category
                      </label>

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                      >
                        {categories.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-black text-slate-700">
                        Priority
                      </label>

                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                      >
                        {priorities.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Related Order ID{" "}
                      <span className="font-semibold text-slate-400">
                        optional
                      </span>
                    </label>

                    <input
                      value={relatedOrderId}
                      onChange={(e) => setRelatedOrderId(e.target.value)}
                      placeholder="Example: 1024"
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Message
                    </label>

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your issue clearly..."
                      rows={6}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-6 md:flex-row md:justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={createTicket}
                    disabled={loading}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={17} />
                    {loading ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </DashboardGuard>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  link,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  value: string;
  link: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={26} />
        </div>

        <div>
          <p className="text-sm font-black text-slate-600">{title}</p>
          <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 text-sm font-black text-blue-600 transition hover:text-blue-700"
      >
        {link} →
      </button>
    </div>
  );
}

function QuickHelpButton({
  icon: Icon,
  title,
  color,
}: {
  icon: any;
  title: string;
  color: string;
}) {
  return (
    <button className="flex h-14 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left transition hover:border-blue-300 hover:bg-blue-50">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
        >
          <Icon size={18} />
        </span>

        <span className="text-sm font-black text-slate-700">{title}</span>
      </div>

      <ArrowRight size={17} className="text-slate-400" />
    </button>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const value = category.toLowerCase();

  if (value.includes("order")) {
    return <TicketIcon size={17} className="text-blue-600" />;
  }

  if (value.includes("payment")) {
    return <CreditCard size={17} className="text-green-600" />;
  }

  if (value.includes("fund")) {
    return <Wallet size={17} className="text-purple-600" />;
  }

  if (value.includes("refund")) {
    return <Wallet size={17} className="text-red-500" />;
  }

  if (value.includes("api")) {
    return <LifeBuoy size={17} className="text-blue-500" />;
  }

  return <HelpCircle size={17} className="text-slate-500" />;
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

function calculateAverageResponseTime(tickets: Ticket[]) {
  const responseTimes: number[] = [];

  tickets.forEach((ticket) => {
    const replies = ticket.ticket_replies || [];

    const firstUserReply = replies
      .filter((reply) => reply.sender_role === "user")
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )[0];

    const firstAdminReply = replies
      .filter(
        (reply) =>
          reply.sender_role === "admin" ||
          reply.sender_role === "support" ||
          reply.sender_role === "staff",
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .find((reply) => {
        if (!firstUserReply) return false;

        return (
          new Date(reply.created_at).getTime() >
          new Date(firstUserReply.created_at).getTime()
        );
      });

    if (firstUserReply && firstAdminReply) {
      const responseMs =
        new Date(firstAdminReply.created_at).getTime() -
        new Date(firstUserReply.created_at).getTime();

      if (responseMs > 0) {
        responseTimes.push(responseMs);
      }
    }
  });

  if (responseTimes.length <= 0) {
    return "0m";
  }

  const averageMs =
    responseTimes.reduce((total, current) => total + current, 0) /
    responseTimes.length;

  return formatDuration(averageMs);
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.max(0, Math.round(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatTicketId(id: string) {
  const clean = id.replace(/\D/g, "");
  const fallback = id.slice(0, 6).toUpperCase();

  if (!clean) return `AS-${fallback}`;

  return `AS-${clean.slice(0, 4).padStart(4, "0")}`;
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
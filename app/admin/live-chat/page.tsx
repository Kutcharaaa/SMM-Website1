"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Mail,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Conversation = {
  id: string;
  user_id: string;
  subject: string | null;
  status: string | null;
  last_message: string | null;
  last_sender_role: string | null;
  created_at: string;
  updated_at: string | null;
};

type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: string;
  message: string;
  is_read: boolean | null;
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
  balance?: number | string | null;
  created_at?: string | null;
};

type StatusFilter = "all" | "open" | "pending" | "closed";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Closed", value: "closed" },
];

function normalizeStatus(status?: string | null) {
  const clean = String(status || "open").toLowerCase().trim();

  if (clean === "pending") return "pending";
  if (clean === "closed" || clean === "resolved") return "closed";

  return "open";
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

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return `${formatDate(value)} ${formatTime(value)}`;
}

function formatAmount(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getDisplayName(profile?: Profile | null) {
  if (!profile) return "Customer";

  if (profile.username) return profile.username;
  if (profile.full_name) return profile.full_name;

  const name = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return name || "Customer";
}

function getFullName(profile?: Profile | null) {
  if (!profile) return "Customer";

  const name = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return name || profile.full_name || profile.username || "Customer";
}

function getEmail(profile?: Profile | null) {
  return profile?.email || "No email";
}

function getInitial(profile?: Profile | null) {
  return getDisplayName(profile).charAt(0).toUpperCase();
}

function getConversationCode(conversation: Conversation) {
  return `CONV-${conversation.id.slice(0, 6).toUpperCase()}`;
}

function getLastTime(conversation: Conversation) {
  return conversation.updated_at || conversation.created_at;
}

function timeAgo(value?: string | null) {
  if (!value) return "—";

  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatusBadge({ status }: { status?: string | null }) {
  const clean = normalizeStatus(status);

  const className =
    clean === "open"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : clean === "pending"
        ? "bg-orange-50 text-orange-700 ring-orange-100"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          clean === "open"
            ? "bg-emerald-500"
            : clean === "pending"
              ? "bg-orange-500"
              : "bg-slate-400"
        }`}
      />
      {clean}
    </span>
  );
}

function UserAvatar({ profile }: { profile?: Profile | null }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 font-black text-emerald-700 ring-1 ring-emerald-100">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
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
  tone: "blue" | "orange" | "green" | "purple";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
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
}: {
  label: string;
  value: string;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
      <p className="flex-1 text-sm font-black text-slate-700">{label}</p>
      <p className="text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

export default function AdminLiveChatPage() {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [replyMessage, setReplyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAllRows<T>(tableName: string, orderColumn = "created_at") {
    let allRows: T[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(orderColumn, { ascending: false })
        .range(from, to);

      if (error) {
        console.warn(`${tableName.toUpperCase()}_LOAD_ERROR:`, error.message);
        return allRows;
      }

      const batch = (data || []) as T[];
      allRows = [...allRows, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    return allRows;
  }

  async function loadLiveChatData() {
    setLoading(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    setCurrentAdminId(authData.user?.id || null);

    const [conversationRows, messageRows, profileRows] = await Promise.all([
      loadAllRows<Conversation>("support_conversations", "updated_at"),
      loadAllRows<SupportMessage>("support_messages", "created_at"),
      loadAllRows<Profile>("profiles", "created_at"),
    ]);

    setConversations(conversationRows);
    setMessages(messageRows);
    setProfiles(profileRows);

    if (!selectedConversation && conversationRows.length > 0) {
      setSelectedConversation(conversationRows[0]);
    } else if (selectedConversation) {
      const freshSelected = conversationRows.find(
        (conversation) => conversation.id === selectedConversation.id,
      );

      if (freshSelected) setSelectedConversation(freshSelected);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadLiveChatData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-live-chat")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => {
          loadLiveChatData();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => {
          loadLiveChatData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.id, messages.length]);

  const profileMap = useMemo(() => {
    const map = new Map<string, Profile>();

    for (const profile of profiles) {
      map.set(profile.id, profile);
    }

    return map;
  }, [profiles]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversation) return [];

    return messages
      .filter((item) => item.conversation_id === selectedConversation.id)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
  }, [messages, selectedConversation]);

  const unreadByConversation = useMemo(() => {
    const map = new Map<string, number>();

    for (const item of messages) {
      if (
        String(item.sender_role || "").toLowerCase() === "user" &&
        item.is_read === false
      ) {
        map.set(item.conversation_id, (map.get(item.conversation_id) || 0) + 1);
      }
    }

    return map;
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const query = search.toLowerCase().trim();

    return conversations.filter((conversation) => {
      const userProfile = profileMap.get(conversation.user_id);
      const status = normalizeStatus(conversation.status);

      const matchesSearch =
        !query ||
        getConversationCode(conversation).toLowerCase().includes(query) ||
        String(conversation.subject || "").toLowerCase().includes(query) ||
        String(conversation.last_message || "").toLowerCase().includes(query) ||
        getDisplayName(userProfile).toLowerCase().includes(query) ||
        getEmail(userProfile).toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [conversations, profileMap, search, statusFilter]);

  const stats = useMemo(() => {
    const active = conversations.filter(
      (conversation) => normalizeStatus(conversation.status) === "open",
    ).length;
    const pending = conversations.filter(
      (conversation) => normalizeStatus(conversation.status) === "pending",
    ).length;
    const closed = conversations.filter(
      (conversation) => normalizeStatus(conversation.status) === "closed",
    ).length;
    const unread = messages.filter(
      (item) =>
        String(item.sender_role || "").toLowerCase() === "user" &&
        item.is_read === false,
    ).length;

    return {
      active,
      pending,
      closed,
      unread,
    };
  }, [conversations, messages]);

  async function markSelectedMessagesRead(conversation: Conversation) {
    const unreadIds = messages
      .filter(
        (item) =>
          item.conversation_id === conversation.id &&
          String(item.sender_role || "").toLowerCase() === "user" &&
          item.is_read === false,
      )
      .map((item) => item.id);

    if (unreadIds.length <= 0) return;

    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    setMessages((current) =>
      current.map((item) =>
        unreadIds.includes(item.id) ? { ...item, is_read: true } : item,
      ),
    );
  }

  async function selectConversation(conversation: Conversation) {
    setSelectedConversation(conversation);
    setReplyMessage("");
    await markSelectedMessagesRead(conversation);
  }

  async function updateConversationStatus(
    conversation: Conversation,
    nextStatus: "open" | "pending" | "closed",
  ) {
    setMessage("");

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("support_conversations")
      .update({
        status: nextStatus,
        updated_at: now,
      })
      .eq("id", conversation.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setConversations((current) =>
      current.map((item) =>
        item.id === conversation.id
          ? { ...item, status: nextStatus, updated_at: now }
          : item,
      ),
    );

    setSelectedConversation((current) =>
      current?.id === conversation.id
        ? { ...current, status: nextStatus, updated_at: now }
        : current,
    );

    setMessage(`Conversation marked as ${nextStatus}.`);
  }

  async function sendAdminReply() {
    if (!selectedConversation || !replyMessage.trim() || sendingReply) return;

    if (!currentAdminId) {
      setMessage("Admin session not found. Please login again.");
      return;
    }

    setSendingReply(true);
    setMessage("");

    const now = new Date().toISOString();
    const cleanMessage = replyMessage.trim();

    const { data: newMessage, error: messageError } = await supabase
      .from("support_messages")
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentAdminId,
        sender_role: "admin",
        message: cleanMessage,
        is_read: false,
      })
      .select("*")
      .single();

    if (messageError) {
      setMessage(messageError.message);
      setSendingReply(false);
      return;
    }

    const { error: conversationError } = await supabase
      .from("support_conversations")
      .update({
        status: "open",
        last_message: cleanMessage,
        last_sender_role: "admin",
        updated_at: now,
      })
      .eq("id", selectedConversation.id);

    if (conversationError) {
      setMessage(conversationError.message);
      setSendingReply(false);
      return;
    }

    setMessages((current) => [...current, newMessage as SupportMessage]);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? {
              ...conversation,
              status: "open",
              last_message: cleanMessage,
              last_sender_role: "admin",
              updated_at: now,
            }
          : conversation,
      ),
    );
    setSelectedConversation((current) =>
      current
        ? {
            ...current,
            status: "open",
            last_message: cleanMessage,
            last_sender_role: "admin",
            updated_at: now,
          }
        : current,
    );

    await supabase.from("notifications").insert({
      user_id: selectedConversation.user_id,
      title: "New Live Chat Reply",
      message: "Admin replied to your live chat conversation.",
      type: "live_chat_reply",
      is_read: false,
    });

    setReplyMessage("");
    setSendingReply(false);
  }

  const selectedProfile = selectedConversation
    ? profileMap.get(selectedConversation.user_id)
    : null;

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Live Chat
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage and respond to customer live chat conversations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Online
              </div>

              <button
                type="button"
                onClick={loadLiveChatData}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Conversations"
              value={String(stats.active)}
              subtitle="Open conversations"
              icon={<MessageCircle size={26} />}
              tone="blue"
            />

            <StatCard
              title="Pending"
              value={String(stats.pending)}
              subtitle="Awaiting response"
              icon={<Clock3 size={26} />}
              tone="orange"
            />

            <StatCard
              title="Closed"
              value={String(stats.closed)}
              subtitle="Resolved conversations"
              icon={<CheckCircle2 size={26} />}
              tone="green"
            />

            <StatCard
              title="Unread Messages"
              value={String(stats.unread)}
              subtitle="Requires attention"
              icon={<Mail size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid min-h-[720px] gap-5 xl:grid-cols-[360px_1fr_320px]">
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h3 className="text-lg font-black text-slate-950">
                  Conversations
                </h3>

                <div className="mt-4 grid gap-3">
                  <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={17} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search conversations..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {statusFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-[590px] overflow-y-auto p-3">
                {filteredConversations.map((conversation) => {
                  const profile = profileMap.get(conversation.user_id);
                  const unreadCount = unreadByConversation.get(conversation.id) || 0;
                  const isSelected = selectedConversation?.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      className={`mb-2 w-full rounded-3xl p-4 text-left transition ${
                        isSelected
                          ? "bg-blue-50 ring-1 ring-blue-100"
                          : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex gap-3">
                        <UserAvatar profile={profile} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate font-black text-slate-950">
                              {getFullName(profile)}
                            </p>

                            <p className="shrink-0 text-xs font-semibold text-slate-400">
                              {timeAgo(getLastTime(conversation))}
                            </p>
                          </div>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                            {conversation.last_message || conversation.subject || "No messages yet"}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status={conversation.status} />

                            {unreadCount > 0 && (
                              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-black text-white">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {filteredConversations.length <= 0 && (
                  <div className="rounded-3xl bg-slate-50 p-8 text-center">
                    <MessageCircle size={28} className="mx-auto text-slate-400" />
                    <p className="mt-3 text-sm font-black text-slate-700">
                      No conversations found
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Try clearing search or filters.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              {selectedConversation ? (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <UserAvatar profile={selectedProfile} />

                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black text-slate-950">
                          {getFullName(selectedProfile)}
                        </h3>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                          {getEmail(selectedProfile)} · {getConversationCode(selectedConversation)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedConversation.status} />
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
                      >
                        <MoreVertical size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="h-[500px] overflow-y-auto bg-slate-50/60 p-6">
                    <div className="mb-6 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200" />
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Conversation
                      </p>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>

                    <div className="space-y-4">
                      {selectedMessages.map((item) => {
                        const isAdmin =
                          String(item.sender_role || "").toLowerCase() !== "user";

                        return (
                          <div
                            key={item.id}
                            className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-3xl px-5 py-4 shadow-sm ${
                                isAdmin
                                  ? "bg-blue-600 text-white"
                                  : "border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-sm font-semibold leading-6">
                                {item.message}
                              </p>

                              <p
                                className={`mt-2 text-xs font-semibold ${
                                  isAdmin ? "text-blue-100" : "text-slate-400"
                                }`}
                              >
                                {formatTime(item.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {selectedMessages.length <= 0 && (
                        <div className="rounded-3xl bg-white p-8 text-center text-sm font-semibold text-slate-500">
                          No messages yet.
                        </div>
                      )}

                      <div ref={bottomRef} />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 p-5">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <textarea
                        value={replyMessage}
                        onChange={(event) => setReplyMessage(event.target.value)}
                        placeholder="Type your message..."
                        rows={4}
                        className="w-full resize-none bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                      />

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-400">
                          Press send to reply as Admin Support.
                        </p>

                        <button
                          type="button"
                          onClick={sendAdminReply}
                          disabled={sendingReply || !replyMessage.trim()}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sendingReply ? (
                            <RefreshCw size={17} className="animate-spin" />
                          ) : (
                            <Send size={17} />
                          )}
                          {sendingReply ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-[720px] items-center justify-center p-8">
                  <div className="text-center">
                    <MessageCircle size={42} className="mx-auto text-slate-400" />
                    <h3 className="mt-4 text-xl font-black text-slate-950">
                      Select a conversation
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      Choose a chat from the list to start replying.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Customer Information
                </h3>

                {selectedConversation ? (
                  <div className="mt-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <UserAvatar profile={selectedProfile} />

                      <div className="min-w-0">
                        <p className="truncate font-black text-slate-950">
                          {getFullName(selectedProfile)}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-500">
                          {getEmail(selectedProfile)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Username
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          @{getDisplayName(selectedProfile)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Wallet Balance
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {formatAmount(selectedProfile?.balance)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Member Since
                        </p>
                        <p className="mt-1 text-sm font-black text-slate-900">
                          {formatDate(selectedProfile?.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    No conversation selected.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Conversation Details
                </h3>

                {selectedConversation ? (
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Conversation ID
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {getConversationCode(selectedConversation)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Started
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {formatDateTime(selectedConversation.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                        Last Activity
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {formatDateTime(getLastTime(selectedConversation))}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Select a conversation first.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Quick Actions
                </h3>

                {selectedConversation ? (
                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateConversationStatus(selectedConversation, "open")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-600 transition hover:bg-emerald-50"
                    >
                      <MessageCircle size={17} />
                      Mark as Open
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateConversationStatus(selectedConversation, "pending")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-black text-orange-600 transition hover:bg-orange-50"
                    >
                      <Clock3 size={17} />
                      Mark as Pending
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateConversationStatus(selectedConversation, "closed")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                    >
                      <CheckCircle2 size={17} />
                      Mark as Closed
                    </button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Select a conversation to manage.
                  </p>
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Chat Health
                  </h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow
                    label="Open"
                    value={String(stats.active)}
                    dotClass="bg-blue-500"
                  />
                  <SummaryRow
                    label="Pending"
                    value={String(stats.pending)}
                    dotClass="bg-orange-500"
                  />
                  <SummaryRow
                    label="Closed"
                    value={String(stats.closed)}
                    dotClass="bg-emerald-500"
                  />
                  <SummaryRow
                    label="Unread"
                    value={String(stats.unread)}
                    dotClass="bg-purple-500"
                  />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

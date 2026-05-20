"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Database,
  Download,
  Eye,
  FileJson,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type ActivityLog = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type ActionFilter =
  | "all"
  | "deposit"
  | "ticket"
  | "live_chat"
  | "settings"
  | "user"
  | "service"
  | "wallet"
  | "affiliate"
  | "child_panel"
  | "order"
  | "other";

type RoleFilter = "all" | "admin" | "head_admin" | "super_admin" | "unknown";

const actionFilters: { label: string; value: ActionFilter }[] = [
  { label: "All Actions", value: "all" },
  { label: "Deposits", value: "deposit" },
  { label: "Tickets", value: "ticket" },
  { label: "Live Chat", value: "live_chat" },
  { label: "Settings", value: "settings" },
  { label: "Users", value: "user" },
  { label: "Services", value: "service" },
  { label: "Wallet", value: "wallet" },
  { label: "Affiliates", value: "affiliate" },
  { label: "Child Panel", value: "child_panel" },
  { label: "Orders", value: "order" },
  { label: "Other", value: "other" },
];

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: "All Roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Head Admin", value: "head_admin" },
  { label: "Super Admin", value: "super_admin" },
  { label: "Unknown", value: "unknown" },
];

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
  return `${formatDate(value)} · ${formatTime(value)}`;
}

function formatRole(role?: string | null) {
  if (!role) return "Unknown";

  if (role === "super_admin") return "Super Admin";
  if (role === "head_admin") return "Head Admin";
  if (role === "admin") return "Admin";

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAction(action?: string | null) {
  if (!action) return "Unknown Action";

  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActionCategory(
  action?: string | null,
  targetType?: string | null,
): ActionFilter {
  const text = `${action || ""} ${targetType || ""}`.toLowerCase();

  if (
    text.includes("deposit") ||
    text.includes("payment") ||
    text.includes("add_fund")
  ) {
    return "deposit";
  }

  if (text.includes("ticket")) return "ticket";
  if (text.includes("live_chat") || text.includes("chat")) return "live_chat";
  if (text.includes("setting")) return "settings";
  if (
    text.includes("user") ||
    text.includes("profile") ||
    text.includes("role")
  ) {
    return "user";
  }

  if (text.includes("service")) return "service";

  if (
    text.includes("wallet") ||
    text.includes("balance") ||
    text.includes("adjustment")
  ) {
    return "wallet";
  }

  if (text.includes("affiliate")) return "affiliate";
  if (text.includes("child_panel")) return "child_panel";
  if (text.includes("order")) return "order";

  return "other";
}

function getActionTone(category: ActionFilter) {
  if (category === "deposit") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (category === "ticket") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (category === "live_chat") return "bg-cyan-50 text-cyan-700 ring-cyan-100";
  if (category === "settings") {
    return "bg-purple-50 text-purple-700 ring-purple-100";
  }

  if (category === "user") return "bg-indigo-50 text-indigo-700 ring-indigo-100";
  if (category === "wallet") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (category === "affiliate") return "bg-pink-50 text-pink-700 ring-pink-100";
  if (category === "child_panel") {
    return "bg-violet-50 text-violet-700 ring-violet-100";
  }

  if (category === "order") return "bg-lime-50 text-lime-700 ring-lime-100";
  if (category === "service") return "bg-teal-50 text-teal-700 ring-teal-100";

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function getRoleBadgeClass(role?: string | null) {
  if (role === "super_admin") {
    return "bg-purple-50 text-purple-700 ring-purple-100";
  }

  if (role === "head_admin") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (role === "admin") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value || {}, null, 2);
  } catch {
    return "{}";
  }
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  tone: "green" | "blue" | "orange" | "purple";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>

          <h3 className="mt-1 min-w-0 truncate text-3xl font-black tracking-tight text-slate-950">
            {value}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">
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
    <div className="flex min-w-0 items-center gap-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} />

      <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-700">
        {label}
      </p>

      <p className="shrink-0 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="truncate text-xs font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadLogs() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      setMessage(error.message);
      setLogs([]);
      setLoading(false);
      return;
    }

    setLogs((data || []) as ActivityLog[]);
    setLoading(false);
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.toLowerCase().trim();

    return logs.filter((log) => {
      const category = getActionCategory(log.action, log.target_type);

      const matchesSearch =
        !query ||
        String(log.actor_email || "").toLowerCase().includes(query) ||
        String(log.actor_role || "").toLowerCase().includes(query) ||
        String(log.action || "").toLowerCase().includes(query) ||
        String(log.target_type || "").toLowerCase().includes(query) ||
        String(log.target_id || "").toLowerCase().includes(query) ||
        String(log.description || "").toLowerCase().includes(query) ||
        safeJson(log.metadata).toLowerCase().includes(query);

      const matchesAction =
        actionFilter === "all" ? true : category === actionFilter;

      const role = (log.actor_role || "unknown") as RoleFilter;
      const matchesRole = roleFilter === "all" ? true : role === roleFilter;

      let matchesDate = true;

      if (dateFilter !== "all") {
        const createdAt = new Date(log.created_at);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffDays = diffMs / 1000 / 60 / 60 / 24;

        if (dateFilter === "today") {
          matchesDate =
            createdAt.getFullYear() === now.getFullYear() &&
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getDate() === now.getDate();
        }

        if (dateFilter === "7days") matchesDate = diffDays <= 7;
        if (dateFilter === "30days") matchesDate = diffDays <= 30;
      }

      return matchesSearch && matchesAction && matchesRole && matchesDate;
    });
  }, [actionFilter, dateFilter, logs, roleFilter, search]);

  const stats = useMemo(() => {
    const today = new Date();

    const todayLogs = logs.filter((log) => {
      const createdAt = new Date(log.created_at);

      return (
        createdAt.getFullYear() === today.getFullYear() &&
        createdAt.getMonth() === today.getMonth() &&
        createdAt.getDate() === today.getDate()
      );
    });

    const uniqueAdmins = new Set(
      logs.map((log) => log.actor_id || log.actor_email).filter(Boolean),
    ).size;

    const settingsLogs = logs.filter(
      (log) => getActionCategory(log.action, log.target_type) === "settings",
    ).length;

    return {
      total: logs.length,
      today: todayLogs.length,
      uniqueAdmins,
      settingsLogs,
    };
  }, [logs]);

  const categoryCounts = useMemo(() => {
    const counts: Record<ActionFilter, number> = {
      all: logs.length,
      deposit: 0,
      ticket: 0,
      live_chat: 0,
      settings: 0,
      user: 0,
      service: 0,
      wallet: 0,
      affiliate: 0,
      child_panel: 0,
      order: 0,
      other: 0,
    };

    for (const log of logs) {
      const category = getActionCategory(log.action, log.target_type);
      counts[category] += 1;
    }

    return counts;
  }, [logs]);

  function exportLogsToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredLogs
      .map((log) => {
        const category = getActionCategory(log.action, log.target_type);

        return `
          <tr>
            <td>${escapeHtml(formatDateTime(log.created_at))}</td>
            <td>${escapeHtml(log.actor_email || "Unknown")}</td>
            <td>${escapeHtml(formatRole(log.actor_role))}</td>
            <td>${escapeHtml(formatAction(log.action))}</td>
            <td>${escapeHtml(category)}</td>
            <td>${escapeHtml(log.target_type || "—")}</td>
            <td>${escapeHtml(log.description || "—")}</td>
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
          <title>Activity Logs Report</title>
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
              <h1>Activity Logs Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Logs: ${logs.length}</div>
              <div>Filtered Logs: ${filteredLogs.length}</div>
              <div>Today: ${stats.today}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Logs</span><strong>${stats.total}</strong></div>
            <div class="card"><span>Today</span><strong>${stats.today}</strong></div>
            <div class="card"><span>Admins</span><strong>${stats.uniqueAdmins}</strong></div>
            <div class="card"><span>Settings Logs</span><strong>${stats.settingsLogs}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Category</th>
                <th>Target</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="7" style="text-align:center; padding:32px;">No logs found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Admin Activity Logs</span>
            <span>This report was generated from the Activity Logs page.</span>
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
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Activity Logs
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Monitor admin actions, system changes, user updates, payments,
                support actions, and security events.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
              <button
                type="button"
                onClick={loadLogs}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportLogsToPDF}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Download size={17} />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {message}
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Logs"
              value={String(stats.total)}
              subtitle="Recorded activities"
              icon={<Database size={26} />}
              tone="green"
            />

            <StatCard
              title="Today"
              value={String(stats.today)}
              subtitle="Actions recorded today"
              icon={<CalendarDays size={26} />}
              tone="blue"
            />

            <StatCard
              title="Active Admins"
              value={String(stats.uniqueAdmins)}
              subtitle="Unique actors in logs"
              icon={<User size={26} />}
              tone="orange"
            />

            <StatCard
              title="Settings Changes"
              value={String(stats.settingsLogs)}
              subtitle="Configuration actions"
              icon={<ShieldCheck size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1fr_190px_190px_170px_auto]">
                  <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="shrink-0 text-slate-400" />

                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search actor, action, target, description..."
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={actionFilter}
                    onChange={(event) =>
                      setActionFilter(event.target.value as ActionFilter)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {actionFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={roleFilter}
                    onChange={(event) =>
                      setRoleFilter(event.target.value as RoleFilter)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {roleFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setActionFilter("all");
                      setRoleFilter("all");
                      setDateFilter("all");
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:w-auto"
                  >
                    <Filter size={17} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Date & Time</th>
                        <th className="px-5 py-4 text-left">Actor</th>
                        <th className="px-5 py-4 text-left">Role</th>
                        <th className="px-5 py-4 text-left">Action</th>
                        <th className="px-5 py-4 text-left">Target</th>
                        <th className="px-5 py-4 text-left">Description</th>
                        <th className="px-5 py-4 text-left">View</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLogs.map((log) => {
                        const category = getActionCategory(
                          log.action,
                          log.target_type,
                        );

                        return (
                          <tr
                            key={log.id}
                            className="border-t border-slate-100 transition hover:bg-slate-50/70"
                          >
                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-900">
                                {formatDate(log.created_at)}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {formatTime(log.created_at)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                  <User size={18} />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[210px] truncate font-black text-slate-950">
                                    {log.actor_email || "Unknown Actor"}
                                  </p>

                                  <p className="mt-1 max-w-[210px] truncate text-xs font-semibold text-slate-500">
                                    {log.actor_id || "No actor ID"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getRoleBadgeClass(
                                  log.actor_role,
                                )}`}
                              >
                                {formatRole(log.actor_role)}
                              </span>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getActionTone(
                                  category,
                                )}`}
                              >
                                {formatAction(log.action)}
                              </span>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-800">
                                {log.target_type || "—"}
                              </p>

                              <p className="mt-1 max-w-[170px] truncate text-xs font-semibold text-slate-500">
                                {log.target_id || "No target ID"}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="max-w-[320px] truncate font-semibold text-slate-600">
                                {log.description || "No description"}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedLog(log)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredLogs.length <= 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                {loading ? (
                                  <RefreshCw
                                    size={26}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Activity size={26} />
                                )}
                              </div>

                              <h3 className="mt-4 text-lg font-black text-slate-950">
                                {loading ? "Loading logs..." : "No logs found"}
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                {loading
                                  ? "Please wait while logs are loaded."
                                  : "Try clearing your search or filters."}
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
                    Showing{" "}
                    <span className="font-black text-slate-800">
                      {filteredLogs.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-black text-slate-800">
                      {logs.length}
                    </span>{" "}
                    logs
                  </p>

                  <p>{loading ? "Loading activity logs..." : "Activity logs loaded"}</p>
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" />

                  <h3 className="text-lg font-black text-slate-950">
                    Action Summary
                  </h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow
                    label="Deposits"
                    value={String(categoryCounts.deposit)}
                    dotClass="bg-emerald-500"
                  />
                  <SummaryRow
                    label="Tickets"
                    value={String(categoryCounts.ticket)}
                    dotClass="bg-blue-500"
                  />
                  <SummaryRow
                    label="Live Chat"
                    value={String(categoryCounts.live_chat)}
                    dotClass="bg-cyan-500"
                  />
                  <SummaryRow
                    label="Settings"
                    value={String(categoryCounts.settings)}
                    dotClass="bg-purple-500"
                  />
                  <SummaryRow
                    label="Users"
                    value={String(categoryCounts.user)}
                    dotClass="bg-indigo-500"
                  />
                  <SummaryRow
                    label="Other"
                    value={String(categoryCounts.other)}
                    dotClass="bg-slate-500"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />

                  <h3 className="text-lg font-black text-slate-950">
                    Logging Status
                  </h3>
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-500">
                  This page is ready. Logs will appear after we connect each
                  admin action to the activity_logs table.
                </p>

                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                  Next step: connect log insertion to Settings, Payments,
                  Tickets, Live Chat, and Users.
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <FileJson size={18} className="text-emerald-600" />

                  <h3 className="text-lg font-black text-slate-950">
                    Metadata Support
                  </h3>
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-500">
                  Each log can store JSON metadata, target IDs, IP address, user
                  agent, and actor information for audit tracking.
                </p>
              </div>
            </aside>
          </div>
        </div>

        {selectedLog && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
                    Log Details
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Full activity record and metadata.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto p-5 sm:p-6">
                <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
                  <DetailBox
                    label="Date & Time"
                    value={formatDateTime(selectedLog.created_at)}
                  />
                  <DetailBox
                    label="Actor Email"
                    value={selectedLog.actor_email || "Unknown"}
                  />
                  <DetailBox
                    label="Actor Role"
                    value={formatRole(selectedLog.actor_role)}
                  />
                  <DetailBox label="Actor ID" value={selectedLog.actor_id || "—"} />
                  <DetailBox
                    label="Action"
                    value={formatAction(selectedLog.action)}
                  />
                  <DetailBox
                    label="Target Type"
                    value={selectedLog.target_type || "—"}
                  />
                  <DetailBox
                    label="Target ID"
                    value={selectedLog.target_id || "—"}
                  />
                  <DetailBox
                    label="IP Address"
                    value={selectedLog.ip_address || "—"}
                  />

                  <div className="md:col-span-2">
                    <DetailBox
                      label="Description"
                      value={selectedLog.description || "No description"}
                    />
                  </div>

                  <div className="min-w-0 md:col-span-2">
                    <p className="mb-2 text-sm font-black text-slate-700">
                      Metadata
                    </p>

                    <pre className="max-h-[340px] max-w-full overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs font-semibold leading-6 text-slate-100">
                      {safeJson(selectedLog.metadata)}
                    </pre>
                  </div>

                  <div className="md:col-span-2">
                    <DetailBox
                      label="User Agent"
                      value={selectedLog.user_agent || "—"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Crown,
  Download,
  Edit3,
  Eye,
  Filter,
  Gift,
  Laptop,
  Loader2,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Unlock,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type ResellerProfile = {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  role: string | null;
  balance: number | null;
  created_at: string;
  avatar_url?: string | null;

  reseller_points?: number | null;
  reseller_level?: number | null;
  reseller_total_spend?: number | null;
  child_panel_access?: boolean | null;
  child_panel_access_type?: string | null;
  child_panel_subscription_status?: string | null;
  child_panel_subscription_expires_at?: string | null;
};

type LevelFilter = "all" | "1" | "2" | "3" | "4" | "5" | "6";
type ChildPanelFilter = "all" | "locked" | "paid" | "free" | "manual";
type ModalMode = "view" | "manage" | null;

const resellerLevels = [
  {
    level: 1,
    name: "New Reseller",
    badge: "New",
    discount: 0,
    conversion: "$1 = 100 pts",
    pointValue: 1,
    childPanel: "Paid subscription only",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
  {
    level: 2,
    name: "Active Reseller",
    badge: "Active",
    discount: 1,
    conversion: "$1 = 100 pts",
    pointValue: 1,
    childPanel: "Paid subscription only",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    level: 3,
    name: "Pro Reseller",
    badge: "Pro",
    discount: 2,
    conversion: "$1.25 = 100 pts",
    pointValue: 1.25,
    childPanel: "Free Lifetime",
    className: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  {
    level: 4,
    name: "Elite Reseller",
    badge: "Elite",
    discount: 3,
    conversion: "$1.50 = 100 pts",
    pointValue: 1.5,
    childPanel: "Free Lifetime",
    className: "bg-purple-50 text-purple-700 ring-purple-100",
  },
  {
    level: 5,
    name: "Master Reseller",
    badge: "Master",
    discount: 4,
    conversion: "$1.75 = 100 pts",
    pointValue: 1.75,
    childPanel: "Free Lifetime",
    className: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    level: 6,
    name: "Ascend VIP / Ascend Partner",
    badge: "Partner",
    discount: 5,
    conversion: "$2 = 100 pts",
    pointValue: 2,
    childPanel: "Free Lifetime",
    className: "bg-rose-50 text-rose-700 ring-rose-100",
  },
];

const levelOptions: { label: string; value: LevelFilter }[] = [
  { label: "All Levels", value: "all" },
  { label: "Level 1", value: "1" },
  { label: "Level 2", value: "2" },
  { label: "Level 3", value: "3" },
  { label: "Level 4", value: "4" },
  { label: "Level 5", value: "5" },
  { label: "Level 6", value: "6" },
];

const childPanelOptions: { label: string; value: ChildPanelFilter }[] = [
  { label: "All Child Panel Access", value: "all" },
  { label: "Locked", value: "locked" },
  { label: "Paid Active", value: "paid" },
  { label: "Free Lifetime", value: "free" },
  { label: "Manual Unlock", value: "manual" },
];

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number | string | null | undefined) {
  return Number(value || 0).toLocaleString("en-PH");
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

function getDisplayName(user: ResellerProfile) {
  const username = String(user.username || "").trim();
  if (username) return username;

  const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
  return fullName || "Unnamed User";
}

function getFullName(user: ResellerProfile) {
  const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
  return fullName || getDisplayName(user);
}

function getInitial(user: ResellerProfile) {
  return getDisplayName(user).charAt(0).toUpperCase();
}

function getLevelNumber(user: ResellerProfile) {
  const level = Number(user.reseller_level || 1);
  if (level < 1) return 1;
  if (level > 6) return 6;
  return level;
}

function getLevelInfo(level: number) {
  return resellerLevels.find((item) => item.level === level) || resellerLevels[0];
}

function getChildPanelAccessType(user: ResellerProfile) {
  const level = getLevelNumber(user);
  const savedType = String(user.child_panel_access_type || "locked").toLowerCase().trim();
  const subscriptionStatus = String(user.child_panel_subscription_status || "inactive").toLowerCase().trim();

  if (level >= 3) return "free";
  if (savedType === "manual") return "manual";
  if (Boolean(user.child_panel_access) && savedType === "manual") return "manual";
  if (subscriptionStatus === "active" || savedType === "paid") return "paid";

  return "locked";
}

function getChildPanelLabel(user: ResellerProfile) {
  const type = getChildPanelAccessType(user);

  if (type === "free") return "Free Lifetime";
  if (type === "paid") return "Paid Active";
  if (type === "manual") return "Manual Unlock";

  return "Locked";
}

function getChildPanelBadgeClass(user: ResellerProfile) {
  const type = getChildPanelAccessType(user);

  if (type === "free") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (type === "paid") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (type === "manual") return "bg-purple-50 text-purple-700 ring-purple-100";

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function hasChildPanelAccess(user: ResellerProfile) {
  return getChildPanelAccessType(user) !== "locked";
}

function UserAvatar({ user }: { user: ResellerProfile }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 font-black text-emerald-700 ring-1 ring-emerald-100">
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={getDisplayName(user)} className="h-full w-full object-cover" />
      ) : (
        getInitial(user)
      )}
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  const info = getLevelInfo(level);

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${info.className}`}>
      Level {level} · {info.badge}
    </span>
  );
}

function ChildPanelBadge({ user }: { user: ResellerProfile }) {
  const type = getChildPanelAccessType(user);
  const Icon = type === "locked" ? Lock : type === "free" ? Gift : Unlock;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${getChildPanelBadgeClass(user)}`}>
      <Icon size={13} />
      {getChildPanelLabel(user)}
    </span>
  );
}

function SubscriptionBadge({ user }: { user: ResellerProfile }) {
  const status = String(user.child_panel_subscription_status || "inactive").toLowerCase().trim();
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
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
  tone: "green" | "blue" | "purple" | "orange";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
  }[tone];

  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex min-w-0 items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 min-w-0 truncate text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <div className={`mt-2 text-sm font-black ${valueClassName}`}>{value}</div>
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

export default function AdminResellerManagementPage() {
  const [resellers, setResellers] = useState<ResellerProfile[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [childPanelFilter, setChildPanelFilter] = useState<ChildPanelFilter>("all");
  const [selectedReseller, setSelectedReseller] = useState<ResellerProfile | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editLevel, setEditLevel] = useState("1");
  const [editPoints, setEditPoints] = useState("0");
  const [editTotalSpend, setEditTotalSpend] = useState("0");
  const [editChildPanelType, setEditChildPanelType] = useState("locked");
  const [editSubscriptionStatus, setEditSubscriptionStatus] = useState("inactive");
  const [editSubscriptionExpiresAt, setEditSubscriptionExpiresAt] = useState("");

  async function loadResellers() {
    setLoading(true);

    let allProfiles: ResellerProfile[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, firstname, lastname, email, role, balance, created_at, avatar_url, reseller_points, reseller_level, reseller_total_spend, child_panel_access, child_panel_access_type, child_panel_subscription_status, child_panel_subscription_expires_at",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const batch = (data || []) as ResellerProfile[];
      allProfiles = [...allProfiles, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    setResellers(allProfiles);
    setLoading(false);
  }

  useEffect(() => {
    loadResellers();
  }, []);

  const filteredResellers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return resellers.filter((user) => {
      const level = String(getLevelNumber(user));
      const childPanelType = getChildPanelAccessType(user);

      const matchesSearch =
        !query ||
        String(user.username || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.firstname || "").toLowerCase().includes(query) ||
        String(user.lastname || "").toLowerCase().includes(query) ||
        String(user.id || "").toLowerCase().includes(query);

      const matchesLevel = levelFilter === "all" ? true : level === levelFilter;
      const matchesChildPanel =
        childPanelFilter === "all" ? true : childPanelType === childPanelFilter;

      return matchesSearch && matchesLevel && matchesChildPanel;
    });
  }, [childPanelFilter, levelFilter, resellers, search]);

  const stats = useMemo(() => {
    const proPlus = resellers.filter((user) => getLevelNumber(user) >= 3).length;
    const paidChildPanels = resellers.filter((user) => getChildPanelAccessType(user) === "paid").length;
    const totalPoints = resellers.reduce((sum, user) => sum + Number(user.reseller_points || 0), 0);
    const freeLifetime = resellers.filter((user) => getChildPanelAccessType(user) === "free").length;
    const locked = resellers.filter((user) => getChildPanelAccessType(user) === "locked").length;

    return {
      total: resellers.length,
      proPlus,
      paidChildPanels,
      totalPoints,
      freeLifetime,
      locked,
    };
  }, [resellers]);

  function openViewModal(user: ResellerProfile) {
    setSelectedReseller(user);
    setModalMode("view");
  }

  function openManageModal(user: ResellerProfile) {
    const type = getChildPanelAccessType(user);
    const level = getLevelNumber(user);

    setSelectedReseller(user);
    setEditLevel(String(level));
    setEditPoints(String(user.reseller_points || 0));
    setEditTotalSpend(String(user.reseller_total_spend || 0));
    setEditChildPanelType(level >= 3 ? "free" : type);
    setEditSubscriptionStatus(String(user.child_panel_subscription_status || "inactive"));
    setEditSubscriptionExpiresAt(
      user.child_panel_subscription_expires_at
        ? new Date(user.child_panel_subscription_expires_at).toISOString().slice(0, 16)
        : "",
    );
    setModalMode("manage");
  }

  function closeModal() {
    setSelectedReseller(null);
    setModalMode(null);
  }

  async function saveResellerSettings() {
    if (!selectedReseller || saving) return;

    const level = Number(editLevel || 1);
    const childType = level >= 3 ? "level_perk" : editChildPanelType;
    const childAccess =
      level >= 3 || childType === "paid" || childType === "manual" || editSubscriptionStatus === "active";

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        reseller_level: level,
        reseller_points: Number(editPoints || 0),
        reseller_total_spend: Number(editTotalSpend || 0),
        child_panel_access: childAccess,
        child_panel_access_type: level >= 3 ? "level_perk" : childType,
        child_panel_subscription_status:
          level >= 3 ? "inactive" : editSubscriptionStatus,
        child_panel_subscription_expires_at:
          level >= 3 || !editSubscriptionExpiresAt
            ? null
            : new Date(editSubscriptionExpiresAt).toISOString(),
      })
      .eq("id", selectedReseller.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage(`${getDisplayName(selectedReseller)} reseller settings updated.`);
    setSaving(false);
    closeModal();
    loadResellers();
  }

  function exportResellersToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredResellers
      .map((user) => {
        const level = getLevelNumber(user);
        const info = getLevelInfo(level);

        return `
          <tr>
            <td>${escapeHtml(getDisplayName(user))}</td>
            <td>${escapeHtml(user.email || "—")}</td>
            <td>Level ${level} - ${escapeHtml(info.name)}</td>
            <td>${formatMoney(user.reseller_total_spend)}</td>
            <td>${formatNumber(user.reseller_points)}</td>
            <td>${info.discount}%</td>
            <td>${escapeHtml(getChildPanelLabel(user))}</td>
            <td>${escapeHtml(String(user.child_panel_subscription_status || "inactive"))}</td>
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
          <title>Reseller Management Report</title>
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
            table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: 0.08em; font-weight: 900; padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #334155; vertical-align: top; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Reseller Management Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Resellers: ${resellers.length}</div>
              <div>Filtered Resellers: ${filteredResellers.length}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Resellers</span><strong>${formatNumber(stats.total)}</strong></div>
            <div class="card"><span>Pro+ Resellers</span><strong>${formatNumber(stats.proPlus)}</strong></div>
            <div class="card"><span>Paid Child Panels</span><strong>${formatNumber(stats.paidChildPanels)}</strong></div>
            <div class="card"><span>Total Points Issued</span><strong>${formatNumber(stats.totalPoints)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Level</th>
                <th>Total Spend</th>
                <th>Points</th>
                <th>Discount</th>
                <th>Child Panel</th>
                <th>Subscription</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="8" style="text-align:center; padding:32px;">No resellers found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Reseller Management Report</span>
            <span>This report was generated from the Admin Reseller Management page.</span>
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
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Reseller Management
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage reseller levels, points, discounts, and child panel access.
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
              <button
                type="button"
                onClick={loadResellers}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportResellersToPDF}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
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

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Resellers"
              value={formatNumber(stats.total)}
              subtitle="All registered users"
              icon={<Users size={26} />}
              tone="green"
            />

            <StatCard
              title="Pro+ Resellers"
              value={formatNumber(stats.proPlus)}
              subtitle="Level 3 and above"
              icon={<ShieldCheck size={26} />}
              tone="green"
            />

            <StatCard
              title="Paid Child Panels"
              value={formatNumber(stats.paidChildPanels)}
              subtitle="Active paid child panels"
              icon={<Laptop size={26} />}
              tone="blue"
            />

            <StatCard
              title="Total Points Issued"
              value={formatNumber(stats.totalPoints)}
              subtitle="Across all resellers"
              icon={<WalletCards size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_230px_260px_auto]">
                  <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="shrink-0 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, username, email..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={levelFilter}
                    onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {levelOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={childPanelFilter}
                    onChange={(event) => setChildPanelFilter(event.target.value as ChildPanelFilter)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {childPanelOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setLevelFilter("all");
                      setChildPanelFilter("all");
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:w-auto"
                  >
                    <Filter size={17} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-950">Reseller Directory</h3>
                  </div>

                  <p className="text-sm font-semibold text-slate-500">
                    Showing {filteredResellers.length} of {resellers.length} resellers
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">User</th>
                        <th className="px-5 py-4 text-left">Reseller Level</th>
                        <th className="px-5 py-4 text-left">Total Spend</th>
                        <th className="px-5 py-4 text-left">Available Points</th>
                        <th className="px-5 py-4 text-left">Discount</th>
                        <th className="px-5 py-4 text-left">Child Panel Access</th>
                        <th className="px-5 py-4 text-left">Subscription</th>
                        <th className="px-5 py-4 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredResellers.map((user) => {
                        const level = getLevelNumber(user);
                        const levelInfo = getLevelInfo(level);

                        return (
                          <tr key={user.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-3">
                                <UserAvatar user={user} />

                                <div className="min-w-0">
                                  <p className="max-w-[190px] truncate font-black text-slate-950">
                                    {getFullName(user)}
                                  </p>
                                  <p className="mt-1 max-w-[190px] truncate text-xs font-black text-emerald-600">
                                    @{getDisplayName(user)}
                                  </p>
                                  <p className="mt-1 max-w-[190px] truncate text-xs font-semibold text-slate-500">
                                    {user.email || "No email"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <LevelBadge level={level} />
                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                {levelInfo.name}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top font-black text-slate-800">
                              {formatMoney(user.reseller_total_spend)}
                            </td>

                            <td className="px-5 py-5 align-top font-black text-emerald-600">
                              {formatNumber(user.reseller_points)}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-800">{levelInfo.discount}%</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {levelInfo.conversion}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <ChildPanelBadge user={user} />
                            </td>

                            <td className="px-5 py-5 align-top">
                              <SubscriptionBadge user={user} />
                              {user.child_panel_subscription_expires_at && (
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Until {formatDate(user.child_panel_subscription_expires_at)}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openViewModal(user)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                  title="View reseller"
                                >
                                  <Eye size={16} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openManageModal(user)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50"
                                  title="Manage reseller"
                                >
                                  <MoreHorizontal size={17} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredResellers.length <= 0 && (
                        <tr>
                          <td colSpan={8} className="px-5 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                <Users size={26} />
                              </div>

                              <h3 className="mt-4 text-lg font-black text-slate-950">
                                No resellers found
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
                    Showing <span className="font-black text-slate-800">{filteredResellers.length}</span>{" "}
                    of <span className="font-black text-slate-800">{resellers.length}</span> resellers
                  </p>

                  <p>{loading ? "Loading reseller data..." : "Reseller data loaded"}</p>
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Level Rules</h3>
                </div>

                <div className="space-y-3">
                  {resellerLevels.map((level) => (
                    <div key={level.level} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${level.className}`}>
                          Level {level.level}
                        </span>
                        <span className="text-xs font-black text-slate-700">
                          {level.discount}% Discount
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-black text-slate-800">{level.name}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Point Conversion: {level.conversion}
                      </p>
                    </div>
                  ))}

                  <p className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
                    Note: Benefits upgrade automatically with higher levels.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Laptop size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Child Panel Rules</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
                    <Lock size={20} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="font-black text-slate-900">Level 1 and Level 2</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                        Child panel is locked unless paid subscription is active.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <Gift size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-black text-slate-900">Level 3 and above</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">
                        Child panel access becomes free lifetime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-950">Quick Filters</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLevelFilter("3");
                      setChildPanelFilter("all");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Pro Resellers
                    <span>{formatNumber(resellers.filter((user) => getLevelNumber(user) === 3).length)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLevelFilter("all");
                      setChildPanelFilter("free");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Free Lifetime
                    <span>{formatNumber(stats.freeLifetime)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLevelFilter("all");
                      setChildPanelFilter("paid");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Paid Child Panels
                    <span>{formatNumber(stats.paidChildPanels)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLevelFilter("all");
                      setChildPanelFilter("locked");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Locked Child Panels
                    <span>{formatNumber(stats.locked)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setLevelFilter("all");
                      setChildPanelFilter("all");
                    }}
                    className="mt-2 flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Clear Quick Filters
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {modalMode === "view" && selectedReseller && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Reseller Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review reseller progress, points, and child panel access.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex min-w-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:flex-row sm:items-start">
                  <UserAvatar user={selectedReseller} />

                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-2 text-xl font-black text-slate-950">{getFullName(selectedReseller)}</h4>
                    <p className="mt-1 text-sm font-black text-emerald-600">@{getDisplayName(selectedReseller)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selectedReseller.email || "No email"}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <LevelBadge level={getLevelNumber(selectedReseller)} />
                      <ChildPanelBadge user={selectedReseller} />
                    </div>
                  </div>

                  <p className="shrink-0 text-left text-2xl font-black text-emerald-600 sm:text-right">
                    {formatNumber(selectedReseller.reseller_points)} pts
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <InfoBlock label="Reseller Level" value={getLevelInfo(getLevelNumber(selectedReseller)).name} />
                  <InfoBlock label="Discount" value={`${getLevelInfo(getLevelNumber(selectedReseller)).discount}%`} />
                  <InfoBlock label="Point Conversion" value={getLevelInfo(getLevelNumber(selectedReseller)).conversion} />
                  <InfoBlock label="Total Spend" value={formatMoney(selectedReseller.reseller_total_spend)} />
                  <InfoBlock label="Available Points" value={formatNumber(selectedReseller.reseller_points)} valueClassName="text-emerald-600" />
                  <InfoBlock label="Wallet Balance" value={formatMoney(selectedReseller.balance)} />
                  <InfoBlock label="Child Panel" value={<ChildPanelBadge user={selectedReseller} />} />
                  <InfoBlock label="Subscription" value={<SubscriptionBadge user={selectedReseller} />} />
                  <InfoBlock label="Registered" value={`${formatDate(selectedReseller.created_at)} · ${formatTime(selectedReseller.created_at)}`} />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedReseller;
                      closeModal();
                      openManageModal(current);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <Edit3 size={17} />
                    Manage Reseller
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalMode === "manage" && selectedReseller && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-4 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Manage Reseller</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Adjust reseller level, points, total spend, and child panel access.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-[1fr_360px]">
                <div className="space-y-5 p-6">
                  <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <UserAvatar user={selectedReseller} />
                    <div className="min-w-0">
                      <h4 className="line-clamp-2 text-xl font-black text-slate-950">{getFullName(selectedReseller)}</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{selectedReseller.email || "No email"}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Reseller Level
                      </label>

                      <select
                        value={editLevel}
                        onChange={(event) => {
                          setEditLevel(event.target.value);
                          if (Number(event.target.value) >= 3) {
                            setEditChildPanelType("free");
                            setEditSubscriptionStatus("inactive");
                          }
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                      >
                        {resellerLevels.map((level) => (
                          <option key={level.level} value={level.level}>
                            Level {level.level} — {level.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Available Points
                      </label>

                      <input
                        type="number"
                        value={editPoints}
                        onChange={(event) => setEditPoints(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Total Spend
                      </label>

                      <input
                        type="number"
                        value={editTotalSpend}
                        onChange={(event) => setEditTotalSpend(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">
                    Level {editLevel}: {getLevelInfo(Number(editLevel)).discount}% discount · {getLevelInfo(Number(editLevel)).conversion}
                    {Number(editLevel) >= 3 ? " · Child Panel Free Lifetime" : " · Child Panel requires paid subscription"}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Child Panel Access Type
                      </label>

                      <select
                        value={editChildPanelType}
                        onChange={(event) => setEditChildPanelType(event.target.value)}
                        disabled={Number(editLevel) >= 3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                      >
                        <option value="locked">Locked</option>
                        <option value="paid">Paid Active</option>
                        <option value="manual">Manual Unlock</option>
                        <option value="free">Free Lifetime</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Subscription Status
                      </label>

                      <select
                        value={editSubscriptionStatus}
                        onChange={(event) => setEditSubscriptionStatus(event.target.value)}
                        disabled={Number(editLevel) >= 3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                      >
                        <option value="inactive">Inactive</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Subscription Expires At
                    </label>

                    <input
                      type="datetime-local"
                      value={editSubscriptionExpiresAt}
                      onChange={(event) => setEditSubscriptionExpiresAt(event.target.value)}
                      disabled={Number(editLevel) >= 3}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/70 p-6 lg:border-l lg:border-t-0">
                  <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-black text-slate-700">Reseller Preview</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Current settings preview before saving.
                    </p>

                    <div className="mt-5 space-y-3">
                      <InfoBlock label="Level" value={`Level ${editLevel} — ${getLevelInfo(Number(editLevel)).name}`} />
                      <InfoBlock label="Discount" value={`${getLevelInfo(Number(editLevel)).discount}%`} />
                      <InfoBlock label="Point Conversion" value={getLevelInfo(Number(editLevel)).conversion} />
                      <InfoBlock label="Points" value={formatNumber(editPoints)} valueClassName="text-emerald-600" />
                      <InfoBlock label="Total Spend" value={formatMoney(editTotalSpend)} />
                      <InfoBlock
                        label="Child Panel"
                        value={Number(editLevel) >= 3 ? "Free Lifetime" : editChildPanelType}
                        valueClassName={Number(editLevel) >= 3 ? "text-blue-600" : "text-slate-950"}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end gap-3 border-t border-slate-200 p-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveResellerSettings}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                  {saving ? "Saving..." : "Save Reseller"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

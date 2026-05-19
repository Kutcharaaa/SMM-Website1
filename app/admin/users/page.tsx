"use client";

import AdminLayout from "@/components/AdminLayout";
import AdminGuard from "@/components/AdminGuard";
import { supabase } from "@/lib/supabase";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Filter,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type Profile = {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  role: string | null;
  plan: string | null;
  balance: number | null;
  created_at: string;
  status?: string | null;
  avatar_url?: string | null;
};

type OrderRow = {
  user_id: string | null;
};

type RoleFilter = "all" | "user" | "admin" | "head_admin" | "super_admin";
type StatusFilter = "all" | "active" | "inactive";
type ModalMode = "view" | "role" | null;

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: "All Roles", value: "all" },
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Head Admin", value: "head_admin" },
  { label: "Developer", value: "super_admin" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
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

function getDisplayName(user: Profile) {
  const username = String(user.username || "").trim();
  if (username) return username;

  const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
  return fullName || "Unnamed User";
}

function getFullName(user: Profile) {
  const fullName = `${user.firstname || ""} ${user.lastname || ""}`.trim();
  return fullName || getDisplayName(user);
}

function getInitial(user: Profile) {
  return getDisplayName(user).charAt(0).toUpperCase();
}

function getCleanRole(role?: string | null) {
  return String(role || "user").toLowerCase().trim();
}

function getCleanStatus(status?: string | null) {
  return String(status || "active").toLowerCase().trim();
}

function getRoleData(role?: string | null) {
  const cleanRole = getCleanRole(role);

  if (cleanRole === "super_admin") {
    return {
      label: "Developer",
      badge: "bg-purple-50 text-purple-700 ring-purple-100",
      dot: "bg-purple-500",
    };
  }

  if (cleanRole === "head_admin") {
    return {
      label: "Head Admin",
      badge: "bg-red-50 text-red-700 ring-red-100",
      dot: "bg-red-500",
    };
  }

  if (cleanRole === "admin") {
    return {
      label: "Admin",
      badge: "bg-blue-50 text-blue-700 ring-blue-100",
      dot: "bg-blue-500",
    };
  }

  return {
    label: "User",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    dot: "bg-emerald-500",
  };
}

function RoleBadge({ role }: { role?: string | null }) {
  const roleData = getRoleData(role);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${roleData.badge}`}>
      <span className={`h-2 w-2 rounded-full ${roleData.dot}`} />
      {roleData.label}
    </span>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const active = getCleanStatus(status) === "active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-red-500"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserAvatar({ user, size = "md" }: { user: Profile; size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "h-10 w-10 rounded-2xl text-sm",
    md: "h-12 w-12 rounded-2xl text-base",
    lg: "h-16 w-16 rounded-3xl text-xl",
  }[size];

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-emerald-50 font-black text-emerald-700 ring-1 ring-emerald-100 ${sizeClass}`}>
      {user.avatar_url ? (
        <img src={user.avatar_url} alt={getDisplayName(user)} className="h-full w-full object-cover" />
      ) : (
        getInitial(user)
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
  tone: "green" | "blue" | "orange" | "purple";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [message, setMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  async function loadUsers() {
    setLoadingUsers(true);

    let allUsers: Profile[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setMessage(error.message);
        setLoadingUsers(false);
        return;
      }

      const batch = (data || []) as Profile[];
      allUsers = [...allUsers, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    setUsers(allUsers);
    setLoadingUsers(false);

    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (currentProfile?.role) {
        setCurrentUserRole(currentProfile.role);
      }
    }
  }

  async function loadOrderCounts() {
    let allOrders: OrderRow[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from("orders")
        .select("user_id")
        .range(from, to);

      if (error) {
        return;
      }

      const batch = (data || []) as OrderRow[];
      allOrders = [...allOrders, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    const counts: Record<string, number> = {};

    allOrders.forEach((order) => {
      if (!order.user_id) return;
      counts[order.user_id] = (counts[order.user_id] || 0) + 1;
    });

    setOrderCounts(counts);
  }

  useEffect(() => {
    loadUsers();
    loadOrderCounts();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.toLowerCase().trim();

    return users.filter((user) => {
      const role = getCleanRole(user.role);
      const status = getCleanStatus(user.status);

      const matchesSearch =
        !query ||
        String(user.username || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.firstname || "").toLowerCase().includes(query) ||
        String(user.lastname || "").toLowerCase().includes(query) ||
        String(user.id || "").toLowerCase().includes(query);

      const matchesRole = roleFilter === "all" ? true : role === roleFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? status === "active"
            : status !== "active";

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const stats = useMemo(() => {
    const admins = users.filter((user) =>
      ["admin", "head_admin", "super_admin"].includes(getCleanRole(user.role)),
    ).length;

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const newThisMonth = users.filter((user) => {
      const created = new Date(user.created_at);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length;

    const totalBalance = users.reduce((sum, user) => sum + Number(user.balance || 0), 0);
    const activeUsers = users.filter((user) => getCleanStatus(user.status) === "active").length;
    const inactiveUsers = users.length - activeUsers;

    const roleCounts = {
      user: users.filter((user) => getCleanRole(user.role) === "user").length,
      admin: users.filter((user) => getCleanRole(user.role) === "admin").length,
      head_admin: users.filter((user) => getCleanRole(user.role) === "head_admin").length,
      super_admin: users.filter((user) => getCleanRole(user.role) === "super_admin").length,
    };

    const usersWithBalance = users.filter((user) => Number(user.balance || 0) > 0).length;

    return {
      admins,
      newThisMonth,
      totalBalance,
      activeUsers,
      inactiveUsers,
      roleCounts,
      usersWithBalance,
    };
  }, [users]);

  function openViewModal(user: Profile) {
    setSelectedUser(user);
    setNewRole(getCleanRole(user.role));
    setModalMode("view");
  }

  function openRoleModal(user: Profile) {
    setSelectedUser(user);
    setNewRole(getCleanRole(user.role));
    setModalMode("role");
  }

  function closeModal() {
    setSelectedUser(null);
    setNewRole("");
    setModalMode(null);
  }

  async function confirmRoleChange() {
    if (savingRole) return;
    if (!selectedUser || !newRole) return;

    if (currentUserRole !== "super_admin") {
      setMessage("Only Developer can manage user roles.");
      return;
    }

    const confirmUpdate = confirm(
      `Change ${getDisplayName(selectedUser)}'s role to ${getRoleData(newRole).label}?`,
    );

    if (!confirmUpdate) return;

    setSavingRole(true);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selectedUser.id);

    if (error) {
      setMessage(error.message);
      setSavingRole(false);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: selectedUser.id,
      title: "Account Role Updated",
      message: `Your account role has been updated to ${getRoleData(newRole).label}.`,
      type: "role_updated",
      is_read: false,
    });

    setMessage("User role updated successfully.");
    setSavingRole(false);
    closeModal();
    loadUsers();
  }

  function exportUsersToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredUsers
      .map((user) => {
        return `
          <tr>
            <td>${escapeHtml(getDisplayName(user))}</td>
            <td>${escapeHtml(user.email || "—")}</td>
            <td>${escapeHtml(getRoleData(user.role).label)}</td>
            <td>${formatNumber(orderCounts[user.id] || 0)}</td>
            <td>${formatMoney(user.balance)}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>${getCleanStatus(user.status) === "active" ? "Active" : "Inactive"}</td>
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
          <title>Users Report</title>
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
            @media print { body { padding: 18px; } th, td { padding: 8px; } table { font-size: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Users Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Users: ${users.length}</div>
              <div>Filtered Users: ${filteredUsers.length}</div>
              <div>Role Filter: ${roleFilter}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Total Users</span><strong>${formatNumber(users.length)}</strong></div>
            <div class="card"><span>Admins</span><strong>${formatNumber(stats.admins)}</strong></div>
            <div class="card"><span>New This Month</span><strong>${formatNumber(stats.newThisMonth)}</strong></div>
            <div class="card"><span>Total Balance</span><strong>${formatMoney(stats.totalBalance)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Total Orders</th>
                <th>Balance</th>
                <th>Date Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="7" style="text-align:center; padding:32px;">No users found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · User Management Report</span>
            <span>This report was generated from the Admin Users page.</span>
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
                Users
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage all registered users and their account details.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  loadUsers();
                  loadOrderCounts();
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportUsersToPDF}
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

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.6fr_0.6fr_auto]">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by username, email, or name..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {roleOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Filter size={17} />
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Users"
              value={formatNumber(users.length)}
              subtitle="All registered users"
              icon={<Users size={26} />}
              tone="green"
            />

            <StatCard
              title="Admins"
              value={formatNumber(stats.admins)}
              subtitle="Users with admin access"
              icon={<ShieldCheck size={26} />}
              tone="blue"
            />

            <StatCard
              title="New Users This Month"
              value={formatNumber(stats.newThisMonth)}
              subtitle="Joined this month"
              icon={<UserPlus size={26} />}
              tone="orange"
            />

            <StatCard
              title="Total User Balance"
              value={formatMoney(stats.totalBalance)}
              subtitle="Combined wallet balance"
              icon={<Wallet size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_330px]">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">User</th>
                      <th className="px-5 py-4 text-left">Role</th>
                      <th className="px-5 py-4 text-left">Total Orders</th>
                      <th className="px-5 py-4 text-left">Balance</th>
                      <th className="px-5 py-4 text-left">Date Registered</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-4">
                            <UserAvatar user={user} />

                            <div className="min-w-0">
                              <p className="max-w-[230px] truncate font-black text-slate-950">
                                {getFullName(user)}
                              </p>
                              <p className="mt-1 max-w-[230px] truncate text-xs font-black text-emerald-600">
                                @{getDisplayName(user)}
                              </p>
                              <p className="mt-1 max-w-[230px] truncate text-xs font-semibold text-slate-500">
                                {user.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-3">
                            <ShoppingCart size={18} className="mt-0.5 text-slate-400" />
                            <div>
                              <p className="font-black text-slate-950">
                                {formatNumber(orderCounts[user.id] || 0)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Total Orders
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <p className="font-black text-emerald-600">
                            {formatMoney(user.balance)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">Balance</p>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-start gap-3">
                            <CalendarDays size={18} className="mt-0.5 text-slate-400" />
                            <div>
                              <p className="font-black text-slate-800">{formatDate(user.created_at)}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {formatTime(user.created_at)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 align-top">
                          <StatusBadge status={user.status} />
                        </td>

                        <td className="px-5 py-5 align-top">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openViewModal(user)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="View user"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openRoleModal(user)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                              title="Manage role"
                            >
                              <MoreHorizontal size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length <= 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <Users size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No users found
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
                  Showing <span className="font-black text-slate-800">{filteredUsers.length}</span>{" "}
                  of <span className="font-black text-slate-800">{users.length}</span> users
                </p>

                <p>{loadingUsers ? "Loading users..." : "Users loaded"}</p>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">User Health</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-slate-700">Active users</p>
                    <p className="font-black text-emerald-600">{formatNumber(stats.activeUsers)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-slate-700">Inactive users</p>
                    <p className="font-black text-orange-600">{formatNumber(stats.inactiveUsers)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-slate-700">New this month</p>
                    <p className="font-black text-blue-600">{formatNumber(stats.newThisMonth)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-black text-slate-700">Users with balance</p>
                    <p className="font-black text-purple-600">{formatNumber(stats.usersWithBalance)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Role Summary</h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <span className="h-3 w-3 rounded-full bg-emerald-500" />
                      Users
                    </span>
                    <span className="font-black text-slate-900">{formatNumber(stats.roleCounts.user)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <span className="h-3 w-3 rounded-full bg-blue-500" />
                      Admins
                    </span>
                    <span className="font-black text-slate-900">{formatNumber(stats.roleCounts.admin)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <span className="h-3 w-3 rounded-full bg-red-500" />
                      Head Admins
                    </span>
                    <span className="font-black text-slate-900">{formatNumber(stats.roleCounts.head_admin)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <span className="h-3 w-3 rounded-full bg-purple-500" />
                      Developers
                    </span>
                    <span className="font-black text-slate-900">{formatNumber(stats.roleCounts.super_admin)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Quick Filters</h3>

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter("all");
                      setStatusFilter("active");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Active Users
                    <span>{formatNumber(stats.activeUsers)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter("admin");
                      setStatusFilter("all");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Admins
                    <span>{formatNumber(stats.roleCounts.admin)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter("head_admin");
                      setStatusFilter("all");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                  >
                    Head Admins
                    <span>{formatNumber(stats.roleCounts.head_admin)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setRoleFilter("all");
                      setStatusFilter("all");
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

        {modalMode === "view" && selectedUser && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">User Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review user account details and activity summary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <UserAvatar user={selectedUser} size="lg" />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">{getFullName(selectedUser)}</h4>
                    <p className="mt-1 text-sm font-black text-emerald-600">@{getDisplayName(selectedUser)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{selectedUser.email || "No email"}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <RoleBadge role={selectedUser.role} />
                      <StatusBadge status={selectedUser.status} />
                    </div>
                  </div>

                  <p className="shrink-0 text-2xl font-black text-emerald-600">
                    {formatMoney(selectedUser.balance)}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <InfoBlock label="User ID" value={selectedUser.id} />
                  <InfoBlock label="Username" value={getDisplayName(selectedUser)} />
                  <InfoBlock label="Full Name" value={getFullName(selectedUser)} />
                  <InfoBlock label="Email" value={selectedUser.email || "—"} />
                  <InfoBlock label="Plan" value={selectedUser.plan || "Default"} />
                  <InfoBlock label="Role" value={<RoleBadge role={selectedUser.role} />} />
                  <InfoBlock label="Total Orders" value={formatNumber(orderCounts[selectedUser.id] || 0)} />
                  <InfoBlock label="Balance" value={formatMoney(selectedUser.balance)} valueClassName="text-emerald-600" />
                  <InfoBlock label="Registered" value={`${formatDate(selectedUser.created_at)} · ${formatTime(selectedUser.created_at)}`} />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedUser;
                      closeModal();
                      openRoleModal(current);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                  >
                    <ShieldCheck size={17} />
                    Manage Role
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalMode === "role" && selectedUser && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Manage User Role</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Only Developer accounts can update account roles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={savingRole}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <UserAvatar user={selectedUser} size="lg" />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">{getFullName(selectedUser)}</h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Current role: {getRoleData(selectedUser.role).label}
                    </p>
                    <div className="mt-3">
                      <RoleBadge role={selectedUser.role} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    New Role
                  </label>

                  <select
                    value={newRole}
                    onChange={(event) => setNewRole(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="head_admin">Head Admin</option>
                    <option value="super_admin">Developer</option>
                  </select>
                </div>

                {currentUserRole !== "super_admin" && (
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                    Your current role cannot update account roles. Only Developer can manage user roles.
                  </div>
                )}

                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={savingRole}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmRoleChange}
                    disabled={savingRole || currentUserRole !== "super_admin"}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingRole ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                    {savingRole ? "Saving..." : "Save Role"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  Globe,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type ChildPanel = {
  id: string;
  owner_user_id: string;
  panel_name: string;
  panel_slug: string;
  support_email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  status: string;
  access_type: string;
  subscription_status: string | null;
  monthly_price: number | null;
  admin_note: string | null;
  approved_at: string | null;
  suspended_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type OwnerProfile = {
  id: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  reseller_level: string | null;
  balance: number | null;
};

type PanelWithOwner = ChildPanel & {
  owner?: OwnerProfile | null;
};

type StatusFilter = "all" | "pending" | "active" | "suspended" | "rejected";

const statusTabs: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Rejected", value: "rejected" },
];

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOwnerName(owner?: OwnerProfile | null) {
  if (!owner) return "Unknown User";

  if (owner.username) return owner.username;

  const fullName = `${owner.firstname || ""} ${owner.lastname || ""}`.trim();

  return fullName || owner.email || "Unknown User";
}

function getPanelUrl(slug?: string | null) {
  if (!slug) return "https://ascend-service.org/child/unknown";
  return `https://ascend-service.org/child/${slug}`;
}

function getStatusStyle(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (clean === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (clean === "pending") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (clean === "suspended") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (clean === "rejected") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-100";
}

function getStatusLabel(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (clean === "active") return "Active";
  if (clean === "pending") return "Pending";
  if (clean === "suspended") return "Suspended";
  if (clean === "rejected") return "Rejected";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
        status,
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">
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

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <div className="mt-2 min-w-0 break-words text-sm font-black text-slate-900">
        {value}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center">
      <div className="my-4 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl sm:my-8">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-950 sm:text-2xl">
              {title}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminChildPanelsPage() {
  const [panels, setPanels] = useState<PanelWithOwner[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<PanelWithOwner | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function loadPanels() {
    setLoading(true);
    setMessage("");

    const { data: panelData, error: panelError } = await supabase
      .from("child_panels")
      .select("*")
      .order("created_at", { ascending: false });

    if (panelError) {
      setMessage(panelError.message);
      setPanels([]);
      setLoading(false);
      return;
    }

    const rows = (panelData || []) as ChildPanel[];
    const ownerIds = Array.from(new Set(rows.map((item) => item.owner_user_id)));

    let ownerMap = new Map<string, OwnerProfile>();

    if (ownerIds.length > 0) {
      const { data: owners } = await supabase
        .from("profiles")
        .select(
          "id, username, firstname, lastname, email, reseller_level, balance",
        )
        .in("id", ownerIds);

      ownerMap = new Map(
        ((owners || []) as OwnerProfile[]).map((owner) => [owner.id, owner]),
      );
    }

    const merged = rows.map((panel) => ({
      ...panel,
      owner: ownerMap.get(panel.owner_user_id) || null,
    }));

    setPanels(merged);
    setLoading(false);
  }

  useEffect(() => {
    loadPanels();
  }, []);

  const stats = useMemo(() => {
    const total = panels.length;
    const pending = panels.filter((item) => item.status === "pending").length;
    const active = panels.filter((item) => item.status === "active").length;
    const suspended = panels.filter(
      (item) => item.status === "suspended",
    ).length;

    return {
      total,
      pending,
      active,
      suspended,
    };
  }, [panels]);

  const filteredPanels = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return panels.filter((panel) => {
      const ownerName = getOwnerName(panel.owner).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ? true : panel.status === statusFilter;

      const matchesSearch =
        !keyword ||
        panel.panel_name.toLowerCase().includes(keyword) ||
        panel.panel_slug.toLowerCase().includes(keyword) ||
        ownerName.includes(keyword) ||
        String(panel.support_email || "").toLowerCase().includes(keyword) ||
        String(panel.owner?.email || "").toLowerCase().includes(keyword) ||
        String(panel.owner?.reseller_level || "")
          .toLowerCase()
          .includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [panels, search, statusFilter]);

  async function updatePanelStatus(
    panel: PanelWithOwner,
    nextStatus: "active" | "pending" | "suspended" | "rejected",
  ) {
    if (savingId) return;

    setSavingId(panel.id);
    setMessage("");

    const updateData: Record<string, string | null> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === "active") {
      updateData.approved_at = new Date().toISOString();
      updateData.suspended_at = null;
      updateData.rejected_at = null;
    }

    if (nextStatus === "suspended") {
      updateData.suspended_at = new Date().toISOString();
    }

    if (nextStatus === "rejected") {
      updateData.rejected_at = new Date().toISOString();
    }

    if (nextStatus === "pending") {
      updateData.suspended_at = null;
      updateData.rejected_at = null;
    }

    const { error } = await supabase
      .from("child_panels")
      .update(updateData)
      .eq("id", panel.id);

    if (error) {
      setMessage(error.message);
      setSavingId(null);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: panel.owner_user_id,
      title: "Child Panel Status Updated",
      message: `Your Child Panel "${panel.panel_name}" is now ${getStatusLabel(
        nextStatus,
      )}.`,
      type: "child_panel_status_updated",
      is_read: false,
    });

    setMessage(`Panel updated to ${getStatusLabel(nextStatus)}.`);
    setSavingId(null);
    setSelectedPanel(null);
    loadPanels();
  }

  async function copyPanelUrl(panel: ChildPanel) {
    await navigator.clipboard.writeText(getPanelUrl(panel.panel_slug));
    setMessage("Child Panel URL copied.");
  }

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Child Panels
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Review, approve, suspend, and manage reseller Child Panel setups.
              </p>
            </div>

            <button
              type="button"
              onClick={loadPanels}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-fit"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Panels"
              value={String(stats.total)}
              subtitle="All reseller child panels"
              icon={<Store size={23} />}
              color="bg-blue-50 text-blue-700"
            />

            <StatCard
              title="Pending"
              value={String(stats.pending)}
              subtitle="Need admin approval"
              icon={<AlertTriangle size={23} />}
              color="bg-orange-50 text-orange-700"
            />

            <StatCard
              title="Active"
              value={String(stats.active)}
              subtitle="Currently approved"
              icon={<CheckCircle2 size={23} />}
              color="bg-emerald-50 text-emerald-700"
            />

            <StatCard
              title="Suspended"
              value={String(stats.suspended)}
              subtitle="Temporarily blocked"
              icon={<Ban size={23} />}
              color="bg-red-50 text-red-700"
            />
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1fr_240px_auto]">
              <div className="flex h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search size={18} className="shrink-0 text-slate-400" />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search panel name, slug, owner, email, or level..."
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
              >
                {statusTabs.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {tab.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 xl:w-auto"
              >
                <Filter size={17} />
                Clear
              </button>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-4">
                <div className="flex gap-2 overflow-x-auto pb-1 xl:flex-wrap xl:overflow-visible xl:pb-0">
                  {statusTabs.map((tab) => {
                    const active = statusFilter === tab.value;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setStatusFilter(tab.value)}
                        className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
                          active
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Panel</th>
                      <th className="px-5 py-4 text-left">Owner</th>
                      <th className="px-5 py-4 text-left">URL</th>
                      <th className="px-5 py-4 text-left">Access</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Created</th>
                      <th className="px-5 py-4 text-left">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-16 text-center text-slate-500"
                        >
                          <Loader2 className="mx-auto animate-spin" size={28} />
                          <p className="mt-3 text-sm font-bold">
                            Loading child panels...
                          </p>
                        </td>
                      </tr>
                    ) : filteredPanels.length <= 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-16 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                              <Store size={26} />
                            </div>

                            <h3 className="mt-4 text-lg font-black text-slate-950">
                              No child panels found
                            </h3>

                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              Try clearing your filters.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPanels.map((panel) => (
                        <tr
                          key={panel.id}
                          className="border-t border-slate-100 transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-5 align-top">
                            <div className="flex items-start gap-3">
                              <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white"
                                style={{
                                  backgroundColor:
                                    panel.primary_color || "#2563eb",
                                }}
                              >
                                {panel.logo_url ? (
                                  <img
                                    src={panel.logo_url}
                                    alt={panel.panel_name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Store size={22} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[230px] truncate font-black text-slate-900">
                                  {panel.panel_name}
                                </p>

                                <p className="mt-1 text-xs font-bold text-slate-400">
                                  /{panel.panel_slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-800">
                              {getOwnerName(panel.owner)}
                            </p>

                            <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-slate-400">
                              {panel.owner?.email || panel.owner_user_id}
                            </p>

                            <p className="mt-1 text-xs font-black text-blue-600">
                              {panel.owner?.reseller_level || "New Reseller"}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <button
                              type="button"
                              onClick={() => copyPanelUrl(panel)}
                              className="flex max-w-[230px] items-center gap-2 truncate text-left text-sm font-bold text-blue-600 hover:text-blue-700"
                            >
                              <Globe size={15} className="shrink-0" />
                              <span className="truncate">
                                {getPanelUrl(panel.panel_slug)}
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black capitalize text-slate-700">
                              {String(panel.access_type || "paid_subscription")
                                .replaceAll("_", " ")}
                            </p>

                            <p className="mt-1 text-xs font-semibold capitalize text-slate-400">
                              {String(panel.subscription_status || "none")
                                .replaceAll("_", " ")}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <StatusBadge status={panel.status} />
                          </td>

                          <td className="px-5 py-5 align-top">
                            <p className="font-black text-slate-700">
                              {formatDate(panel.created_at)}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {formatDateTime(panel.updated_at)}
                            </p>
                          </td>

                          <td className="px-5 py-5 align-top">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedPanel(panel)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>

                              {panel.status !== "active" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePanelStatus(panel, "active")
                                  }
                                  disabled={savingId === panel.id}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                                  title="Approve / Activate"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}

                              {panel.status !== "suspended" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePanelStatus(panel, "suspended")
                                  }
                                  disabled={savingId === panel.id}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                  title="Suspend"
                                >
                                  <Ban size={16} />
                                </button>
                              )}

                              {panel.status !== "rejected" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updatePanelStatus(panel, "rejected")
                                  }
                                  disabled={savingId === panel.id}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing{" "}
                  <span className="font-black text-slate-800">
                    {filteredPanels.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-black text-slate-800">
                    {panels.length}
                  </span>{" "}
                  panels
                </p>

                <p>Admin approval required before public access</p>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Approval Guide
                  </h3>
                </div>

                <div className="space-y-4 text-sm font-semibold leading-6 text-slate-500">
                  <p>
                    Approve a panel only after checking the panel name, slug,
                    support email, and logo.
                  </p>

                  <p>
                    Suspended panels should not be publicly accessible later
                    when the child panel frontend is connected.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <User size={18} className="text-slate-600" />
                  <h3 className="text-lg font-black text-slate-950">
                    Status Summary
                  </h3>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Pending Approval
                    </span>
                    <span className="font-black text-orange-600">
                      {stats.pending}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Active Panels
                    </span>
                    <span className="font-black text-emerald-600">
                      {stats.active}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-600">
                      Suspended Panels
                    </span>
                    <span className="font-black text-red-600">
                      {stats.suspended}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {selectedPanel && (
          <ModalShell
            title="Child Panel Details"
            subtitle="Review this reseller child panel setup."
            onClose={() => setSelectedPanel(null)}
          >
            <div className="space-y-6">
              <div
                className="rounded-[28px] p-5 text-white"
                style={{
                  backgroundColor: selectedPanel.primary_color || "#2563eb",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20">
                      {selectedPanel.logo_url ? (
                        <img
                          src={selectedPanel.logo_url}
                          alt={selectedPanel.panel_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store size={26} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="truncate text-2xl font-black">
                        {selectedPanel.panel_name}
                      </h4>

                      <p className="mt-1 break-all text-sm font-semibold text-white/80">
                        {getPanelUrl(selectedPanel.panel_slug)}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-black">
                    {getStatusLabel(selectedPanel.status)}
                  </span>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
                <InfoBlock label="Panel ID" value={selectedPanel.id} />
                <InfoBlock
                  label="Panel Name"
                  value={selectedPanel.panel_name}
                />
                <InfoBlock
                  label="Panel Slug"
                  value={selectedPanel.panel_slug}
                />
                <InfoBlock
                  label="Owner"
                  value={getOwnerName(selectedPanel.owner)}
                />
                <InfoBlock
                  label="Owner Email"
                  value={selectedPanel.owner?.email || "—"}
                />
                <InfoBlock
                  label="Reseller Level"
                  value={selectedPanel.owner?.reseller_level || "New Reseller"}
                />
                <InfoBlock
                  label="Support Email"
                  value={selectedPanel.support_email || "—"}
                />
                <InfoBlock
                  label="Access Type"
                  value={String(selectedPanel.access_type || "—").replaceAll(
                    "_",
                    " ",
                  )}
                />
                <InfoBlock
                  label="Subscription"
                  value={String(
                    selectedPanel.subscription_status || "none",
                  ).replaceAll("_", " ")}
                />
                <InfoBlock
                  label="Monthly Price"
                  value={`₱${Number(
                    selectedPanel.monthly_price || 0,
                  ).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
                <InfoBlock
                  label="Created"
                  value={formatDateTime(selectedPanel.created_at)}
                />
                <InfoBlock
                  label="Approved"
                  value={formatDateTime(selectedPanel.approved_at)}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                {selectedPanel.status !== "active" && (
                  <button
                    type="button"
                    onClick={() => updatePanelStatus(selectedPanel, "active")}
                    disabled={savingId === selectedPanel.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50 sm:w-auto"
                  >
                    <CheckCircle2 size={17} />
                    Approve / Activate
                  </button>
                )}

                {selectedPanel.status !== "suspended" && (
                  <button
                    type="button"
                    onClick={() =>
                      updatePanelStatus(selectedPanel, "suspended")
                    }
                    disabled={savingId === selectedPanel.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-50 sm:w-auto"
                  >
                    <Ban size={17} />
                    Suspend
                  </button>
                )}

                {selectedPanel.status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => updatePanelStatus(selectedPanel, "rejected")}
                    disabled={savingId === selectedPanel.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                )}
              </div>
            </div>
          </ModalShell>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
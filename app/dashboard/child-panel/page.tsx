"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Palette,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Profile = {
  balance?: number | null;
  reseller_level?: string | null;
  child_panel_access?: boolean | null;
  child_panel_access_type?: string | null;
  child_panel_subscription_status?: string | null;
  child_panel_subscription_expires_at?: string | null;
};

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

type Subscription = {
  id: string;
  status: string;
  price: number;
  auto_renew: boolean;
  started_at: string | null;
  expires_at: string | null;
  cancelled_at: string | null;
};

type ChildPanelCustomer = {
  id: string;
  email: string | null;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  balance: number | string | null;
  status: string | null;
};

type ChildPanelDeposit = {
  id: string;
  child_panel_id: string;
  owner_user_id: string;
  customer_id: string;
  amount: number | string | null;
  method: string | null;
  reference_number: string | null;
  proof_url: string | null;
  status: string | null;
  reject_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string | null;
  child_panel_customers?: ChildPanelCustomer | null;
};

const CHILD_PANEL_PRICE = 349;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "long",
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

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getResellerRank(level?: string | null) {
  const clean = String(level || "").toLowerCase();

  if (clean.includes("ascend partner")) return 6;
  if (clean.includes("elite partner")) return 5;
  if (clean.includes("premium partner")) return 5;
  if (clean.includes("master reseller")) return 4;
  if (clean.includes("pro reseller")) return 3;
  if (clean.includes("power reseller")) return 2;
  if (clean.includes("new reseller")) return 1;

  return 1;
}

function getStatusStyle(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (clean === "active" || clean === "approved" || clean === "completed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (clean === "pending") {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (clean === "suspended" || clean === "rejected" || clean === "failed") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-blue-50 text-blue-700 ring-blue-100";
}

function getStatusText(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (clean === "active") return "Active";
  if (clean === "approved") return "Approved";
  if (clean === "pending") return "Pending Approval";
  if (clean === "suspended") return "Suspended";
  if (clean === "rejected") return "Rejected";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getCustomerName(customer?: ChildPanelCustomer | null) {
  if (!customer) return "Unknown Customer";

  const fullName = `${customer.firstname || ""} ${customer.lastname || ""}`.trim();

  return fullName || customer.username || customer.email || "Unknown Customer";
}

function validateLogoDimensions(file: File) {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const valid = image.width === 512 && image.height === 512;
      URL.revokeObjectURL(objectUrl);
      resolve(valid);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    image.src = objectUrl;
  });
}

function InfoCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}
        >
          <Icon size={23} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>

          <h3 className="mt-1 truncate text-2xl font-black text-slate-950">
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

function DepositStatusBadge({ status }: { status?: string | null }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
        status,
      )}`}
    >
      {getStatusText(status)}
    </span>
  );
}

export default function ChildPanelPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [panel, setPanel] = useState<ChildPanel | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const [panelName, setPanelName] = useState("");
  const [panelSlug, setPanelSlug] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#2563eb");

  const [deposits, setDeposits] = useState<ChildPanelDeposit[]>([]);
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [updatingDepositId, setUpdatingDepositId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const resellerRank = getResellerRank(profile?.reseller_level);
  const hasLevelPerk = resellerRank >= 3;

  const hasPaidAccess =
    profile?.child_panel_access === true &&
    profile?.child_panel_subscription_status === "active";

  const hasFreeAccess =
    profile?.child_panel_access === true &&
    (profile?.child_panel_subscription_status === "free_lifetime" ||
      profile?.child_panel_access_type === "level_perk");

  const hasAccess = hasLevelPerk || hasPaidAccess || hasFreeAccess;

  const childPanelUrl = useMemo(() => {
    if (!panelSlug) return "ascend-service.org/child/your-panel";
    return `ascend-service.org/child/${panelSlug}`;
  }, [panelSlug]);

  const pendingDeposits = useMemo(() => {
    return deposits.filter(
      (deposit) => String(deposit.status || "pending").toLowerCase() === "pending",
    );
  }, [deposits]);

  const approvedDepositsTotal = useMemo(() => {
    return deposits
      .filter((deposit) => String(deposit.status || "").toLowerCase() === "approved")
      .reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0);
  }, [deposits]);

  async function loadOwnerDeposits() {
    setDepositsLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setDeposits([]);
      setDepositsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/owner/deposits/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        showToast(result.message || "Failed to load customer deposits.", "error");
        setDeposits([]);
        setDepositsLoading(false);
        return;
      }

      setDeposits((result.deposits || []) as ChildPanelDeposit[]);
      setDepositsLoading(false);
    } catch {
      showToast("Failed to load customer deposits.", "error");
      setDeposits([]);
      setDepositsLoading(false);
    }
  }

  async function loadData() {
    setLoading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select(
        "balance, reseller_level, child_panel_access, child_panel_access_type, child_panel_subscription_status, child_panel_subscription_expires_at",
      )
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      showToast(profileError.message, "error");
      setLoading(false);
      return;
    }

    setProfile((profileData || null) as Profile | null);

    const { data: panelData } = await supabase
      .from("child_panels")
      .select("*")
      .eq("owner_user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (panelData) {
      const childPanel = panelData as ChildPanel;

      setPanel(childPanel);
      setPanelName(childPanel.panel_name || "");
      setPanelSlug(childPanel.panel_slug || "");
      setSupportEmail(childPanel.support_email || "");
      setLogoUrl(childPanel.logo_url || "");
      setPrimaryColor(childPanel.primary_color || "#2563eb");
    }

    const { data: subscriptionData } = await supabase
      .from("child_panel_subscriptions")
      .select("*")
      .eq("user_id", authData.user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionData) {
      setSubscription(subscriptionData as Subscription);
    }

    await loadOwnerDeposits();

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handlePanelNameChange(value: string) {
    setPanelName(value);

    if (!panel) {
      setPanelSlug(slugify(value));
    }
  }

  async function uploadLogo(file: File) {
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      showToast("Logo must be PNG, JPG, or WEBP.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo file must be 2MB or smaller.", "error");
      return;
    }

    const validSize = await validateLogoDimensions(file);

    if (!validSize) {
      showToast("Logo must be exactly 512 x 512 px.", "error");
      return;
    }

    setLogoUploading(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      showToast("Please login again.", "error");
      setLogoUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${authData.user.id}/${Date.now()}-child-panel-logo.${fileExt}`;

    const { error } = await supabase.storage
      .from("child-panel-logos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      showToast(error.message, "error");
      setLogoUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("child-panel-logos")
      .getPublicUrl(fileName);

    setLogoUrl(data.publicUrl);
    setLogoUploading(false);

    showToast("Logo uploaded successfully.", "success");
  }

  async function savePanel() {
    if (saving) return;

    if (!hasAccess) {
      showToast("You need Child Panel access before setting up a panel.", "error");
      return;
    }

    if (!panelName.trim()) {
      showToast("Please enter your panel name.", "warning");
      return;
    }

    if (!panelSlug.trim()) {
      showToast("Please enter your panel slug.", "warning");
      return;
    }

    if (panelSlug.length < 3) {
      showToast("Panel slug must be at least 3 characters.", "warning");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(panelSlug)) {
      showToast(
        "Panel slug can only use lowercase letters, numbers, and hyphen.",
        "warning",
      );
      return;
    }

    setSaving(true);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      showToast("Please login again.", "error");
      setSaving(false);
      return;
    }

    const accessType =
      hasLevelPerk || hasFreeAccess ? "level_perk" : "paid_subscription";

    const subscriptionStatus =
      hasLevelPerk || hasFreeAccess ? "free_lifetime" : "active";

    if (panel) {
      const { error } = await supabase
        .from("child_panels")
        .update({
          panel_name: panelName.trim(),
          panel_slug: panelSlug.trim(),
          support_email: supportEmail.trim() || null,
          logo_url: logoUrl.trim() || null,
          primary_color: primaryColor || "#2563eb",
          access_type: accessType,
          subscription_status: subscriptionStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", panel.id)
        .eq("owner_user_id", authData.user.id);

      if (error) {
        showToast(error.message, "error");
        setSaving(false);
        return;
      }

      showToast("Child Panel settings saved.", "success");
    } else {
      const { error } = await supabase.from("child_panels").insert({
        owner_user_id: authData.user.id,
        panel_name: panelName.trim(),
        panel_slug: panelSlug.trim(),
        support_email: supportEmail.trim() || null,
        logo_url: logoUrl.trim() || null,
        primary_color: primaryColor || "#2563eb",
        status: "pending",
        access_type: accessType,
        subscription_status: subscriptionStatus,
        monthly_price: hasLevelPerk || hasFreeAccess ? 0 : CHILD_PANEL_PRICE,
      });

      if (error) {
        showToast(error.message, "error");
        setSaving(false);
        return;
      }

      showToast("Child Panel setup submitted for approval.", "success");
    }

    setSaving(false);
    loadData();
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(`https://${childPanelUrl}`);
    showToast("Child Panel URL copied.", "success");
  }

  async function updateDepositStatus(
    deposit: ChildPanelDeposit,
    action: "approve" | "reject",
  ) {
    if (updatingDepositId) return;

    const reason = rejectReasons[deposit.id] || "";

    if (action === "reject" && !reason.trim()) {
      showToast("Please enter a reject reason before rejecting.", "warning");
      return;
    }

    setUpdatingDepositId(deposit.id);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      showToast("Please login again.", "error");
      setUpdatingDepositId(null);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/owner/deposits/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          depositId: deposit.id,
          action,
          rejectReason: reason,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        showToast(result.message || "Failed to update deposit.", "error");
        setUpdatingDepositId(null);
        return;
      }

      showToast(result.message || "Deposit updated successfully.", "success");
      setRejectReasons((current) => ({ ...current, [deposit.id]: "" }));
      setUpdatingDepositId(null);
      loadOwnerDeposits();
    } catch {
      showToast("Failed to update deposit.", "error");
      setUpdatingDepositId(null);
    }
  }

  if (loading) {
    return (
      <DashboardGuard>
        <DashboardLayout>
          <div className="flex min-h-[70vh] items-center justify-center">
            <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="mt-4 text-sm font-bold text-slate-500">
                Loading Child Panel...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </DashboardGuard>
    );
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="min-w-0 space-y-6">
          <div className="flex min-w-0 flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                <Sparkles size={15} />
                Reseller Tool
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Child Panel
              </h1>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Set up your own branded SMM panel powered by Ascend Service.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50 sm:w-fit"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard
              icon={hasAccess ? ShieldCheck : Lock}
              title="Access Status"
              value={hasAccess ? "Unlocked" : "Locked"}
              subtitle={
                hasAccess
                  ? "You can set up your panel"
                  : "Subscribe or reach Level 3"
              }
              color={
                hasAccess
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }
            />

            <InfoCard
              icon={Store}
              title="Panel Status"
              value={panel ? getStatusText(panel.status) : "Not Created"}
              subtitle={
                panel ? "Current child panel status" : "Create your first panel"
              }
              color="bg-blue-50 text-blue-700"
            />

            <InfoCard
              icon={Wallet}
              title="Monthly Price"
              value={hasLevelPerk || hasFreeAccess ? "Free" : "₱349"}
              subtitle={
                hasLevelPerk || hasFreeAccess
                  ? "Lifetime reseller perk"
                  : "Paid monthly subscription"
              }
              color="bg-purple-50 text-purple-700"
            />

            <InfoCard
              icon={Globe}
              title="Pending Deposits"
              value={String(pendingDeposits.length)}
              subtitle={`${formatMoney(approvedDepositsTotal)} approved total`}
              color="bg-orange-50 text-orange-700"
            />
          </div>

          {!hasAccess && (
            <div className="rounded-[28px] border border-red-100 bg-red-50 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-red-600 shadow-sm">
                  <Lock size={24} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-black text-red-700">
                    Child Panel Access Locked
                  </h3>

                  <p className="mt-2 text-sm font-semibold leading-6 text-red-600/80">
                    You need an active ₱349/month Child Panel subscription or
                    Level 3+ reseller status to use this feature.
                  </p>

                  <a
                    href="/dashboard/reseller"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-700 sm:w-fit"
                  >
                    Go to Reseller Page
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {hasAccess && (
            <>
              <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Settings size={24} />
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-black text-slate-950">
                        Set Up Your Child Panel
                      </h2>

                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                        Fill in your panel information. New panels are marked
                        pending until admin approval.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Panel Name
                      </label>

                      <input
                        value={panelName}
                        onChange={(event) =>
                          handlePanelNameChange(event.target.value)
                        }
                        placeholder="Example: Kutchara Boost Panel"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Panel Slug / URL
                      </label>

                      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                        <input
                          value={panelSlug}
                          onChange={(event) =>
                            setPanelSlug(slugify(event.target.value))
                          }
                          placeholder="your-panel-name"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        />

                        <button
                          type="button"
                          onClick={copyUrl}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-5 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                        >
                          <Copy size={16} />
                          Copy URL
                        </button>
                      </div>

                      <p className="mt-2 break-all text-xs font-bold text-slate-500">
                        Preview: https://{childPanelUrl}
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Support Email
                        </label>

                        <input
                          value={supportEmail}
                          onChange={(event) =>
                            setSupportEmail(event.target.value)
                          }
                          placeholder="support@yourpanel.com"
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Theme Color
                        </label>

                        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                          <Palette size={18} className="text-slate-400" />

                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(event) =>
                              setPrimaryColor(event.target.value)
                            }
                            className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"
                          />

                          <input
                            value={primaryColor}
                            onChange={(event) =>
                              setPrimaryColor(event.target.value)
                            }
                            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Upload Logo
                      </label>

                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt="Child Panel Logo"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Store size={28} className="text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-800">
                              Logo must be exactly 512 x 512 px
                            </p>

                            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                              Accepted formats: PNG, JPG, WEBP. Maximum file size:
                              2MB.
                            </p>

                            <label className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700">
                              {logoUploading ? (
                                <>
                                  <Loader2 size={17} className="animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload size={17} />
                                  Choose Logo
                                </>
                              )}

                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                disabled={logoUploading}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) uploadLogo(file);
                                  event.target.value = "";
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={savePanel}
                      disabled={saving}
                      className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
                    >
                      {saving ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}

                      {saving
                        ? "Saving..."
                        : panel
                          ? "Save Settings"
                          : "Create Child Panel"}
                    </button>
                  </div>
                </div>

                <aside className="min-w-0 space-y-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-black text-slate-950">
                        Panel Preview
                      </h3>

                      {panel && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
                            panel.status,
                          )}`}
                        >
                          {getStatusText(panel.status)}
                        </span>
                      )}
                    </div>

                    <div
                      className="mt-5 rounded-[24px] p-5 text-white shadow-sm"
                      style={{ backgroundColor: primaryColor || "#2563eb" }}
                    >
                      <div className="flex items-center gap-3">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={panelName || "Child Panel"}
                            className="h-11 w-11 rounded-2xl bg-white object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-lg font-black">
                            {(panelName || "P").charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-black">
                            {panelName || "Your Panel Name"}
                          </h4>

                          <p className="truncate text-xs font-semibold text-white/80">
                            Powered by Ascend Service
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-2xl bg-white/15 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-white/70">
                          Panel URL
                        </p>

                        <p className="mt-2 break-all text-sm font-black">
                          {childPanelUrl}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-black text-slate-950">
                      Access Details
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-500">
                          Reseller Level
                        </span>

                        <span className="text-right text-sm font-black text-slate-900">
                          {profile?.reseller_level || "New Reseller"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-500">
                          Access Type
                        </span>

                        <span className="text-right text-sm font-black text-slate-900">
                          {hasLevelPerk || hasFreeAccess
                            ? "Free Lifetime"
                            : "Paid Subscription"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-500">
                          Expires At
                        </span>

                        <span className="text-right text-sm font-black text-slate-900">
                          {hasLevelPerk || hasFreeAccess
                            ? "Never"
                            : formatDate(
                                subscription?.expires_at ||
                                  profile?.child_panel_subscription_expires_at,
                              )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {panel?.status === "pending" && (
                    <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-5">
                      <div className="flex gap-3">
                        <AlertTriangle
                          className="mt-0.5 shrink-0 text-orange-600"
                          size={20}
                        />

                        <div>
                          <h4 className="font-black text-orange-700">
                            Pending Admin Approval
                          </h4>

                          <p className="mt-1 text-sm font-semibold leading-6 text-orange-700/80">
                            Your panel setup is saved. Admin approval is needed
                            before the public child panel becomes active.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {panel?.status === "active" && (
                    <a
                      href={`/child/${panel.panel_slug}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                    >
                      <CheckCircle2 size={18} />
                      Open Child Panel
                    </a>
                  )}
                </aside>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Customer Add Funds Requests
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Approve or reject deposits submitted by customers from your child panel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadOwnerDeposits}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 sm:w-fit"
                  >
                    <RefreshCw size={17} />
                    Refresh Deposits
                  </button>
                </div>

                {depositsLoading ? (
                  <div className="p-10 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-600" size={28} />
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      Loading customer deposits...
                    </p>
                  </div>
                ) : deposits.length <= 0 ? (
                  <div className="p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                      <Wallet size={26} />
                    </div>
                    <h4 className="mt-4 text-lg font-black text-slate-950">
                      No customer deposits yet
                    </h4>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Add funds requests from your child panel customers will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-5 py-4 text-left">Customer</th>
                          <th className="px-5 py-4 text-left">Amount</th>
                          <th className="px-5 py-4 text-left">Method</th>
                          <th className="px-5 py-4 text-left">Reference</th>
                          <th className="px-5 py-4 text-left">Proof</th>
                          <th className="px-5 py-4 text-left">Status</th>
                          <th className="px-5 py-4 text-left">Date</th>
                          <th className="px-5 py-4 text-left">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {deposits.map((deposit) => {
                          const status = String(deposit.status || "pending").toLowerCase();
                          const pending = status === "pending";

                          return (
                            <tr
                              key={deposit.id}
                              className="border-t border-slate-100 transition hover:bg-slate-50/70"
                            >
                              <td className="px-5 py-5 align-top">
                                <p className="font-black text-slate-900">
                                  {getCustomerName(deposit.child_panel_customers)}
                                </p>
                                <p className="mt-1 max-w-[190px] truncate text-xs font-semibold text-slate-400">
                                  {deposit.child_panel_customers?.email || deposit.customer_id}
                                </p>
                                <p className="mt-1 text-xs font-black text-blue-600">
                                  Balance: {formatMoney(deposit.child_panel_customers?.balance)}
                                </p>
                              </td>

                              <td className="px-5 py-5 align-top font-black text-emerald-600">
                                {formatMoney(deposit.amount)}
                              </td>

                              <td className="px-5 py-5 align-top font-bold text-slate-700">
                                {deposit.method || "Manual Payment"}
                              </td>

                              <td className="px-5 py-5 align-top">
                                <p className="max-w-[160px] truncate font-semibold text-slate-600">
                                  {deposit.reference_number || "—"}
                                </p>
                              </td>

                              <td className="px-5 py-5 align-top">
                                {deposit.proof_url ? (
                                  <a
                                    href={deposit.proof_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
                                  >
                                    View Proof
                                    <ExternalLink size={13} />
                                  </a>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">No proof</span>
                                )}
                              </td>

                              <td className="px-5 py-5 align-top">
                                <DepositStatusBadge status={deposit.status} />
                                {deposit.reject_reason && (
                                  <p className="mt-2 max-w-[180px] text-xs font-semibold text-red-500">
                                    {deposit.reject_reason}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-5 align-top">
                                <p className="font-bold text-slate-700">
                                  {formatDateTime(deposit.created_at)}
                                </p>
                              </td>

                              <td className="px-5 py-5 align-top">
                                {pending ? (
                                  <div className="min-w-[250px] space-y-3">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateDepositStatus(deposit, "approve")}
                                        disabled={updatingDepositId === deposit.id}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        {updatingDepositId === deposit.id ? (
                                          <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                          <CheckCircle2 size={14} />
                                        )}
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => updateDepositStatus(deposit, "reject")}
                                        disabled={updatingDepositId === deposit.id}
                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        <XCircle size={14} />
                                        Reject
                                      </button>
                                    </div>

                                    <input
                                      value={rejectReasons[deposit.id] || ""}
                                      onChange={(event) =>
                                        setRejectReasons((current) => ({
                                          ...current,
                                          [deposit.id]: event.target.value,
                                        }))
                                      }
                                      placeholder="Reject reason required if rejecting"
                                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-xs font-bold text-slate-400">
                                    {status === "approved"
                                      ? `Approved ${formatDateTime(deposit.approved_at)}`
                                      : status === "rejected"
                                        ? `Rejected ${formatDateTime(deposit.rejected_at)}`
                                        : "No action"}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

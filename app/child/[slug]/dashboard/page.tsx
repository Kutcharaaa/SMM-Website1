"use client";

import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
  FileImage,
  Home,
  Loader2,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  Upload,
  User,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Panel = {
  id: string;
  owner_user_id: string;
  panel_name: string;
  panel_slug: string;
  support_email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  status: string;
};

type Customer = {
  id: string;
  child_panel_id: string;
  owner_user_id: string;
  email: string;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  balance: number;
  status: string;
  last_login_at: string | null;
  created_at: string;
};

type Deposit = {
  id: string;
  amount: number;
  method: string | null;
  reference_number: string | null;
  proof_url: string | null;
  status: string;
  reject_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
};

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getAccentShadow(color: string) {
  return `0 20px 55px ${color}35`;
}

function setDynamicFavicon(iconUrl?: string | null) {
  if (!iconUrl) return;

  const existing =
    document.querySelector<HTMLLinkElement>("link[rel='icon']") ||
    document.createElement("link");

  existing.rel = "icon";
  existing.href = iconUrl;

  if (!existing.parentElement) {
    document.head.appendChild(existing);
  }
}

function getReadableError(value: unknown) {
  return String(value || "Something went wrong. Please try again.");
}

function sanitizeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
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

function getDepositStatusStyle(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (["approved", "completed", "paid"].includes(clean)) {
    return "bg-emerald-500/10 text-emerald-200 ring-emerald-400/20";
  }

  if (["rejected", "failed", "cancelled", "canceled"].includes(clean)) {
    return "bg-red-500/10 text-red-200 ring-red-400/20";
  }

  return "bg-orange-500/10 text-orange-200 ring-orange-400/20";
}

function getDepositStatusLabel(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();

  if (clean === "approved" || clean === "completed" || clean === "paid") {
    return "Approved";
  }

  if (clean === "rejected") return "Rejected";
  if (clean === "failed") return "Failed";

  return "Pending";
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  primaryColor,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: any;
  primaryColor: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${primaryColor}18`,
            color: primaryColor,
          }}
        >
          <Icon size={23} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">
            {title}
          </p>

          <h3 className="mt-2 truncate text-2xl font-black text-white">
            {value}
          </h3>

          <p className="mt-1 text-sm font-semibold text-white/45">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  primaryColor,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  primaryColor: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "text-white"
          : "text-white/55 hover:bg-white/[0.06] hover:text-white"
      }`}
      style={
        active
          ? {
              background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
              boxShadow: getAccentShadow(primaryColor),
            }
          : undefined
      }
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

export default function ChildPanelDashboardPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || "");

  const [panel, setPanel] = useState<Panel | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const primaryColor = panel?.primary_color || "#ff4f8b";

  const displayName = useMemo(() => {
    if (!customer) return "Customer";

    const fullName = `${customer.firstname || ""} ${
      customer.lastname || ""
    }`.trim();

    return fullName || customer.username || "Customer";
  }, [customer]);

  const depositStats = useMemo(() => {
    const pending = deposits.filter(
      (deposit) => String(deposit.status || "pending").toLowerCase() === "pending",
    ).length;

    const approvedTotal = deposits
      .filter((deposit) =>
        ["approved", "completed", "paid"].includes(
          String(deposit.status || "").toLowerCase(),
        ),
      )
      .reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0);

    return {
      pending,
      approvedTotal,
    };
  }, [deposits]);

  function getStoredToken() {
    const localToken = window.localStorage.getItem("child_panel_token");
    const localSlug = window.localStorage.getItem("child_panel_slug");

    if (localToken && localSlug === slug) return localToken;

    const sessionToken = window.sessionStorage.getItem("child_panel_token");
    const sessionSlug = window.sessionStorage.getItem("child_panel_slug");

    if (sessionToken && sessionSlug === slug) return sessionToken;

    return "";
  }

  async function loadDeposits(panelSlug = slug, sessionToken = getStoredToken()) {
    if (!panelSlug || !sessionToken) return;

    setLoadingDeposits(true);

    try {
      const response = await fetch("/api/child-panel/customers/deposits/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: panelSlug,
          token: sessionToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setDeposits((result.deposits || []) as Deposit[]);
      }
    } catch (error) {
      console.error("CHILD_PANEL_DEPOSITS_LIST_ERROR:", error);
    } finally {
      setLoadingDeposits(false);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setMessage("");

    const token = getStoredToken();

    if (!token) {
      router.replace(`/child/${slug}/login`);
      return;
    }

    try {
      const response = await fetch("/api/child-panel/customers/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          token,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        window.localStorage.removeItem("child_panel_token");
        window.localStorage.removeItem("child_panel_slug");
        window.localStorage.removeItem("child_panel_customer");

        window.sessionStorage.removeItem("child_panel_token");
        window.sessionStorage.removeItem("child_panel_slug");
        window.sessionStorage.removeItem("child_panel_customer");

        router.replace(`/child/${slug}/login`);
        return;
      }

      setPanel(result.panel);
      setCustomer(result.customer);

      document.title = `Dashboard | ${result.panel.panel_name}`;
      setDynamicFavicon(result.panel.logo_url);

      await loadDeposits(slug, token);

      setLoading(false);
    } catch {
      setMessage("Failed to load dashboard.");
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("child_panel_token");
    window.localStorage.removeItem("child_panel_slug");
    window.localStorage.removeItem("child_panel_customer");

    window.sessionStorage.removeItem("child_panel_token");
    window.sessionStorage.removeItem("child_panel_slug");
    window.sessionStorage.removeItem("child_panel_customer");

    router.replace(`/child/${slug}/login`);
  }

  function resetAddFundsForm() {
    setDepositAmount("");
    setDepositMethod("");
    setReferenceNumber("");
    setProofFile(null);

    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }

    setProofPreview("");
  }

  function openAddFundsModal() {
    setMessage("");
    setAddFundsOpen(true);
  }

  function closeAddFundsModal() {
    if (submittingDeposit) return;
    setAddFundsOpen(false);
    resetAddFundsForm();
  }

  function handleProofFile(file?: File | null) {
    setMessage("");

    if (!file) {
      setProofFile(null);
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofPreview("");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Payment proof must be PNG, JPG, or WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Payment proof must be 5MB or smaller.");
      return;
    }

    if (proofPreview) URL.revokeObjectURL(proofPreview);

    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  }

  async function submitDeposit() {
    if (submittingDeposit) return;

    setMessage("");

    if (!panel || !customer) {
      setMessage("Please login again before submitting add funds.");
      return;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace(`/child/${slug}/login`);
      return;
    }

    const amount = Number(depositAmount || 0);

    if (!Number.isFinite(amount) || amount < 50) {
      setMessage("Minimum add funds amount is ₱50.00.");
      return;
    }

    if (!depositMethod.trim()) {
      setMessage("Please enter or select your payment method.");
      return;
    }

    if (!referenceNumber.trim()) {
      setMessage("Please enter your reference number.");
      return;
    }

    if (!proofFile) {
      setMessage("Please choose your payment proof image first.");
      return;
    }

    setSubmittingDeposit(true);
    setMessage("Uploading payment proof...");

    try {
      const fileExt = proofFile.name.split(".").pop()?.toLowerCase() || "png";
      const fileName = `${panel.id}/${customer.id}/${Date.now()}-${sanitizeFileName(
        proofFile.name,
      )}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("child-panel-deposit-proofs")
        .upload(fileName, proofFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: proofFile.type,
        });

      if (uploadError) {
        setMessage(`Upload failed: ${uploadError.message}`);
        setSubmittingDeposit(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("child-panel-deposit-proofs")
        .getPublicUrl(fileName);

      const proofUrl = publicUrlData?.publicUrl || "";

      if (!proofUrl) {
        setMessage("Upload failed: payment proof URL was not generated.");
        setSubmittingDeposit(false);
        return;
      }

      setMessage("Submitting add funds request...");

      const response = await fetch(
        "/api/child-panel/customers/deposits/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slug,
            token,
            amount,
            method: depositMethod.trim(),
            referenceNumber: referenceNumber.trim(),
            proofUrl,
          }),
        },
      );

      const responseText = await response.text();
      let result: any = null;

      try {
        result = JSON.parse(responseText);
      } catch {
        setMessage(
          `Deposit API returned non-JSON response. Status: ${response.status}. Make sure the API route is deployed.`,
        );
        setSubmittingDeposit(false);
        return;
      }

      if (!response.ok || !result.success) {
        setMessage(getReadableError(result.message));
        setSubmittingDeposit(false);
        return;
      }

      setMessage(result.message || "Add funds request submitted successfully.");
      setSubmittingDeposit(false);
      setAddFundsOpen(false);
      resetAddFundsForm();
      await loadDeposits(slug, token);
      await loadDashboard();
    } catch (error) {
      console.error("CHILD_PANEL_DEPOSIT_SUBMIT_ERROR:", error);
      setMessage("Failed to submit add funds request.");
      setSubmittingDeposit(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview);
    };
  }, [proofPreview]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050716] px-4 text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-8 py-7 text-center shadow-2xl backdrop-blur">
          <div
            className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-white/10"
            style={{ borderTopColor: primaryColor }}
          />

          <p className="mt-4 text-sm font-bold text-white/60">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (!panel || !customer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050716] px-4 text-white">
        <div className="max-w-md rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
          <h1 className="text-3xl font-black">Session Error</h1>
          <p className="mt-3 text-sm font-semibold text-white/55">
            {message || "Please login again."}
          </p>

          <Link
            href={`/child/${slug}/login`}
            className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950"
          >
            Login Again
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050716] text-white">
      <div
        className="absolute inset-0 opacity-95"
        style={{
          background: `
            radial-gradient(circle at 16% 10%, ${primaryColor}32, transparent 28%),
            radial-gradient(circle at 90% 18%, ${primaryColor}25, transparent 26%),
            radial-gradient(circle at 55% 95%, ${primaryColor}26, transparent 32%),
            linear-gradient(135deg, #050716 0%, #090b1f 45%, #060815 100%)
          `,
        }}
      />

      <div className="absolute left-[-16%] top-[34%] h-[370px] w-[140%] rotate-[-7deg] opacity-55 blur-[1px]">
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${primaryColor}18 22%, ${primaryColor}75 48%, #7c3aed62 66%, transparent 100%)`,
            clipPath:
              "polygon(0 38%, 18% 26%, 37% 44%, 52% 33%, 72% 48%, 100% 24%, 100% 56%, 76% 76%, 53% 59%, 34% 73%, 16% 53%, 0 66%)",
          }}
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-15" />

      <div className="relative flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/20 p-5 backdrop-blur-xl lg:block">
          <div className="flex items-center gap-3">
            {panel.logo_url ? (
              <img
                src={panel.logo_url}
                alt={panel.panel_name}
                className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black"
                style={{
                  backgroundColor: primaryColor,
                  boxShadow: getAccentShadow(primaryColor),
                }}
              >
                {panel.panel_name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-lg font-black">{panel.panel_name}</p>
              <p className="truncate text-xs font-bold text-white/40">
                Customer Dashboard
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            <SidebarItem
              icon={Home}
              label="Dashboard"
              active
              primaryColor={primaryColor}
            />
            <SidebarItem
              icon={Plus}
              label="New Order"
              primaryColor={primaryColor}
            />
            <SidebarItem
              icon={ShoppingCart}
              label="Orders"
              primaryColor={primaryColor}
            />
            <SidebarItem
              icon={CreditCard}
              label="Add Funds"
              primaryColor={primaryColor}
              onClick={openAddFundsModal}
            />
            <SidebarItem
              icon={Wallet}
              label="Transactions"
              primaryColor={primaryColor}
            />
            <SidebarItem
              icon={Settings}
              label="Settings"
              primaryColor={primaryColor}
            />
          </nav>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
              Wallet Balance
            </p>

            <h3 className="mt-2 text-3xl font-black">
              {formatMoney(customer.balance)}
            </h3>

            <button
              type="button"
              onClick={openAddFundsModal}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                boxShadow: getAccentShadow(primaryColor),
              }}
            >
              <Plus size={17} />
              Add Funds
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[80] bg-black/70 p-4 backdrop-blur lg:hidden">
            <div className="h-full max-w-sm rounded-[32px] border border-white/10 bg-[#080a18] p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {panel.logo_url ? (
                    <img
                      src={panel.logo_url}
                      alt={panel.panel_name}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl font-black"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {panel.panel_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-black">{panel.panel_name}</p>
                    <p className="text-xs font-bold text-white/40">Menu</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-8 space-y-2">
                <SidebarItem
                  icon={Home}
                  label="Dashboard"
                  active
                  primaryColor={primaryColor}
                />
                <SidebarItem
                  icon={Plus}
                  label="New Order"
                  primaryColor={primaryColor}
                />
                <SidebarItem
                  icon={ShoppingCart}
                  label="Orders"
                  primaryColor={primaryColor}
                />
                <SidebarItem
                  icon={CreditCard}
                  label="Add Funds"
                  primaryColor={primaryColor}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAddFundsModal();
                  }}
                />
                <SidebarItem
                  icon={Settings}
                  label="Settings"
                  primaryColor={primaryColor}
                />
                <SidebarItem
                  icon={LogOut}
                  label="Logout"
                  primaryColor={primaryColor}
                  onClick={logout}
                />
              </nav>
            </div>
          </div>
        )}

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050716]/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 lg:hidden"
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                    Welcome back
                  </p>
                  <h1 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">
                    {displayName}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadDashboard}
                  className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:bg-white/[0.08] sm:flex"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>

                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75"
                >
                  <Bell size={18} />
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="hidden h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:bg-white/[0.08] md:flex"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
            {message && (
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 px-5 py-4 text-sm font-bold text-blue-100">
                {message}
              </div>
            )}

            <div className="rounded-[34px] border border-white/10 bg-white/[0.05] p-6 shadow-2xl backdrop-blur">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
                <div className="min-w-0">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                    style={{
                      borderColor: `${primaryColor}55`,
                      backgroundColor: `${primaryColor}12`,
                    }}
                  >
                    <Sparkles size={15} style={{ color: primaryColor }} />
                    Customer Dashboard
                  </div>

                  <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    Manage your social media growth in one place.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/55">
                    Add funds, place new orders, and track your progress from a
                    clean dashboard built for fast ordering.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black text-white transition"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                        boxShadow: getAccentShadow(primaryColor),
                      }}
                    >
                      <Plus size={18} />
                      New Order
                    </button>

                    <button
                      type="button"
                      onClick={openAddFundsModal}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-black text-white/75 transition hover:bg-white/[0.08]"
                    >
                      <Wallet size={18} />
                      Add Funds
                    </button>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                    Available Balance
                  </p>

                  <h3 className="mt-2 text-4xl font-black">
                    {formatMoney(customer.balance)}
                  </h3>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: "35%",
                        background: `linear-gradient(90deg, ${primaryColor}, #7c3aed)`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-white/45">
                    Submit add funds and wait for approval from the panel owner.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Wallet Balance"
                value={formatMoney(customer.balance)}
                subtitle="Available funds"
                icon={Wallet}
                primaryColor={primaryColor}
              />

              <StatCard
                title="Total Orders"
                value="0"
                subtitle="Coming in orders phase"
                icon={ShoppingCart}
                primaryColor={primaryColor}
              />

              <StatCard
                title="Active Orders"
                value="0"
                subtitle="Pending / processing"
                icon={BarChart3}
                primaryColor={primaryColor}
              />

              <StatCard
                title="Completed"
                value="0"
                subtitle="Completed orders"
                icon={CheckCircle2}
                primaryColor={primaryColor}
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-xl font-black">Recent Add Funds</h3>
                  <p className="mt-1 text-sm font-semibold text-white/45">
                    Track your pending, approved, and rejected deposit requests.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadDeposits()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08]"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>

              <div className="p-5">
                {loadingDeposits ? (
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-8 text-center">
                    <Loader2 className="mx-auto animate-spin text-white/50" size={28} />
                    <p className="mt-3 text-sm font-bold text-white/45">
                      Loading deposit history...
                    </p>
                  </div>
                ) : deposits.length <= 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/20 p-8 text-center">
                    <div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl"
                      style={{
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }}
                    >
                      <Wallet size={25} />
                    </div>
                    <h4 className="mt-4 text-lg font-black">No deposits yet</h4>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/45">
                      Your add funds requests will appear here after you submit one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deposits.slice(0, 5).map((deposit) => (
                      <div
                        key={deposit.id}
                        className="rounded-[22px] border border-white/10 bg-black/20 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-black text-white">
                                {formatMoney(deposit.amount)}
                              </p>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getDepositStatusStyle(
                                  deposit.status,
                                )}`}
                              >
                                {getDepositStatusLabel(deposit.status)}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-sm font-semibold text-white/50">
                              {deposit.method || "Payment Method"} · Ref: {deposit.reference_number || "—"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-white/35">
                              {formatDateTime(deposit.created_at)}
                            </p>
                            {deposit.reject_reason && (
                              <p className="mt-2 rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200">
                                Reason: {deposit.reject_reason}
                              </p>
                            )}
                          </div>

                          {deposit.proof_url && (
                            <a
                              href={deposit.proof_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-white/70 transition hover:bg-white/[0.08]"
                            >
                              <FileImage size={15} />
                              Proof
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.05] shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
                  <div className="min-w-0">
                    <h3 className="text-xl font-black">Recent Orders</h3>
                    <p className="mt-1 text-sm font-semibold text-white/45">
                      Your latest orders will appear here.
                    </p>
                  </div>

                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: `${primaryColor}18`,
                      color: primaryColor,
                    }}
                  >
                    <Package size={20} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4">
                    <Search size={17} className="text-white/30" />
                    <input
                      placeholder="Search orders..."
                      className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/25"
                    />
                  </div>

                  <div className="mt-5 rounded-[24px] border border-dashed border-white/10 bg-black/20 p-10 text-center">
                    <div
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
                      style={{
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }}
                    >
                      <ShoppingCart size={28} />
                    </div>

                    <h4 className="mt-5 text-lg font-black">No orders yet</h4>

                    <p className="mt-2 text-sm font-semibold leading-6 text-white/45">
                      Once New Order is connected, customers can place orders
                      directly from this dashboard.
                    </p>

                    <button
                      type="button"
                      className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                        boxShadow: getAccentShadow(primaryColor),
                      }}
                    >
                      <Plus size={17} />
                      Create First Order
                    </button>
                  </div>
                </div>
              </div>

              <aside className="space-y-5">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }}
                    >
                      <User size={22} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black">
                        {displayName}
                      </h3>
                      <p className="truncate text-sm font-semibold text-white/45">
                        @{customer.username || "customer"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white/45">Email</span>
                      <span className="min-w-0 truncate text-right font-black">
                        {customer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white/45">Status</span>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-black"
                        style={{
                          backgroundColor: `${primaryColor}18`,
                          color: primaryColor,
                        }}
                      >
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white/45">Joined</span>
                      <span className="font-black">
                        {new Date(customer.created_at).toLocaleDateString(
                          "en-PH",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur">
                  <h3 className="text-lg font-black">Quick Actions</h3>

                  <div className="mt-5 grid gap-3">
                    <button className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-black text-white/75 transition hover:bg-white/[0.08]">
                      New Order
                      <Plus size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={openAddFundsModal}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-black text-white/75 transition hover:bg-white/[0.08]"
                    >
                      Add Funds
                      <Wallet size={17} />
                    </button>

                    <button className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-black text-white/75 transition hover:bg-white/[0.08]">
                      View Orders
                      <ShoppingCart size={17} />
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </div>

      {addFundsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-5 lg:items-center">
          <div className="my-4 w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-[#080a18] shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                  Wallet
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  Add Funds
                </h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-white/50">
                  Submit your payment details and proof. Your balance will update
                  after approval.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddFundsModal}
                disabled={submittingDeposit}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                  Current Balance
                </p>
                <h4 className="mt-2 text-3xl font-black text-white">
                  {formatMoney(customer.balance)}
                </h4>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-white/80">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="50"
                    value={depositAmount}
                    onChange={(event) => setDepositAmount(event.target.value)}
                    placeholder="Minimum ₱50"
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-white/80">
                    Payment Method
                  </label>
                  <input
                    value={depositMethod}
                    onChange={(event) => setDepositMethod(event.target.value)}
                    placeholder="GCash, Maya, Bank, Crypto..."
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-white/80">
                  Reference Number
                </label>
                <input
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  placeholder="Enter transaction/reference number"
                  className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-white/80">
                  Payment Proof
                </label>

                <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.035] p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {proofPreview ? (
                        <img
                          src={proofPreview}
                          alt="Payment proof preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileImage size={30} className="text-white/35" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-white">
                        Upload payment screenshot
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-white/45">
                        Accepted: PNG, JPG, WEBP. Maximum file size: 5MB.
                      </p>

                      <label
                        className="mt-4 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                          boxShadow: getAccentShadow(primaryColor),
                        }}
                      >
                        <Upload size={17} />
                        {proofFile ? "Change Proof" : "Choose Proof"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            handleProofFile(file);
                            event.target.value = "";
                          }}
                          className="hidden"
                        />
                      </label>

                      {proofFile && (
                        <p className="mt-3 break-all text-xs font-bold text-white/45">
                          Selected: {proofFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold leading-6 text-white/55">
                The image will upload when you click Submit Request. Please do
                not close this modal while the request is submitting.
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAddFundsModal}
                  disabled={submittingDeposit}
                  className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:bg-white/[0.08] disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitDeposit}
                  disabled={submittingDeposit}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
                    boxShadow: getAccentShadow(primaryColor),
                  }}
                >
                  {submittingDeposit ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Wallet size={17} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import {
  BarChart3,
  Bell,
  CheckCircle2,
  CreditCard,
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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryColor = panel?.primary_color || "#ff4f8b";

  const displayName = useMemo(() => {
    if (!customer) return "Customer";

    const fullName = `${customer.firstname || ""} ${
      customer.lastname || ""
    }`.trim();

    return fullName || customer.username || "Customer";
  }, [customer]);

  function getStoredToken() {
    const localToken = window.localStorage.getItem("child_panel_token");
    const localSlug = window.localStorage.getItem("child_panel_slug");

    if (localToken && localSlug === slug) return localToken;

    const sessionToken = window.sessionStorage.getItem("child_panel_token");
    const sessionSlug = window.sessionStorage.getItem("child_panel_slug");

    if (sessionToken && sessionSlug === slug) return sessionToken;

    return "";
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

  useEffect(() => {
    loadDashboard();
  }, [slug]);

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
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-200">
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
                    Wallet system will be connected in the next phase.
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

                    <h4 className="mt-5 text-lg font-black">
                      No orders yet
                    </h4>

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
                      <span className="font-semibold text-white/45">
                        Email
                      </span>
                      <span className="min-w-0 truncate text-right font-black">
                        {customer.email}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="font-semibold text-white/45">
                        Status
                      </span>
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
                      <span className="font-semibold text-white/45">
                        Joined
                      </span>
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

                    <button className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left text-sm font-black text-white/75 transition hover:bg-white/[0.08]">
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
    </main>
  );
}
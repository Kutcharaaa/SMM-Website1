import { createClient } from "@supabase/supabase-js";
import {
  CheckCircle2,
  Globe,
  Headphones,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
  created_at: string;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getButtonStyle(color: string) {
  return {
    backgroundColor: color,
    boxShadow: `0 18px 45px ${color}35`,
  };
}

export default async function ChildPanelPublicPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: panel, error } = await supabase
    .from("child_panels")
    .select("*")
    .eq("panel_slug", slug)
    .maybeSingle();

  if (error || !panel) {
    notFound();
  }

  const childPanel = panel as ChildPanel;
  const primaryColor = childPanel.primary_color || "#2563eb";
  const isActive = String(childPanel.status || "").toLowerCase() === "active";

  if (!isActive) {
    return (
      <main className="min-h-screen bg-[#f6f9fc] px-4 py-10 text-slate-950">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600">
              <Lock size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950">
              Panel Not Available Yet
            </h1>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
              This child panel is currently pending approval, suspended, or not
              active. Please contact the panel owner or Ascend Service support.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc] text-slate-950">
      <section
        className="relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, #111827 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.16),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {childPanel.logo_url ? (
                <img
                  src={childPanel.logo_url}
                  alt={childPanel.panel_name}
                  className="h-12 w-12 shrink-0 rounded-2xl bg-white object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-xl font-black text-white ring-1 ring-white/20">
                  {childPanel.panel_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="truncate text-lg font-black text-white sm:text-xl">
                  {childPanel.panel_name}
                </h1>

                <p className="truncate text-xs font-semibold text-white/75">
                  Powered by Ascend Service
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <Link
                href={`/child/${childPanel.panel_slug}/login`}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/15"
              >
                Login
              </Link>

              <Link
                href={`/child/${childPanel.panel_slug}/register`}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                Register
              </Link>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1fr_420px] lg:items-center lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white ring-1 ring-white/20">
                <Sparkles size={15} />
                Social Media Growth Panel
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Boost your social presence with{" "}
                <span className="text-white/80">{childPanel.panel_name}</span>
              </h2>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/78">
                Order followers, likes, views, subscribers, comments, and more
                from a reseller panel powered by Ascend Service.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/child/${childPanel.panel_slug}/register`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-slate-950 shadow-xl shadow-black/10 transition hover:bg-slate-100"
                >
                  Create Account
                  <CheckCircle2 size={18} />
                </Link>

                <Link
                  href={`/child/${childPanel.panel_slug}/login`}
                  className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-7 py-4 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/15"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] bg-white/12 p-4 ring-1 ring-white/20 backdrop-blur-xl">
              <div className="rounded-[28px] bg-white p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  {childPanel.logo_url ? (
                    <img
                      src={childPanel.logo_url}
                      alt={childPanel.panel_name}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {childPanel.panel_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-black text-slate-950">
                      {childPanel.panel_name}
                    </h3>

                    <p className="text-sm font-semibold text-slate-500">
                      Active Child Panel
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {[
                    ["Fast ordering", "Place orders in a few clicks"],
                    ["Live tracking", "Monitor status and progress"],
                    ["Wallet system", "Add funds and order anytime"],
                  ].map(([title, text]) => (
                    <div
                      key={title}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <CheckCircle2 size={18} />
                      </div>

                      <div>
                        <p className="font-black text-slate-900">{title}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/child/${childPanel.panel_slug}/register`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-white transition"
                  style={getButtonStyle(primaryColor)}
                >
                  Start Ordering
                  <Store size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Package size={24} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              Many Services
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Access social media growth services across multiple platforms.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <TrendingUp size={24} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              Easy Growth
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Simple panel experience for followers, likes, views, and more.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <ShieldCheck size={24} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              Secure Panel
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Powered by Ascend Service infrastructure and ordering system.
            </p>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <Headphones size={24} />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-950">
              Support
            </h3>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {childPanel.support_email
                ? `Contact support at ${childPanel.support_email}.`
                : "Contact the panel owner for customer support."}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
                <Globe size={14} />
                Child Panel
              </div>

              <h3 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
                Ready to start ordering?
              </h3>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Create an account or login to access the customer dashboard for
                this child panel.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/child/${childPanel.panel_slug}/login`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-800 transition hover:bg-slate-50"
              >
                Login
              </Link>

              <Link
                href={`/child/${childPanel.panel_slug}/register`}
                className="inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-black text-white transition"
                style={getButtonStyle(primaryColor)}
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
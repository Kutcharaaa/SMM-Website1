import { supabaseAdmin } from "@/lib/supabase-admin";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe,
  Headphones,
  Lock,
  MessageCircle,
  Package,
  PlayCircle,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  ThumbsUp,
  TrendingUp,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

type ServiceCard = {
  title: string;
  text: string;
  icon: LucideIcon;
  items: string[];
};

function safeColor(value?: string | null) {
  const clean = String(value || "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
    return clean;
  }

  return "#ff5a7a";
}

function hexToRgb(hex: string) {
  const clean = safeColor(hex).replace("#", "");

  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function colorWithOpacity(hex: string, opacity: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getPanelUrl(slug: string) {
  return `/child/${slug}`;
}

function getRegisterUrl(slug: string) {
  return `/child/${slug}/register`;
}

function getLoginUrl(slug: string) {
  return `/child/${slug}/login`;
}

function getDynamicStyles(primaryColor: string) {
  const brand = safeColor(primaryColor);

  return {
    "--brand": brand,
    "--brand-10": colorWithOpacity(brand, 0.1),
    "--brand-16": colorWithOpacity(brand, 0.16),
    "--brand-22": colorWithOpacity(brand, 0.22),
    "--brand-35": colorWithOpacity(brand, 0.35),
    "--brand-55": colorWithOpacity(brand, 0.55),
    "--brand-70": colorWithOpacity(brand, 0.7),
  } as CSSProperties;
}

async function getPanelBySlug(slug: string) {
  const { data: panel, error } = await supabaseAdmin
    .from("child_panels")
    .select("*")
    .eq("panel_slug", slug)
    .maybeSingle();

  if (error || !panel) return null;

  return panel as ChildPanel;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const panel = await getPanelBySlug(slug);

  if (!panel) {
    return {
      title: "Growth Platform",
      description: "Social media growth platform.",
    };
  }

  const title = panel.panel_name || "Growth Platform";
  const description = `${title} - Social media growth services for followers, likes, views, subscribers, and engagement.`;

  return {
    title,
    description,
    icons: panel.logo_url
      ? {
          icon: panel.logo_url,
          shortcut: panel.logo_url,
          apple: panel.logo_url,
        }
      : undefined,
    openGraph: {
      title,
      description,
      images: panel.logo_url ? [panel.logo_url] : [],
    },
  };
}

function LogoMark({
  panelName,
  logoUrl,
  primaryColor,
  size = "normal",
}: {
  panelName: string;
  logoUrl?: string | null;
  primaryColor: string;
  size?: "normal" | "large";
}) {
  const boxSize = size === "large" ? "h-16 w-16 rounded-[22px]" : "h-12 w-12 rounded-2xl";
  const textSize = size === "large" ? "text-2xl" : "text-xl";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={panelName}
        className={`${boxSize} shrink-0 bg-white object-cover shadow-2xl shadow-black/20 ring-1 ring-white/15`}
      />
    );
  }

  return (
    <div
      className={`${boxSize} flex shrink-0 items-center justify-center ${textSize} font-black text-white shadow-2xl shadow-black/20 ring-1 ring-white/15`}
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`,
        boxShadow: `0 18px 50px ${colorWithOpacity(primaryColor, 0.35)}`,
      }}
    >
      {panelName.charAt(0).toUpperCase()}
    </div>
  );
}

function AccentText({ children, primaryColor }: { children: string; primaryColor: string }) {
  return (
    <span
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${primaryColor}, #ff4ecd, #f97316)`,
      }}
    >
      {children}
    </span>
  );
}

function GradientButton({
  href,
  children,
  primaryColor,
}: {
  href: string;
  children: React.ReactNode;
  primaryColor: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, #ec4899, #f97316)`,
        boxShadow: `0 20px 55px ${colorWithOpacity(primaryColor, 0.38)}`,
      }}
    >
      {children}
      <ArrowRight size={17} className="transition group-hover:translate-x-1" />
    </Link>
  );
}

function GhostButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/[0.08]"
    >
      {children}
    </Link>
  );
}

function StatPill({
  icon: Icon,
  title,
  text,
  primaryColor,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  primaryColor: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: colorWithOpacity(primaryColor, 0.18), color: primaryColor }}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs font-black text-white">{title}</p>
        <p className="truncate text-xs font-semibold text-white/55">{text}</p>
      </div>
    </div>
  );
}

function DashboardPreview({
  panelName,
  logoUrl,
  primaryColor,
}: {
  panelName: string;
  logoUrl?: string | null;
  primaryColor: string;
}) {
  const orders = [
    ["Premium Followers", "5,000", "Completed"],
    ["Target Engagement", "2,500", "Processing"],
    ["Profile Visits", "12.4K", "Completed"],
  ];

  return (
    <div
      className="relative rounded-[34px] border border-white/12 bg-white/[0.05] p-3 shadow-2xl backdrop-blur-2xl"
      style={{
        boxShadow: `0 0 0 1px ${colorWithOpacity(primaryColor, 0.14)}, 0 40px 140px ${colorWithOpacity(primaryColor, 0.22)}`,
      }}
    >
      <div
        className="absolute -inset-1 -z-10 rounded-[38px] opacity-60 blur-2xl"
        style={{
          background: `linear-gradient(135deg, ${colorWithOpacity(primaryColor, 0.45)}, rgba(236,72,153,0.28), rgba(249,115,22,0.22))`,
        }}
      />

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#080b18]/92">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark
              panelName={panelName}
              logoUrl={logoUrl}
              primaryColor={primaryColor}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">{panelName}</p>
              <p className="text-xs font-semibold text-white/45">Growth dashboard</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase text-white/40">Balance</p>
            <p className="text-sm font-black text-white">$245.80</p>
          </div>
        </div>

        <div className="grid min-h-[430px] lg:grid-cols-[160px_1fr]">
          <aside className="hidden border-r border-white/10 p-4 lg:block">
            {["Dashboard", "New Order", "Orders", "Services", "Add Funds", "Support"].map(
              (item, index) => (
                <div
                  key={item}
                  className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold ${
                    index === 0 ? "text-white" : "text-white/50"
                  }`}
                  style={{
                    backgroundColor:
                      index === 0 ? colorWithOpacity(primaryColor, 0.22) : "transparent",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: index === 0 ? primaryColor : "rgba(255,255,255,0.25)" }}
                  />
                  {item}
                </div>
              ),
            )}
          </aside>

          <div className="min-w-0 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                  Overview
                </p>
                <h3 className="mt-1 text-2xl font-black text-white">
                  Welcome back 👋
                </h3>
              </div>

              <div
                className="rounded-2xl px-4 py-2 text-xs font-black text-white"
                style={{ backgroundColor: colorWithOpacity(primaryColor, 0.18) }}
              >
                Live
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ["Followers", "12.4K", "+28.5%"],
                ["Engagement", "7.8%", "+18.3%"],
                ["Visits", "25.6K", "+35.2%"],
                ["Orders", "1.2K", "+20.4%"],
              ].map(([label, value, change]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-xs font-semibold text-white/45">{label}</p>
                  <p className="mt-2 text-xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs font-black" style={{ color: primaryColor }}>
                    {change}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_210px]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-sm font-black text-white">Growth Overview</p>
                  <span className="rounded-xl bg-white/5 px-3 py-1 text-xs font-bold text-white/50">
                    This Month
                  </span>
                </div>

                <div className="flex h-44 items-end gap-2">
                  {[32, 44, 50, 42, 65, 58, 72, 66, 85, 78, 94, 100].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex flex-1 items-end rounded-full bg-white/[0.04]"
                      >
                        <div
                          className="w-full rounded-full"
                          style={{
                            height: `${height}%`,
                            background: `linear-gradient(180deg, ${primaryColor}, ${colorWithOpacity(primaryColor, 0.2)})`,
                          }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="mb-4 text-sm font-black text-white">Recent Orders</p>

                <div className="space-y-3">
                  {orders.map(([service, amount, status]) => (
                    <div key={service} className="rounded-2xl bg-white/[0.04] p-3">
                      <p className="truncate text-xs font-black text-white">{service}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-white/45">
                          {amount}
                        </span>
                        <span
                          className="text-[10px] font-black"
                          style={{
                            color:
                              status === "Completed" ? primaryColor : "#fbbf24",
                          }}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCardItem({
  card,
  primaryColor,
}: {
  card: ServiceCard;
  primaryColor: string;
}) {
  const Icon = card.icon;

  return (
    <div
      className="group rounded-[28px] border border-white/10 bg-white/[0.04] p-6 transition hover:-translate-y-1 hover:bg-white/[0.07]"
      style={{
        boxShadow: `0 18px 70px rgba(0,0,0,0.18)`,
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
        style={{
          background: `linear-gradient(135deg, ${colorWithOpacity(primaryColor, 0.85)}, ${colorWithOpacity("#ec4899", 0.8)})`,
          boxShadow: `0 20px 50px ${colorWithOpacity(primaryColor, 0.25)}`,
        }}
      >
        <Icon size={26} />
      </div>

      <h3 className="mt-5 text-xl font-black text-white">{card.title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/55">
        {card.text}
      </p>

      <div className="mt-5 space-y-2">
        {card.items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/60">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            {item}
          </div>
        ))}
      </div>

      <div
        className="mt-6 inline-flex items-center gap-2 text-sm font-black transition group-hover:translate-x-1"
        style={{ color: primaryColor }}
      >
        Explore
        <ArrowRight size={15} />
      </div>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  text,
  primaryColor,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  primaryColor: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
        style={{
          color: primaryColor,
          backgroundColor: colorWithOpacity(primaryColor, 0.12),
          boxShadow: `0 18px 55px ${colorWithOpacity(primaryColor, 0.12)}`,
        }}
      >
        <Icon size={23} />
      </div>

      <div className="min-w-0">
        <h4 className="text-base font-black text-white">{title}</h4>
        <p className="mt-1 text-sm font-semibold leading-6 text-white/52">
          {text}
        </p>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon: Icon,
  title,
  text,
  primaryColor,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  text: string;
  primaryColor: string;
}) {
  return (
    <div className="relative rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <div
        className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, #ec4899)`,
          boxShadow: `0 16px 40px ${colorWithOpacity(primaryColor, 0.28)}`,
        }}
      >
        {number}
      </div>

      <div
        className="mt-5 flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{
          color: primaryColor,
          backgroundColor: colorWithOpacity(primaryColor, 0.1),
        }}
      >
        <Icon size={30} />
      </div>

      <h4 className="mt-5 text-lg font-black text-white">{title}</h4>
      <p className="mt-2 text-sm font-semibold leading-6 text-white/55">{text}</p>
    </div>
  );
}

export default async function ChildPanelPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const childPanel = await getPanelBySlug(slug);

  if (!childPanel) {
    notFound();
  }

  const primaryColor = safeColor(childPanel.primary_color);
  const isActive = String(childPanel.status || "").toLowerCase() === "active";

  if (!isActive) {
    return (
      <main className="min-h-screen bg-[#080b18] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{
                color: primaryColor,
                backgroundColor: colorWithOpacity(primaryColor, 0.12),
              }}
            >
              <Lock size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight">
              Website Not Available Yet
            </h1>

            <p className="mt-3 text-sm font-semibold leading-6 text-white/55">
              This website is currently pending approval, suspended, or not active.
              Please contact the site owner for assistance.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              Go Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const services: ServiceCard[] = [
    {
      title: "Instagram Growth",
      text: "Build stronger social proof and reach more people.",
      icon: Star,
      items: ["Followers", "Likes", "Story views"],
    },
    {
      title: "TikTok Boost",
      text: "Grow short-form content reach with fast delivery.",
      icon: Zap,
      items: ["Views", "Likes", "Shares"],
    },
    {
      title: "YouTube Promotion",
      text: "Support videos, channels, and watch-time growth.",
      icon: PlayCircle,
      items: ["Subscribers", "Views", "Watch time"],
    },
    {
      title: "Engagement Services",
      text: "Increase interaction and social activity.",
      icon: MessageCircle,
      items: ["Comments", "Reactions", "Post engagement"],
    },
    {
      title: "Audience Building",
      text: "Reach new audiences across different platforms.",
      icon: Users,
      items: ["Followers", "Members", "Community growth"],
    },
    {
      title: "More Platforms",
      text: "Access multiple social media growth categories.",
      icon: Globe,
      items: ["Telegram", "Spotify", "Reviews"],
    },
  ];

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#060816] text-white"
      style={getDynamicStyles(primaryColor)}
    >
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(236,72,153,0.24),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(124,58,237,0.30),transparent_30%),radial-gradient(circle_at_85%_55%,rgba(249,115,22,0.18),transparent_25%)]" />

        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(circle at 20% 45%, ${colorWithOpacity(primaryColor, 0.32)}, transparent 28%), linear-gradient(135deg, rgba(6,8,22,0.92), rgba(9,12,31,0.72), rgba(6,8,22,0.96))`,
          }}
        />

        <div className="absolute left-[-10%] top-[28%] h-72 w-[120%] rotate-[-7deg] blur-2xl">
          <div
            className="h-20 rounded-full opacity-80"
            style={{
              background: `linear-gradient(90deg, transparent, ${colorWithOpacity(primaryColor, 0.72)}, rgba(236,72,153,0.72), rgba(249,115,22,0.58), transparent)`,
            }}
          />
        </div>

        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.25)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.25)_1px,transparent_1px)] [background-size:72px_72px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Link href={getPanelUrl(childPanel.panel_slug)} className="flex min-w-0 items-center gap-3">
              <LogoMark
                panelName={childPanel.panel_name}
                logoUrl={childPanel.logo_url}
                primaryColor={primaryColor}
              />

              <h1 className="truncate text-xl font-black text-white sm:text-2xl">
                {childPanel.panel_name}
              </h1>
            </Link>

            <div className="hidden items-center gap-8 lg:flex">
              {["Home", "Services", "How It Works", "Features", "Contact"].map(
                (item, index) => (
                  <a
                    key={item}
                    href={
                      index === 0
                        ? "#home"
                        : index === 1
                          ? "#services"
                          : index === 2
                            ? "#how-it-works"
                            : index === 3
                              ? "#features"
                              : "#contact"
                    }
                    className="text-sm font-bold text-white/65 transition hover:text-white"
                    style={index === 0 ? { color: primaryColor } : undefined}
                  >
                    {item}
                  </a>
                ),
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={getLoginUrl(childPanel.panel_slug)}
                className="hidden rounded-2xl border border-white/14 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.08] sm:inline-flex"
              >
                Login
              </Link>

              <Link
                href={getRegisterUrl(childPanel.panel_slug)}
                className="rounded-2xl px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, #ec4899)`,
                  boxShadow: `0 18px 45px ${colorWithOpacity(primaryColor, 0.35)}`,
                }}
              >
                Register
              </Link>
            </div>
          </nav>

          <div
            id="home"
            className="grid gap-12 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(520px,1.1fr)] lg:items-center lg:py-24"
          >
            <div className="min-w-0">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em]"
                style={{
                  color: primaryColor,
                  borderColor: colorWithOpacity(primaryColor, 0.25),
                  backgroundColor: colorWithOpacity(primaryColor, 0.09),
                }}
              >
                <Sparkles size={15} />
                Smart Growth. Real Results.
              </div>

              <h2 className="mt-7 text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl xl:text-7xl">
                Grow Smarter.
                <br />
                <AccentText primaryColor={primaryColor}>
                  Shine Everywhere.
                </AccentText>
              </h2>

              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-white/65 sm:text-lg">
                Build your audience, boost engagement, and manage social growth
                from one fast and reliable dashboard.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <GradientButton
                  href={getRegisterUrl(childPanel.panel_slug)}
                  primaryColor={primaryColor}
                >
                  Start Growing Now
                </GradientButton>

                <GhostButton href="#services">Explore Services</GhostButton>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <StatPill
                  icon={ShieldCheck}
                  title="Secure"
                  text="Protected account system"
                  primaryColor={primaryColor}
                />
                <StatPill
                  icon={Rocket}
                  title="Fast"
                  text="Quick order delivery"
                  primaryColor={primaryColor}
                />
                <StatPill
                  icon={Headphones}
                  title="Support"
                  text="Help when you need it"
                  primaryColor={primaryColor}
                />
              </div>
            </div>

            <DashboardPreview
              panelName={childPanel.panel_name}
              logoUrl={childPanel.logo_url}
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </section>

      <section id="services" className="relative px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_32%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              Platforms We Support
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Complete Growth Solutions for Every Platform
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/55">
              Choose from social growth services built for creators, brands, and
              businesses that want faster online traction.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCardItem
                key={service.title}
                card={service}
                primaryColor={primaryColor}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[34px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p
                className="text-xs font-black uppercase tracking-[0.18em]"
                style={{ color: primaryColor }}
              >
                Why Choose Us
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Growth That’s{" "}
                <AccentText primaryColor={primaryColor}>Smarter & Stronger.</AccentText>
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-white/55">
                A modern growth platform for customers who want simple ordering,
                clear tracking, and reliable service.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FeatureItem
                icon={ThumbsUp}
                title="Real Engagement"
                text="Access services focused on visibility, reach, and engagement."
                primaryColor={primaryColor}
              />

              <FeatureItem
                icon={ShieldCheck}
                title="Safe & Secure"
                text="Clean account experience with protected customer access."
                primaryColor={primaryColor}
              />

              <FeatureItem
                icon={Zap}
                title="Fast Delivery"
                text="Start orders quickly and track progress from your dashboard."
                primaryColor={primaryColor}
              />

              <FeatureItem
                icon={BarChart3}
                title="Progress Tracking"
                text="Monitor your orders and growth activity in one place."
                primaryColor={primaryColor}
              />
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-xs font-black uppercase tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              How It Works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              4 Simple Steps to Accelerate Your Growth
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StepCard
              number="01"
              icon={Users}
              title="Create Account"
              text="Sign up and access your personal growth dashboard."
              primaryColor={primaryColor}
            />

            <StepCard
              number="02"
              icon={Wallet}
              title="Add Funds"
              text="Top up your wallet using the available payment methods."
              primaryColor={primaryColor}
            />

            <StepCard
              number="03"
              icon={ShoppingCart}
              title="Place Order"
              text="Choose a service, enter your details, and confirm."
              primaryColor={primaryColor}
            />

            <StepCard
              number="04"
              icon={TrendingUp}
              title="Track & Grow"
              text="Watch your order progress and enjoy the results."
              primaryColor={primaryColor}
            />
          </div>
        </div>
      </section>

      <section id="contact" className="px-4 pb-16 sm:px-6 lg:px-8">
        <div
          className="mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-white/10 p-1"
          style={{
            background: `linear-gradient(135deg, ${colorWithOpacity(primaryColor, 0.8)}, rgba(236,72,153,0.78), rgba(249,115,22,0.7))`,
            boxShadow: `0 30px 120px ${colorWithOpacity(primaryColor, 0.22)}`,
          }}
        >
          <div className="relative overflow-hidden rounded-[30px] bg-[#0a0d1d] p-8 sm:p-10">
            <div className="absolute inset-0 opacity-70">
              <div
                className="absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full blur-3xl"
                style={{ backgroundColor: colorWithOpacity(primaryColor, 0.32) }}
              />
              <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
            </div>

            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div
                  className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl"
                  style={{
                    color: primaryColor,
                    backgroundColor: colorWithOpacity(primaryColor, 0.12),
                  }}
                >
                  <Rocket size={32} />
                </div>

                <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Ready to Grow Your Influence?
                </h2>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
                  Join today and start building your online presence with a
                  simple and powerful social growth dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <GradientButton
                  href={getRegisterUrl(childPanel.panel_slug)}
                  primaryColor={primaryColor}
                >
                  Start Your Growth Journey
                </GradientButton>

                <GhostButton href={getLoginUrl(childPanel.panel_slug)}>Login</GhostButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto_auto]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <LogoMark
                panelName={childPanel.panel_name}
                logoUrl={childPanel.logo_url}
                primaryColor={primaryColor}
              />

              <h3 className="text-xl font-black text-white">
                {childPanel.panel_name}
              </h3>
            </div>

            <p className="mt-4 text-sm font-semibold leading-7 text-white/50">
              Smart social media growth services for creators, brands, and
              businesses.
            </p>
          </div>

          <div>
            <p className="font-black text-white">Quick Links</p>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-white/50">
              <a href="#services" className="transition hover:text-white">
                Services
              </a>
              <a href="#how-it-works" className="transition hover:text-white">
                How It Works
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
            </div>
          </div>

          <div>
            <p className="font-black text-white">Support</p>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-white/50">
              <span>{childPanel.support_email || "Contact support inside your account"}</span>
              <span>We reply as soon as possible</span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 pt-6 text-sm font-semibold text-white/40">
          © {new Date().getFullYear()} {childPanel.panel_name}. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

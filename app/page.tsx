import Link from "next/link";
import PublicHeroActions from "@/components/PublicHeroActions";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Headphones,
  Lock,
  Menu,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const platformCards = [
  {
    name: "Instagram",
    services: "Followers, Likes, Views",
    color: "from-pink-500 to-orange-400",
  },
  {
    name: "TikTok",
    services: "Followers, Likes, Views",
    color: "from-slate-900 to-slate-700",
  },
  {
    name: "YouTube",
    services: "Subscribers, Views, Watch Time",
    color: "from-red-500 to-rose-500",
  },
  {
    name: "Telegram",
    services: "Members, Views, Reactions",
    color: "from-sky-500 to-blue-500",
  },
  {
    name: "Facebook",
    services: "Followers, Likes, Engagement",
    color: "from-blue-600 to-indigo-500",
  },
  {
    name: "Spotify",
    services: "Followers, Plays, Listeners",
    color: "from-green-500 to-emerald-500",
  },
];

const featureCards = [
  {
    title: "Instant Delivery",
    text: "Orders start fast with automated processing.",
    icon: Zap,
  },
  {
    title: "Secure Payments",
    text: "Wallet, deposits, and transactions are protected.",
    icon: ShieldCheck,
  },
  {
    title: "Real Tracking",
    text: "Track your orders directly from your dashboard.",
    icon: BarChart3,
  },
  {
    title: "24/7 Support",
    text: "Support tickets and help are always available.",
    icon: Headphones,
  },
];

const steps = [
  {
    title: "Choose platform",
    text: "Pick Instagram, TikTok, YouTube, Telegram, Facebook, and more.",
    icon: Globe2,
  },
  {
    title: "Select service",
    text: "Choose the service, quantity, and link you want to boost.",
    icon: Search,
  },
  {
    title: "Submit order",
    text: "Pay using your wallet and monitor your order status.",
    icon: Rocket,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf8ff] text-slate-950">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/home-assets/home-bg.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-white/20" />
        </div>

        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-purple-300/40 blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-160px] h-[520px] w-[520px] rounded-full bg-pink-300/40 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <header className="flex items-center justify-between rounded-[2rem] border border-white/80 bg-white/80 px-5 py-4 shadow-xl shadow-purple-950/5 backdrop-blur-2xl">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <nav className="hidden items-center gap-2 rounded-2xl bg-slate-50/80 p-1 lg:flex">
              {[
                ["Home", "/"],
                ["Services", "/services"],
                ["Reseller", "/reseller"],
                ["Affiliates", "/affiliates"],
                ["API", "/api"],
                ["Support", "/support"],
              ].map(([label, href], index) => (
                <Link
                  key={label}
                  href={href}
                  className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
                    index === 0
                      ? "bg-white text-purple-700 shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-purple-700"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/login"
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-purple-200 hover:text-purple-700"
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-purple-600/20 transition hover:scale-[1.02]"
              >
                Dashboard
                <ArrowRight size={17} />
              </Link>
            </div>

            <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 lg:hidden">
              <Menu size={22} />
            </button>
          </header>

          <div className="grid min-h-[calc(100vh-110px)] items-center gap-12 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/80 px-4 py-2 text-sm font-black text-purple-700 shadow-sm backdrop-blur-xl">
                <ShieldCheck size={17} />
                Trusted by growing SMM sellers and resellers
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.03] tracking-[-0.05em] text-slate-950 md:text-7xl">
                Boost Your{" "}
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-500 bg-clip-text text-transparent">
                  Social Presence
                </span>{" "}
                Effortlessly.
              </h1>

              <p className="mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                A modern SMM platform built for fast orders, secure wallet
                payments, real-time tracking, resellers, affiliates, and API
                growth.
              </p>

              <div className="mt-8">
                <PublicHeroActions />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div
                      key={item}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-100 to-blue-100 text-sm font-black text-purple-700 shadow-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-950">50K+</p>
                  <p className="text-sm font-bold text-slate-500">
                    Happy customers
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-purple-300/30 blur-3xl" />
              <div className="absolute bottom-8 right-8 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl" />

              <div className="relative rounded-[3rem] border border-white/80 bg-white/55 p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
                <img
                  src="/home-assets/hero-rocket.png"
                  alt="Social media rocket launch"
                  className="mx-auto w-full max-w-[680px] object-contain"
                />

                <div className="absolute left-4 top-6 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-purple-950/10 backdrop-blur-xl sm:left-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">
                        Growth Today
                      </p>
                      <p className="text-xl font-black text-slate-950">
                        +28.4%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-4 rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-purple-950/10 backdrop-blur-xl sm:right-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-400">
                        Orders
                      </p>
                      <p className="text-xl font-black text-slate-950">
                        Processing
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative -mt-4 grid gap-4 rounded-[2rem] border border-white/80 bg-white/80 p-4 shadow-xl shadow-purple-950/5 backdrop-blur-xl md:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[1.5rem] border border-slate-100 bg-white/80 p-5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                    <Icon size={24} />
                  </div>
                  <h3 className="mt-4 text-base font-black text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-5 py-20 lg:px-8">
        <div className="absolute left-[-160px] top-20 h-[340px] w-[340px] rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute right-[-160px] bottom-20 h-[340px] w-[340px] rounded-full bg-purple-100 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">
              <Sparkles size={17} />
              Built for SMM business
            </div>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-[-0.04em] text-slate-950 md:text-5xl">
              Manage orders, wallet, services, and growth in one clean
              dashboard.
            </h2>

            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              Your users get a simple dashboard while admins manage orders,
              services, providers, payments, tickets, and reports from a modern
              panel.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Real-time order tracking and status updates",
                "Wallet-based add funds and transactions",
                "Reseller, affiliates, API, and ticket support ready",
                "Modern UI made for users, sellers, and agencies",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                    <CheckCircle2 size={15} />
                  </div>
                  <p className="font-bold leading-7 text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-1"
            >
              Explore Dashboard
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="relative rounded-[3rem] border border-slate-100 bg-gradient-to-br from-purple-50 to-blue-50 p-4 shadow-2xl shadow-purple-950/10">
            <img
              src="/home-assets/dashboard-preview.png"
              alt="Dashboard preview"
              className="w-full rounded-[2.3rem] object-contain"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fbf8ff] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-purple-700 shadow-sm">
              <Globe2 size={17} />
              Multi-platform services
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
              We support the platforms your customers need.
            </h2>

            <p className="mt-4 text-base font-semibold leading-8 text-slate-600">
              Create a better shopping experience for SMM services across major
              social platforms.
            </p>
          </div>

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[3rem] border border-white/80 bg-white/80 p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-xl">
              <img
                src="/home-assets/platform-icons.png"
                alt="Supported social media platforms"
                className="w-full object-contain"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {platformCards.map((platform) => (
                <Link
                  key={platform.name}
                  href="/services"
                  className="group rounded-[1.7rem] border border-white/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/10"
                >
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${platform.color} shadow-lg shadow-purple-950/10`}
                  />
                  <h3 className="mt-4 text-xl font-black text-slate-950">
                    {platform.name}
                  </h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    {platform.services}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-black text-purple-700">
                    View services
                    <ArrowRight
                      size={16}
                      className="transition group-hover:translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-[3rem] border border-slate-100 bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-8 text-white shadow-2xl shadow-purple-950/20 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-purple-100">
              <Star size={17} />
              Built to grow
            </div>

            <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] md:text-6xl">
              Turn your SMM website into a growth machine.
            </h2>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-purple-100">
              Modern design, simple navigation, clear services, wallet system,
              reseller tools, and a user-friendly dashboard experience.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["50K+", "Happy Users"],
                ["1M+", "Orders Completed"],
                ["24/7", "Support"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-3xl font-black">{value}</p>
                  <p className="mt-1 text-sm font-bold text-purple-100">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-black text-purple-700 transition hover:-translate-y-1"
              >
                Get Started Now
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                View Services
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="/home-assets/trophy-growth.png"
              alt="Growth trophy"
              className="mx-auto w-full max-w-[620px] object-contain"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#fbf8ff] px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.04em] text-slate-950 md:text-5xl">
              Get started in 3 simple steps.
            </h2>
            <p className="mt-4 text-base font-semibold leading-8 text-slate-600">
              A simple UX approach made for new users and repeat buyers.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                      <Icon size={26} />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <img src="/logo.png" alt="Logo" className="h-11 w-auto" />
            <p className="mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">
              A modern SMM platform for services, orders, resellers, affiliates,
              wallet payments, and growth.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Services", "Reseller", "Affiliates", "API", "Support"].map(
              (item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 transition hover:border-purple-200 hover:text-purple-700"
                >
                  {item}
                </Link>
              ),
            )}
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-3 border-t border-slate-200 pt-6 text-sm font-semibold text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 SMM Website. All rights reserved.</p>
          <p>Fast. Secure. Built for social growth.</p>
        </div>
      </footer>
    </main>
  );
}
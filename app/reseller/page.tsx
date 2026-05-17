"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Gem,
  Gift,
  Headphones,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    title: "Earn Points",
    text: "Earn points on every order you place as a reseller.",
    icon: Star,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Unlock Discounts",
    text: "Higher reseller level means better order discounts.",
    icon: Tag,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Convert to Balance",
    text: "Convert reseller points into wallet balance anytime.",
    icon: Wallet,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Child Panel Access",
    text: "Unlock child panel access and manage your clients easily.",
    icon: Users,
    color: "bg-orange-50 text-orange-600",
  },
];

const resellerLevels = [
  {
    name: "New Reseller",
    spend: "₱0.00",
    discount: "0% Discount",
    convert: "100 Points = $1.00",
    icon: Users,
    border: "border-blue-200",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    name: "Active Reseller",
    spend: "₱20,000.00",
    discount: "1% Discount",
    convert: "100 Points = $1.00",
    icon: ShieldCheck,
    border: "border-green-200",
    accent: "bg-green-50 text-green-600",
  },
  {
    name: "Pro Reseller",
    spend: "₱60,000.00",
    discount: "2% Discount",
    convert: "100 Points = $1.25",
    icon: Crown,
    border: "border-purple-200",
    accent: "bg-purple-50 text-purple-600",
  },
  {
    name: "Master Reseller",
    spend: "₱150,000.00",
    discount: "3% Discount",
    convert: "100 Points = $1.50",
    icon: Gift,
    border: "border-orange-200",
    accent: "bg-orange-50 text-orange-600",
  },
  {
    name: "Elite Partner",
    spend: "₱250,000.00",
    discount: "4% Discount",
    convert: "100 Points = $1.75",
    icon: Gem,
    border: "border-red-200",
    accent: "bg-red-50 text-red-600",
  },
  {
    name: "Ascend Partner",
    spend: "₱500,000.00",
    discount: "5% Discount",
    convert: "100 Points = $2.00",
    icon: Trophy,
    border: "border-blue-200",
    accent: "bg-blue-50 text-blue-600",
  },
];

const comparisonRows = [
  {
    feature: "Purchase Discount",
    normal: "0%",
    reseller: "Up to 5%",
  },
  {
    feature: "Earn Points",
    normal: false,
    reseller: true,
  },
  {
    feature: "Convert Points to Balance",
    normal: false,
    reseller: true,
  },
  {
    feature: "Child Panel Access",
    normal: false,
    reseller: true,
  },
  {
    feature: "Higher Profit",
    normal: false,
    reseller: true,
  },
  {
    feature: "Business Growth",
    normal: "Limited",
    reseller: "Unlimited",
  },
];

const stats = [
  {
    label: "Active Resellers",
    value: "10K+",
    icon: Users,
  },
  {
    label: "Orders Completed",
    value: "1M+",
    icon: BarChart3,
  },
  {
    label: "Uptime",
    value: "99.9%",
    icon: ShieldCheck,
  },
  {
    label: "Support",
    value: "24/7",
    icon: Headphones,
  },
];

export default function ResellerPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLoggedIn(Boolean(session?.user));
      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session?.user));
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const primaryHref = loggedIn ? "/dashboard/reseller" : "/register";
  const primaryLabel = loggedIn ? "View Reseller Dashboard" : "Get Started Now";
  const dashboardHref = loggedIn ? "/dashboard/reseller" : "/login";
  const dashboardLabel = loggedIn ? "View Dashboard" : "Login First";

  return (
    <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <PublicNavbar />

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#e8f3ff_0%,transparent_32%),radial-gradient(circle_at_top_right,#dcecff_0%,transparent_30%),linear-gradient(135deg,#ffffff_0%,#f6f9ff_45%,#eef6ff_100%)]">
        <div className="absolute inset-0 opacity-[0.45]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb12_1px,transparent_1px),linear-gradient(to_bottom,#2563eb12_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="absolute -left-28 top-24 h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-[560px] w-[560px] rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black uppercase tracking-wide text-blue-600 shadow-sm">
              <Crown size={17} />
              Reseller Program
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Start Your Own{" "}
              <span className="text-blue-600">SMM Reseller</span> Business
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              Join Ascend Service Reseller Program and unlock exclusive
              discounts, earn points, increase your profit, and grow your
              business with our powerful reseller system.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <Rocket size={20} />
                {checkingSession ? "Loading..." : primaryLabel}
                <ArrowRight size={18} />
              </Link>

              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                <Lock size={20} />
                {checkingSession ? "Loading..." : dashboardLabel}
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
              <MiniBenefit
                icon={Zap}
                title="Instant Access"
                text="Start immediately"
              />

              <MiniBenefit
                icon={ShieldCheck}
                title="Secure & Reliable"
                text="100% Safe"
              />

              <MiniBenefit
                icon={Headphones}
                title="24/7 Support"
                text="Always Here"
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -left-10 top-16 hidden h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/30 lg:flex">
              <Users size={30} />
            </div>

            <div className="absolute -right-6 top-7 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <BarChart3 size={38} />
            </div>

            <div className="absolute -right-2 bottom-16 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Crown size={38} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">
                    Reseller Dashboard
                  </h2>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                    Preview
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <PreviewStat title="Wallet Balance" value="₱5.00" />
                  <PreviewStat title="Total Points" value="12,580" />
                  <PreviewStat title="Total Orders" value="1,256" />
                  <PreviewStat title="Total Spent" value="₱25,680" />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="font-black text-slate-950">
                      Recent Orders
                    </h3>

                    <span className="text-xs font-black text-blue-600">
                      View All Orders
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      {
                        id: "#ASD12345",
                        service: "Instagram Followers",
                        qty: "1,000",
                        amount: "₱250.00",
                        status: "Completed",
                        color: "bg-green-50 text-green-600",
                      },
                      {
                        id: "#ASD12344",
                        service: "TikTok Likes",
                        qty: "500",
                        amount: "₱45.00",
                        status: "Processing",
                        color: "bg-blue-50 text-blue-600",
                      },
                      {
                        id: "#ASD12343",
                        service: "YouTube Views",
                        qty: "10,000",
                        amount: "₱120.00",
                        status: "Completed",
                        color: "bg-green-50 text-green-600",
                      },
                      {
                        id: "#ASD12342",
                        service: "Telegram Members",
                        qty: "1,000",
                        amount: "₱350.00",
                        status: "Pending",
                        color: "bg-orange-50 text-orange-600",
                      },
                    ].map((order) => (
                      <div
                        key={order.id}
                        className="grid grid-cols-[90px_1fr_80px_90px_100px] items-center gap-3 p-4 text-xs"
                      >
                        <span className="font-black text-slate-500">
                          {order.id}
                        </span>

                        <span className="font-black text-slate-950">
                          {order.service}
                        </span>

                        <span className="font-bold text-slate-500">
                          {order.qty}
                        </span>

                        <span className="font-black text-slate-950">
                          {order.amount}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-center font-black ${order.color}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Reseller Benefits
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Why Become a Reseller?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Get more with our reseller program and maximize your earning
              potential.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${benefit.color}`}
                  >
                    <Icon size={34} />
                  </div>

                  <h3 className="mt-7 text-xl font-black text-slate-950">
                    {benefit.title}
                  </h3>

                  <p className="mx-auto mt-3 max-w-[220px] text-sm font-semibold leading-6 text-slate-500">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="border-y border-slate-200 bg-[#f8fbff] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Reseller Levels
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Reseller Levels & Benefits
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              The more you grow, the more you earn. Level up and unlock bigger
              rewards.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {resellerLevels.map((level, index) => {
              const Icon = level.icon;

              return (
                <div key={level.name} className="relative">
                  {index !== resellerLevels.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 xl:block">
                      <ArrowRight size={24} />
                    </div>
                  )}

                  <div
                    className={`h-full rounded-3xl border ${level.border} bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5`}
                  >
                    <div
                      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${level.accent}`}
                    >
                      <Icon size={30} />
                    </div>

                    <h3 className="mt-5 text-center text-lg font-black text-slate-950">
                      {level.name}
                    </h3>

                    <p className="mt-3 text-center text-sm font-black text-slate-400">
                      {level.spend}
                    </p>

                    <div className="mt-6 space-y-4 text-sm">
                      <div>
                        <p className="font-black text-slate-400">Discount</p>
                        <p className="font-black text-slate-950">
                          {level.discount}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-slate-400">
                          Convert Rate
                        </p>
                        <p className="font-black text-slate-950">
                          {level.convert}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Normal vs Reseller */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Normal User vs Reseller
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Choose the Smarter Way to Grow
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              See the difference and start earning more as a reseller.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-5 text-left font-black text-slate-950">
                      Features
                    </th>

                    <th className="p-5 text-center font-black text-slate-950">
                      Normal User
                    </th>

                    <th className="bg-blue-50 p-5 text-center font-black text-blue-600">
                      Reseller
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="p-5 font-black text-slate-700">
                        {row.feature}
                      </td>

                      <td className="p-5 text-center font-bold text-slate-500">
                        {typeof row.normal === "boolean" ? (
                          row.normal ? (
                            <CheckCircle2 className="mx-auto text-green-600" />
                          ) : (
                            <X className="mx-auto text-red-500" />
                          )
                        ) : (
                          row.normal
                        )}
                      </td>

                      <td className="bg-blue-50/50 p-5 text-center font-black text-blue-600">
                        {typeof row.reseller === "boolean" ? (
                          row.reseller ? (
                            <CheckCircle2 className="mx-auto text-green-600" />
                          ) : (
                            <X className="mx-auto text-red-500" />
                          )
                        ) : (
                          row.reseller
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Ready to start?
                </p>

                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                  Start Your Reseller Journey Today
                </h2>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-50">
                  Join thousands of successful resellers and build your
                  profitable SMM business with Ascend Service today.
                </p>

                <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href={primaryHref}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    <Rocket size={18} />
                    {checkingSession ? "Loading..." : primaryLabel}
                  </Link>

                  <Link
                    href="/terms"
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    View Reseller Terms
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="relative hidden h-[220px] lg:block">
                <div className="absolute bottom-0 right-10 h-36 w-52 rounded-[2rem] bg-white/15 shadow-2xl" />
                <div className="absolute bottom-6 right-20 h-24 w-36 rounded-[1.5rem] bg-white/20" />
                <div className="absolute bottom-20 right-36 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <Star size={38} />
                </div>
                <Sparkles
                  className="absolute right-2 top-4 text-white/70"
                  size={42}
                />
                <BarChart3
                  className="absolute right-52 top-12 text-white/70"
                  size={56}
                />
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      {stat.value}
                    </h3>

                    <p className="text-sm font-semibold text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-slate-950 px-5 py-12 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <img
              src="/logo.png"
              alt="Ascend Service"
              className="h-12 w-auto"
            />

            <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-400">
              Ascend Service helps creators, brands, agencies, and resellers
              grow faster with quality SMM services.
            </p>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Services", "Affiliates", "API"],
            },
            {
              title: "Reseller",
              links: [
                "Reseller Program",
                "Level Benefits",
                "Child Panel",
                "Points Conversion",
              ],
            },
            {
              title: "Support",
              links: [
                "Help Center",
                "Contact Us",
                "Terms of Service",
                "Refund Policy",
              ],
            },
            {
              title: "Contact Us",
              links: [
                "support@ascend-service.org",
                "Telegram: @ascendservice",
                "24/7 Support Available",
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-black text-white">
                {group.title}
              </h3>

              <div className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-sm font-semibold text-slate-400 transition hover:text-blue-400"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-slate-800 pt-7 text-sm font-semibold text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ascend Service. All rights reserved.</p>
          <p>Built for resellers, creators, and agencies.</p>
        </div>
      </footer>
    </main>
  );
}

function MiniBenefit({
  icon: Icon,
  title,
  text,
}: {
  icon: any;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={24} />
      </div>

      <div>
        <h3 className="text-sm font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function PreviewStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <h3 className="mt-3 text-xl font-black text-slate-950">{value}</h3>
    </div>
  );
}
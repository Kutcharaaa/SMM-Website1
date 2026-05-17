"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Crown,
  Gift,
  Headphones,
  Link2,
  Megaphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Share Your Link",
    text: "Share your permanent affiliate link with your audience.",
    icon: Link2,
    color: "bg-blue-50 text-blue-600",
  },
  {
    number: "02",
    title: "Referral Registers",
    text: "People click your link and register on Ascend Service.",
    icon: UserPlus,
    color: "bg-green-50 text-green-600",
  },
  {
    number: "03",
    title: "Referral Adds Funds",
    text: "Your referral adds funds to their account.",
    icon: Wallet,
    color: "bg-purple-50 text-purple-600",
  },
  {
    number: "04",
    title: "You Earn Commission",
    text: "You earn commission from approved add funds.",
    icon: Gift,
    color: "bg-orange-50 text-orange-600",
  },
];

const affiliateLevels = [
  {
    name: "Starter Affiliate",
    funds: "₱0",
    rate: "1.25%",
    icon: UserPlus,
    border: "border-blue-200",
    accent: "bg-blue-50 text-blue-600",
  },
  {
    name: "Active Affiliate",
    funds: "₱12,000",
    rate: "1.5%",
    icon: ShieldCheck,
    border: "border-green-200",
    accent: "bg-green-50 text-green-600",
  },
  {
    name: "Pro Affiliate",
    funds: "₱35,000",
    rate: "2%",
    icon: Crown,
    border: "border-purple-200",
    accent: "bg-purple-50 text-purple-600",
  },
  {
    name: "Elite Affiliate",
    funds: "₱80,000",
    rate: "2.5%",
    icon: Star,
    border: "border-orange-200",
    accent: "bg-orange-50 text-orange-600",
  },
  {
    name: "Ascend Partner",
    funds: "₱200,000",
    rate: "3%",
    icon: Trophy,
    border: "border-blue-200",
    accent: "bg-blue-50 text-blue-600",
  },
];

const comparisonRows = [
  {
    feature: "Discount on Orders",
    normal: false,
    affiliate: false,
  },
  {
    feature: "Referral Commission",
    normal: false,
    affiliate: true,
  },
  {
    feature: "Lifetime Earnings",
    normal: false,
    affiliate: true,
  },
  {
    feature: "Referral Tracking",
    normal: false,
    affiliate: true,
  },
  {
    feature: "Business Growth",
    normal: "Limited",
    affiliate: "Unlimited",
  },
  {
    feature: "Dedicated Support",
    normal: "Standard",
    affiliate: "Priority",
  },
];

const stats = [
  {
    label: "Active Affiliates",
    value: "8,620+",
    icon: Users,
  },
  {
    label: "Total Commission Paid",
    value: "₱2.45M+",
    icon: Wallet,
  },
  {
    label: "Total Referrals",
    value: "45,680+",
    icon: BarChart3,
  },
  {
    label: "Support Available",
    value: "24/7",
    icon: Headphones,
  },
];

export default function AffiliatesPage() {
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

  const primaryHref = loggedIn ? "/dashboard/affiliates" : "/register";
  const primaryLabel = loggedIn ? "View Affiliate Dashboard" : "Get Started Now";
  const dashboardHref = loggedIn ? "/dashboard/affiliates" : "/login";
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
              <Users size={17} />
              Affiliate Program
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Earn Commission by Sharing{" "}
              <span className="text-blue-600">Ascend Service</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              Join our affiliate program and earn lifetime commission every time
              your referrals add funds. The more your referrals grow, the more
              you earn.
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
                <BarChart3 size={20} />
                {checkingSession ? "Loading..." : dashboardLabel}
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
              <MiniBenefit
                icon={Zap}
                title="Instant Approval"
                text="Start earning right away"
              />

              <MiniBenefit
                icon={Wallet}
                title="Lifetime Commission"
                text="Earn from referrals"
              />

              <MiniBenefit
                icon={Headphones}
                title="24/7 Support"
                text="We're always here"
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -right-6 top-7 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Users size={38} />
            </div>

            <div className="absolute -right-2 bottom-16 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Megaphone size={38} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">
                    Affiliate Dashboard
                  </h2>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                    Preview
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <PreviewStat title="Total Referrals" value="156" />
                  <PreviewStat title="Referral Funds" value="₱45,680" />
                  <PreviewStat title="Total Commission" value="₱1,256" />
                  <PreviewStat title="Available" value="₱320" />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <h3 className="font-black text-slate-950">
                      Recent Referrals
                    </h3>

                    <span className="text-xs font-black text-blue-600">
                      View All
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      {
                        user: "@john_doe",
                        date: "May 20, 2026",
                        funds: "₱2,000.00",
                        commission: "₱25.00",
                        status: "Completed",
                        color: "bg-green-50 text-green-600",
                      },
                      {
                        user: "@sarah_123",
                        date: "May 19, 2026",
                        funds: "₱1,500.00",
                        commission: "₱18.75",
                        status: "Completed",
                        color: "bg-green-50 text-green-600",
                      },
                      {
                        user: "@mark_xyz",
                        date: "May 18, 2026",
                        funds: "₱3,000.00",
                        commission: "₱37.50",
                        status: "Completed",
                        color: "bg-green-50 text-green-600",
                      },
                      {
                        user: "@james_007",
                        date: "May 17, 2026",
                        funds: "₱1,000.00",
                        commission: "₱12.50",
                        status: "Pending",
                        color: "bg-orange-50 text-orange-600",
                      },
                    ].map((row) => (
                      <div
                        key={row.user}
                        className="grid grid-cols-[1fr_100px_90px_90px_100px] items-center gap-3 p-4 text-xs"
                      >
                        <span className="font-black text-slate-600">
                          {row.user}
                        </span>

                        <span className="font-bold text-slate-500">
                          {row.date}
                        </span>

                        <span className="font-black text-slate-950">
                          {row.funds}
                        </span>

                        <span className="font-black text-slate-950">
                          {row.commission}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-center font-black ${row.color}`}
                        >
                          {row.status}
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

      {/* How It Works */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              How It Works
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Simple Steps, Unlimited Earnings
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              It is easy to start earning with our affiliate program.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative">
                  {index !== steps.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 lg:block">
                      <ArrowRight size={26} />
                    </div>
                  )}

                  <div className="h-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5">
                    <div
                      className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${step.color}`}
                    >
                      <Icon size={34} />
                    </div>

                    <p className="mt-6 text-xs font-black text-blue-600">
                      {step.number}
                    </p>

                    <h3 className="mt-2 text-xl font-black text-slate-950">
                      {step.title}
                    </h3>

                    <p className="mx-auto mt-3 max-w-[220px] text-sm font-semibold leading-6 text-slate-500">
                      {step.text}
                    </p>
                  </div>
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
              Affiliate Levels
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Affiliate Level Path
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Grow your referred funds and unlock higher commission rates.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {affiliateLevels.map((level, index) => {
              const Icon = level.icon;

              return (
                <div key={level.name} className="relative">
                  {index !== affiliateLevels.length - 1 && (
                    <div className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 lg:block">
                      <ArrowRight size={24} />
                    </div>
                  )}

                  <div
                    className={`h-full rounded-3xl border ${level.border} bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5`}
                  >
                    <div
                      className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${level.accent}`}
                    >
                      <Icon size={30} />
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-950">
                      {level.name}
                    </h3>

                    <p className="mt-3 text-sm font-black text-slate-400">
                      {level.funds}
                    </p>

                    <p className="mt-5 text-xs font-bold text-slate-400">
                      Commission Rate
                    </p>

                    <h4 className="mt-1 text-2xl font-black text-blue-600">
                      {level.rate}
                    </h4>

                    <span className="mt-5 inline-flex rounded-xl bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                      Lifetime Commission
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-sm font-semibold text-slate-500">
            Levels are based on the total approved funds added by all your
            referrals.
          </p>
        </div>
      </section>

      {/* Normal vs Affiliate */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
                  Normal User vs Affiliate
                </p>

                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Choose the Smarter Earning Path
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                  See why becoming an affiliate is a better way to earn from
                  referrals.
                </p>
              </div>

              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="p-5 text-left font-black text-slate-950">
                          Features
                        </th>

                        <th className="p-5 text-center font-black text-slate-950">
                          Normal User
                        </th>

                        <th className="bg-blue-50 p-5 text-center font-black text-blue-600">
                          Affiliate
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
                            {typeof row.affiliate === "boolean" ? (
                              row.affiliate ? (
                                <CheckCircle2 className="mx-auto text-green-600" />
                              ) : (
                                <X className="mx-auto text-red-500" />
                              )
                            ) : (
                              row.affiliate
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <div className="w-full overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Start earning
                  </p>

                  <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight md:text-5xl">
                    Start Earning Today!
                  </h2>

                  <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-blue-50">
                    Join thousands of successful affiliates and start earning
                    lifetime commission from your referrals.
                  </p>

                  <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                    <Link
                      href={primaryHref}
                      className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                    >
                      <Rocket size={18} />
                      {checkingSession ? "Loading..." : primaryLabel}
                    </Link>
                  </div>

                  <Link
                    href="/terms"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-100 transition hover:text-white"
                  >
                    View Affiliate Terms
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="relative mt-8 hidden h-[180px] lg:block">
                  <div className="absolute bottom-0 right-14 h-32 w-44 rounded-[2rem] bg-white/15 shadow-2xl" />
                  <div className="absolute bottom-7 right-24 h-20 w-32 rounded-[1.5rem] bg-white/20" />
                  <div className="absolute bottom-16 right-36 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                    <Megaphone size={42} />
                  </div>
                  <Sparkles
                    className="absolute right-2 top-4 text-white/70"
                    size={42}
                  />
                  <Wallet
                    className="absolute right-56 top-16 text-white/70"
                    size={48}
                  />
                </div>
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
              Ascend Service helps creators, brands, agencies, affiliates, and
              resellers grow faster with quality SMM services.
            </p>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Services", "Reseller Program", "API"],
            },
            {
              title: "Affiliate",
              links: [
                "Affiliate Program",
                "Commission Rates",
                "Affiliate Levels",
                "Referral Tracking",
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
          <p>Built for growth. Designed for success.</p>
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
"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  FileCode2,
  Globe2,
  Headphones,
  KeyRound,
  Lock,
  Rocket,
  Server,
  ShieldCheck,
  TerminalSquare,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const apiBenefits = [
  {
    title: "Fast Automation",
    text: "Create orders automatically from your own website, app, or reseller panel.",
    icon: Zap,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Secure API Key",
    text: "Each user gets API access from their own dashboard account.",
    icon: KeyRound,
    color: "bg-green-50 text-green-600",
  },
  {
    title: "Real-Time Data",
    text: "Check balance, services, and order status anytime.",
    icon: BarChart3,
    color: "bg-purple-50 text-purple-600",
  },
  {
    title: "Built for Resellers",
    text: "Perfect for agencies, developers, and SMM business owners.",
    icon: Server,
    color: "bg-orange-50 text-orange-600",
  },
];

const apiActions = [
  {
    title: "Add Order",
    endpoint: "action=add",
    text: "Create a new order using service ID, link, and quantity.",
    icon: Rocket,
  },
  {
    title: "Order Status",
    endpoint: "action=status",
    text: "Check the current status, charge, and remaining quantity.",
    icon: CheckCircle2,
  },
  {
    title: "Services List",
    endpoint: "action=services",
    text: "Fetch available services, prices, min/max, and categories.",
    icon: Database,
  },
  {
    title: "Balance",
    endpoint: "action=balance",
    text: "Check your wallet balance before creating new orders.",
    icon: Wallet,
  },
];

const steps = [
  {
    number: "01",
    title: "Create Account",
    text: "Register or login to your Ascend Service account.",
    icon: Lock,
  },
  {
    number: "02",
    title: "Open API Page",
    text: "Go to your dashboard API page to view your key.",
    icon: KeyRound,
  },
  {
    number: "03",
    title: "Connect API",
    text: "Connect your website, app, bot, or reseller panel.",
    icon: Code2,
  },
  {
    number: "04",
    title: "Automate Orders",
    text: "Start placing and tracking orders automatically.",
    icon: Rocket,
  },
];

const codeExample = `POST https://ascend-service.org/api/v2

{
  "key": "YOUR_API_KEY",
  "action": "add",
  "service": 123,
  "link": "https://www.tiktok.com/@username",
  "quantity": 1000
}`;

export default function ApiPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [copied, setCopied] = useState(false);

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

  const primaryHref = loggedIn ? "/dashboard/api" : "/register";
  const primaryLabel = loggedIn ? "Open API Dashboard" : "Get API Access";
  const dashboardHref = loggedIn ? "/dashboard/api" : "/login";
  const dashboardLabel = loggedIn ? "View Dashboard" : "Login First";

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(codeExample);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  }

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
              <Code2 size={17} />
              Developer API
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Powerful SMM API for{" "}
              <span className="text-blue-600">Resellers & Developers</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              Connect your website, reseller panel, mobile app, or automation
              tool to Ascend Service and manage orders faster with our API.
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
                <TerminalSquare size={20} />
                {checkingSession ? "Loading..." : dashboardLabel}
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
              <MiniBenefit icon={Zap} title="Fast API" text="Quick responses" />
              <MiniBenefit icon={ShieldCheck} title="Secure Access" text="API key protected" />
              <MiniBenefit icon={Headphones} title="24/7 Support" text="Help when needed" />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -right-6 top-7 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Code2 size={38} />
            </div>

            <div className="absolute -right-2 bottom-16 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Server size={38} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                  </div>

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-blue-100">
                    API Request Preview
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-blue-300">
                      Create New Order
                    </p>

                    <button
                      onClick={copyCode}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15"
                    >
                      <Copy size={14} />
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <pre className="mt-4 overflow-x-auto rounded-2xl bg-black/40 p-5 text-xs font-semibold leading-6 text-slate-200">
                    <code>{codeExample}</code>
                  </pre>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <PreviewCard title="Response" value="Success" />
                    <PreviewCard title="Order ID" value="#ASD10293" />
                    <PreviewCard title="Status" value="Processing" />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <KeyRound size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-950">
                      API Key Access
                    </h3>

                    <p className="text-sm font-semibold text-slate-500">
                      Manage your API key inside your dashboard.
                    </p>
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
              API Benefits
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Built for Automation
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Save time and scale your SMM business with API-powered ordering.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {apiBenefits.map((benefit) => {
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

                  <p className="mx-auto mt-3 max-w-[230px] text-sm font-semibold leading-6 text-slate-500">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* API Actions */}
      <section className="border-y border-slate-200 bg-[#f8fbff] px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              API Actions
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              What You Can Do
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Our API supports the important actions needed for SMM automation.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {apiActions.map((action) => {
              const Icon = action.icon;

              return (
                <div
                  key={action.title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                    <Icon size={31} />
                  </div>

                  <h3 className="mt-6 text-lg font-black text-slate-950">
                    {action.title}
                  </h3>

                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs font-black text-blue-600">
                    {action.endpoint}
                  </p>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {action.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to connect */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              How to Connect
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Start Using the API in Minutes
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Follow these simple steps to connect your system.
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
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
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

          <div className="mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  API Access
                </p>

                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                  Ready to automate your SMM orders?
                </h2>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-50">
                  Get your API key from your dashboard and connect Ascend Service
                  to your own system.
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
                    href="/dashboard/tickets"
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    Need Help?
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>

              <div className="hidden rounded-3xl bg-white/10 p-6 lg:block">
                <div className="space-y-4">
                  {["API Key", "Order Automation", "Status Tracking"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3"
                      >
                        <CheckCircle2 size={20} className="text-green-300" />
                        <span className="text-sm font-black">{item}</span>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 flex justify-center">
                  <FileCode2 size={120} className="text-white/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Fast Response",
                value: "Quick",
                icon: Zap,
              },
              {
                label: "Secure Access",
                value: "API Key",
                icon: KeyRound,
              },
              {
                label: "Automation",
                value: "Ready",
                icon: Code2,
              },
              {
                label: "Support",
                value: "24/7",
                icon: Headphones,
              },
            ].map((stat) => {
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
              Ascend Service helps users, resellers, and developers automate SMM
              growth with powerful tools and reliable services.
            </p>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Services", "Reseller Program", "Affiliates"],
            },
            {
              title: "API",
              links: ["API Access", "Order API", "Status API", "Services API"],
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
          <p>Built for automation. Designed for growth.</p>
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

function PreviewCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <h3 className="mt-2 text-lg font-black text-white">{value}</h3>
    </div>
  );
}
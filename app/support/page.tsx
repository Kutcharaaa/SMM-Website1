"use client";

import LiveChatWidget from "@/components/LiveChatWidget";
import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileQuestion,
  Headphones,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Ticket,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const supportOptions = [
  {
    title: "Live Chat",
    text: "Chat with our support team directly from the website.",
    icon: MessageCircle,
    color: "bg-blue-50 text-blue-600",
    button: "Start Live Chat",
    action: "chat",
  },
  {
    title: "Support Tickets",
    text: "Create a ticket for account, order, payment, or service issues.",
    icon: Ticket,
    color: "bg-green-50 text-green-600",
    button: "Open Tickets",
    href: "/dashboard/tickets",
  },
  {
    title: "Help Center",
    text: "Find answers about orders, payments, refunds, and reseller features.",
    icon: HelpCircle,
    color: "bg-purple-50 text-purple-600",
    button: "Read FAQs",
    href: "#faq",
  },
];

const faqs = [
  {
    question: "How fast do orders start?",
    answer:
      "Most services start quickly, but delivery time depends on the selected service, platform, and order quantity.",
  },
  {
    question: "Where can I create a support ticket?",
    answer:
      "Login to your account and go to Dashboard > Tickets to create and track support requests.",
  },
  {
    question: "Can I use live chat without an account?",
    answer:
      "Live chat requires login so our team can safely identify your account and support history.",
  },
  {
    question: "How do I report a payment issue?",
    answer:
      "Create a ticket from your dashboard and include your payment method, amount, reference number, and proof if needed.",
  },
  {
    question: "Do affiliates and resellers get support?",
    answer:
      "Yes. Affiliates, resellers, and regular users can contact support through tickets and live chat.",
  },
  {
    question: "Can I ask about API setup?",
    answer:
      "Yes. You can use support tickets or live chat to ask about API connection, services, and order automation.",
  },
];

const supportStats = [
  {
    title: "24/7 Support",
    text: "Support is available anytime.",
    icon: Headphones,
  },
  {
    title: "Secure Help",
    text: "Account-based support tracking.",
    icon: ShieldCheck,
  },
  {
    title: "Fast Replies",
    text: "We reply as soon as possible.",
    icon: Zap,
  },
  {
    title: "Ticket History",
    text: "Track all your support requests.",
    icon: FileQuestion,
  },
];

export default function SupportPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [openChat, setOpenChat] = useState(false);

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

  const primaryHref = loggedIn ? "/dashboard/tickets" : "/login";
  const primaryLabel = loggedIn ? "Open Support Tickets" : "Login for Support";
  const secondaryHref = loggedIn ? "/dashboard" : "/register";
  const secondaryLabel = loggedIn ? "Go to Dashboard" : "Create Account";

  function startLiveChat() {
    setOpenChat(true);

    setTimeout(() => {
      const button = document.querySelector<HTMLButtonElement>(
        "[data-live-chat-open]",
      );

      button?.click();
    }, 100);
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
              <LifeBuoy size={17} />
              Support Center
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Need Help? Our{" "}
              <span className="text-blue-600">Support Team</span> Is Here
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              Contact Ascend Service support for orders, payments, tickets,
              reseller, affiliate, API, and account concerns.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={startLiveChat}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <MessageCircle size={20} />
                Start Live Chat
                <ArrowRight size={18} />
              </button>

              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                <Ticket size={20} />
                {checkingSession ? "Loading..." : primaryLabel}
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
              <MiniSupport icon={Clock} title="Fast Reply" text="Quick support" />
              <MiniSupport
                icon={ShieldCheck}
                title="Secure Support"
                text="Account protected"
              />
              <MiniSupport
                icon={Headphones}
                title="24/7 Help"
                text="Always available"
              />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[620px]">
            <div className="absolute -right-6 top-7 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <Headphones size={38} />
            </div>

            <div className="absolute -right-2 bottom-16 hidden rounded-3xl bg-blue-600 p-5 text-white shadow-2xl shadow-blue-600/30 lg:block">
              <MessageCircle size={38} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">
                    Support Preview
                  </h2>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-600">
                    Online
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  <ChatBubble
                    role="support"
                    text="Hi! Welcome to Ascend Service. How can we help you today?"
                    time="10:24 PM"
                  />

                  <ChatBubble
                    role="user"
                    text="I need help with my order status."
                    time="10:25 PM"
                  />

                  <ChatBubble
                    role="support"
                    text="Sure! Please send your order ID and our team will check it."
                    time="10:26 PM"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Ticket size={22} />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-950">
                        Ticket Support
                      </h3>

                      <p className="text-sm font-semibold text-slate-500">
                        For detailed issues, create a support ticket in your
                        dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <PreviewStat title="Open Tickets" value="24" />
                  <PreviewStat title="Avg Reply" value="Fast" />
                  <PreviewStat title="Support" value="24/7" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Contact Options
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Choose How You Want Support
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Use live chat for quick help or tickets for detailed concerns.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {supportOptions.map((option) => {
              const Icon = option.icon;

              return (
                <div
                  key={option.title}
                  className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div
                    className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${option.color}`}
                  >
                    <Icon size={34} />
                  </div>

                  <h3 className="mt-7 text-xl font-black text-slate-950">
                    {option.title}
                  </h3>

                  <p className="mx-auto mt-3 max-w-[260px] text-sm font-semibold leading-6 text-slate-500">
                    {option.text}
                  </p>

                  {option.action === "chat" ? (
                    <button
                      onClick={startLiveChat}
                      className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      {option.button}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <Link
                      href={option.href || "#"}
                      className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      {option.button}
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-[#f8fbff] px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {supportStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={26} />
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-slate-950">
                      {stat.title}
                    </h3>

                    <p className="text-sm font-semibold text-slate-500">
                      {stat.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Frequently Asked Questions
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Common Support Questions
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Quick answers before you contact the support team.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="flex items-center gap-3 text-lg font-black text-slate-950">
                  <CheckCircle2 size={21} className="text-blue-600" />
                  {faq.question}
                </h3>

                <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Still need help?
                </p>

                <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                  Our support team is ready to help.
                </h2>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-50">
                  Start live chat for quick questions or create a ticket for
                  detailed order, payment, and account concerns.
                </p>

                <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                  <button
                    onClick={startLiveChat}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                  >
                    <MessageCircle size={18} />
                    Start Live Chat
                  </button>

                  <Link
                    href={primaryHref}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <Ticket size={18} />
                    {checkingSession ? "Loading..." : primaryLabel}
                  </Link>
                </div>
              </div>

              <div className="hidden rounded-3xl bg-white/10 p-6 lg:block">
                <div className="space-y-4">
                  {["Live Chat", "Support Tickets", "Account Help"].map(
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
                  <Headphones size={120} className="text-white/80" />
                </div>
              </div>
            </div>
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
              Ascend Service provides reliable SMM support for users, resellers,
              affiliates, and developers.
            </p>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Services", "Reseller Program", "Affiliates"],
            },
            {
              title: "Support",
              links: ["Live Chat", "Tickets", "FAQ", "Help Center"],
            },
            {
              title: "Legal",
              links: [
                "Terms of Service",
                "Privacy Policy",
                "Refund Policy",
                "Service Policy",
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
          <p>Support built for growth.</p>
        </div>
      </footer>

      <div className={openChat ? "block" : "block"}>
        <LiveChatWidget />
      </div>
    </main>
  );
}

function MiniSupport({
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

function ChatBubble({
  role,
  text,
  time,
}: {
  role: "support" | "user";
  text: string;
  time: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${
          isUser
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
        }`}
      >
        <p>{text}</p>

        <p
          className={`mt-1 text-[10px] font-bold ${
            isUser ? "text-blue-100" : "text-slate-400"
          }`}
        >
          {isUser ? "You" : "Support"} • {time}
        </p>
      </div>
    </div>
  );
}

function PreviewStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <h3 className="mt-3 text-lg font-black text-slate-950">{value}</h3>
    </div>
  );
}
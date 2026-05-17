import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicHeroActions from "@/components/PublicHeroActions";
import {
  ArrowRight,
  Rocket,
  ShieldCheck,
  Headphones,
  Globe2,
  Users,
  Star,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Lock,
  MoreHorizontal,
} from "lucide-react";

const platforms = [
  { name: "TikTok", icon: TikTokIcon, color: "text-black", bg: "bg-slate-50" },
  { name: "Facebook", icon: FacebookIcon, color: "text-[#1877F2]", bg: "bg-blue-50" },
  { name: "YouTube", icon: YouTubeIcon, color: "text-[#FF0000]", bg: "bg-red-50" },
  { name: "Instagram", icon: InstagramIcon, color: "text-[#E4405F]", bg: "bg-pink-50" },
  { name: "Telegram", icon: TelegramIcon, color: "text-[#229ED9]", bg: "bg-sky-50" },
  { name: "Spotify", icon: SpotifyIcon, color: "text-[#1DB954]", bg: "bg-green-50" },
  { name: "More", icon: MoreHorizontal, color: "text-slate-700", bg: "bg-slate-50" },
];

const features = [
  {
    title: "24/7 Support",
    text: "Our support team is available whenever you need help.",
    icon: Headphones,
  },
  {
    title: "Fast Delivery",
    text: "Optimized services made for quick and reliable results.",
    icon: Rocket,
  },
  {
    title: "Secure Wallet",
    text: "Your funds, orders, and account data stay protected.",
    icon: ShieldCheck,
  },
  {
    title: "Multi-Platform",
    text: "Boost across TikTok, Facebook, YouTube, Instagram, and more.",
    icon: Globe2,
  },
];

const steps = [
  {
    title: "Choose Service",
    text: "Browse SMM services and choose what you need.",
    icon: ShoppingBag,
  },
  {
    title: "Place Order",
    text: "Add your link, quantity, and submit your order.",
    icon: Rocket,
  },
  {
    title: "Track Progress",
    text: "Monitor every order directly from your dashboard.",
    icon: BarChart3,
  },
  {
    title: "Grow Faster",
    text: "Boost your online presence with trusted services.",
    icon: TrendingUp,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <PublicNavbar />

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#e8f3ff_0%,transparent_32%),radial-gradient(circle_at_top_right,#dcecff_0%,transparent_30%),linear-gradient(135deg,#ffffff_0%,#f6f9ff_45%,#eef6ff_100%)]">
        <div className="absolute inset-0 opacity-[0.45]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb12_1px,transparent_1px),linear-gradient(to_bottom,#2563eb12_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="absolute -left-24 top-20 h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-[560px] w-[560px] rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-[360px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-600 shadow-sm">
              <ShieldCheck size={17} />
              Trusted SMM Panel for Social Growth
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Grow Your Social Media Faster with{" "}
              <span className="text-blue-600">Ascend Service</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              Boost followers, likes, views, subscribers, and engagement across
              major platforms with fast, secure, and reliable SMM services.
            </p>

<PublicHeroActions />

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-5">
              {[
                ["50K+", "Happy Users"],
                ["99.9%", "Uptime"],
                ["4.9/5", "Rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mx-auto max-w-[720px] rounded-[2.2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[1.7rem] border border-slate-200 bg-[#f8fbff] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                        Start Growing
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        New Order
                      </h3>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <Rocket size={27} />
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Platform
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                          <InstagramIcon size={22} />
                        </div>
                        <p className="font-black text-slate-950">
                          Instagram Growth
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Service
                      </p>
                      <p className="mt-2 font-black text-slate-950">
                        Followers • Likes • Views
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Estimated Delivery
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-2xl font-black text-slate-950">Fast</p>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-600">
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-blue-600 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-600/20">
                      Submit Order
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Growth Performance
                        </p>
                        <h3 className="mt-2 text-3xl font-black text-slate-950">
                          +25.8K
                        </h3>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                        <TrendingUp size={25} />
                      </div>
                    </div>

                    <div className="mt-6 flex h-24 items-end gap-2">
                      {[35, 48, 42, 62, 58, 76, 88, 70, 95].map(
                        (height, index) => (
                          <div
                            key={index}
                            className="flex-1 rounded-t-xl bg-blue-600/90"
                            style={{ height: `${height}%` }}
                          />
                        ),
                      )}
                    </div>

                    <p className="mt-4 text-sm font-black text-green-600">
                      +18.4% growth this week
                    </p>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Popular Platforms
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                      {platforms.slice(0, 6).map((platform) => {
                        const Icon = platform.icon;

                        return (
                          <div
                            key={platform.name}
                            className={`flex h-14 items-center justify-center rounded-2xl border border-slate-200 ${platform.bg} ${platform.color}`}
                          >
                            <Icon size={25} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-slate-200 bg-blue-600 p-6 text-white shadow-lg shadow-blue-600/20">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                        <ShieldCheck size={25} />
                      </div>

                      <div>
                        <p className="text-sm font-black">Secure Wallet</p>
                        <p className="mt-1 text-xs font-semibold text-blue-100">
                          Safe payments and order tracking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ["128.6K", "Orders Completed"],
                  ["100+", "Active Platforms"],
                  ["99.8%", "Success Rate"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm"
                  >
                    <p className="text-2xl font-black text-slate-950">
                      {value}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-500">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-0 px-5 lg:grid-cols-4 lg:px-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={`flex gap-5 px-4 py-8 ${
                  index !== features.length - 1
                    ? "border-b border-slate-100 lg:border-b-0 lg:border-r"
                    : ""
                }`}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                  <Icon size={30} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-950">
              Popular Platforms
            </h2>
            <p className="mt-3 text-base font-medium text-slate-500">
              Everything you need to grow, all in one place.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {platforms.map((platform) => {
              const Icon = platform.icon;

              return (
                <Link
                  key={platform.name}
                  href="/services"
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${platform.bg} ${platform.color} transition group-hover:bg-blue-50`}
                  >
                    <Icon size={32} />
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-950">
                    {platform.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    Popular Services
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7faff] px-5 py-10 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                  Reseller Program
                </div>
                <h2 className="mt-4 text-3xl font-black text-slate-950">
                  Start your own SMM business
                </h2>
                <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500">
                  Earn points, unlock discounts, convert points to balance, and
                  grow as a reseller with Ascend Service.
                </p>
              </div>

              <div className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 sm:flex">
                <Star size={38} />
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                ["Discount", "Up to 5%"],
                ["Points", "Earn every order"],
                ["Child Panel", "Unlock access"],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-black uppercase text-slate-400">
                    {title}
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/reseller"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white transition hover:bg-blue-700"
            >
              Join Reseller Program
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-600">
                  Affiliate Program
                </div>
                <h2 className="mt-4 text-3xl font-black text-slate-950">
                  Earn by inviting new users
                </h2>
                <p className="mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500">
                  Share your referral link and earn commission when your
                  referrals become qualified users.
                </p>
              </div>

              <div className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-green-600 sm:flex">
                <Users size={38} />
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              {[
                ["Referral Link", "Share easily"],
                ["Commission", "Earn rewards"],
                ["Transfer", "To wallet"],
              ].map(([title, value]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-xs font-black uppercase text-slate-400">
                    {title}
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/affiliates"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white transition hover:bg-blue-700"
            >
              Join Affiliate Program
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black text-slate-950">How It Works</h2>
            <p className="mt-3 text-base font-medium text-slate-500">
              Simple steps to start growing today.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="relative rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"
                >
                  <div className="absolute left-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                    {index + 1}
                  </div>

                  <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                    <Icon size={32} />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f8fbff] px-5 py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <img src="/logo.png" alt="Ascend Service" className="h-12 w-auto" />

            <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-slate-500">
              Ascend Service is a trusted SMM panel built to help you grow your
              online presence with quality, speed, and security.
            </p>

            <div className="mt-5 flex gap-3">
              {[
                TelegramIcon,
                FacebookIcon,
                TikTokIcon,
                InstagramIcon,
                YouTubeIcon,
              ].map((Icon, index) => (
                <div
                  key={index}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500"
                >
                  <Icon size={18} />
                </div>
              ))}
            </div>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Blog", "Careers", "Contact Us"],
            },
            {
              title: "Services",
              links: [
                "TikTok Services",
                "Instagram Services",
                "YouTube Services",
                "Facebook Services",
              ],
            },
            {
              title: "Support",
              links: [
                "Help Center",
                "How to Order",
                "Payment Methods",
                "Ticket Support",
              ],
            },
            {
              title: "Legal",
              links: [
                "Terms of Service",
                "Privacy Policy",
                "Refund Policy",
                "DMCA Policy",
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h3 className="text-base font-black text-slate-950">
                {group.title}
              </h3>

              <div className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-sm font-semibold text-slate-500 transition hover:text-blue-600"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-4 border-t border-slate-200 pt-7 text-sm font-semibold text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Ascend Service. All rights reserved.</p>
          <p>Fast. Reliable. Built for growth.</p>
        </div>
      </footer>
    </main>
  );
}

function TikTokIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M184.7 72.1c-16.8-10.9-27.7-29.5-27.7-50.5h-39.4v143.8c0 17.7-14.3 32-32 32s-32-14.3-32-32 14.3-32 32-32c4.1 0 8 .8 11.6 2.2V95.8c-3.8-.5-7.6-.8-11.6-.8-39.4 0-71.4 32-71.4 71.4s32 71.4 71.4 71.4 71.4-32 71.4-71.4V94.1c15.3 11 34 17.5 54.2 17.5V72.2c-9.7 0-18.8-2.8-26.5-7.6v7.5Z" />
    </svg>
  );
}

function FacebookIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M232 128a104 104 0 1 0-120.25 102.7v-72.65H85.35V128h26.4v-22.9c0-26.05 15.52-40.45 39.25-40.45 11.36 0 23.25 2.03 23.25 2.03v25.55h-13.1c-12.9 0-16.9 8-16.9 16.2V128h28.75l-4.6 30.05h-24.15v72.65A104.03 104.03 0 0 0 232 128Z" />
    </svg>
  );
}

function YouTubeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M234.3 73.1a29.2 29.2 0 0 0-20.5-20.6C195.7 47.6 128 47.6 128 47.6s-67.7 0-85.8 4.9a29.2 29.2 0 0 0-20.5 20.6C16.8 91.3 16.8 128 16.8 128s0 36.7 4.9 54.9a29.2 29.2 0 0 0 20.5 20.6c18.1 4.9 85.8 4.9 85.8 4.9s67.7 0 85.8-4.9a29.2 29.2 0 0 0 20.5-20.6c4.9-18.2 4.9-54.9 4.9-54.9s0-36.7-4.9-54.9ZM105.8 162.6V93.4L164 128l-58.2 34.6Z" />
    </svg>
  );
}

function InstagramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M128 82.7A45.3 45.3 0 1 0 173.3 128 45.35 45.35 0 0 0 128 82.7Zm0 74.7a29.4 29.4 0 1 1 29.4-29.4 29.43 29.43 0 0 1-29.4 29.4ZM176.6 80.9a10.6 10.6 0 1 1 10.6 10.6 10.6 10.6 0 0 1-10.6-10.6ZM224 128c0-30.5-.1-34.3-.7-46.2-.6-11.9-2.4-20-5.2-27a55.1 55.1 0 0 0-31-31c-7-2.8-15.1-4.6-27-5.2C148.3 18.1 144.5 18 128 18s-20.3.1-32.1.6c-11.9.6-20 2.4-27 5.2a55.1 55.1 0 0 0-31 31c-2.8 7-4.6 15.1-5.2 27C32.1 93.7 32 97.5 32 128s.1 34.3.7 46.2c.6 11.9 2.4 20 5.2 27a55.1 55.1 0 0 0 31 31c7 2.8 15.1 4.6 27 5.2 11.8.5 15.6.6 32.1.6s20.3-.1 32.1-.6c11.9-.6 20-2.4 27-5.2a55.1 55.1 0 0 0 31-31c2.8-7 4.6-15.1 5.2-27 .6-11.9.7-15.7.7-46.2Z" />
    </svg>
  );
}

function TelegramIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M226.6 35.7 18.9 115.8c-14.2 5.7-14.1 13.7-2.6 17.2l53.3 16.6 20.4 62.6c2.6 7.1 1.3 9.9 8.8 9.9 5.8 0 8.4-2.6 11.6-5.8l27.9-27.1 58 42.8c10.7 5.9 18.4 2.8 21.1-9.9l38.2-179.9c3.9-15.7-6-22.8-19-16.5ZM79.9 145.8l121.4-76.5c6.1-3.7 11.7-1.7 7.1 2.4L104.4 165.6l-4 42.9-20.5-62.7Z" />
    </svg>
  );
}

function SpotifyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M128 20C68.4 20 20 68.4 20 128s48.4 108 108 108 108-48.4 108-108S187.6 20 128 20Zm49.5 156.2c-2.4 3.9-7.5 5.1-11.4 2.7-31.2-19-70.5-23.3-116.7-12.8-4.5 1-8.9-1.8-9.9-6.2-1-4.5 1.8-8.9 6.2-9.9 50.6-11.5 94.3-6.5 130.9 15.8 3.9 2.4 5.2 7.5 2.9 11.4Zm15.2-33.8c-3 4.9-9.4 6.4-14.3 3.4-35.7-21.9-90.1-28.2-132.4-15.4-5.5 1.7-11.3-1.4-13-6.9-1.7-5.5 1.4-11.3 6.9-13 48.3-14.7 108.3-7.6 149.4 17.5 4.9 3 6.4 9.4 3.4 14.4Zm1.3-35.2c-42.8-25.4-113.4-27.8-154.3-15.4-6.5 2-13.4-1.7-15.4-8.2-2-6.5 1.7-13.4 8.2-15.4 47-14.2 124.9-11.4 174.1 17.8 5.9 3.5 7.8 11 4.3 16.9-3.5 5.8-11 7.8-16.9 4.3Z" />
    </svg>
  );
}

"use client";

import PublicNavbar from "@/components/PublicNavbar";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Globe2,
  Headphones,
  Heart,
  MessageCircle,
  Rocket,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Star,
  TrafficCone,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

const platforms = [
  {
    name: "TikTok",
    icon: TikTokIcon,
    bg: "bg-slate-50",
    color: "text-black",
    desc: "Followers, likes, views, shares and more.",
  },
  {
    name: "Instagram",
    icon: InstagramIcon,
    bg: "bg-pink-50",
    color: "text-[#E4405F]",
    desc: "Followers, likes, comments, story views and more.",
  },
  {
    name: "YouTube",
    icon: YouTubeIcon,
    bg: "bg-red-50",
    color: "text-[#FF0000]",
    desc: "Views, subscribers, watch time and more.",
  },
  {
    name: "Facebook",
    icon: FacebookIcon,
    bg: "bg-blue-50",
    color: "text-[#1877F2]",
    desc: "Page likes, followers, post likes and more.",
  },
  {
    name: "Telegram",
    icon: TelegramIcon,
    bg: "bg-sky-50",
    color: "text-[#229ED9]",
    desc: "Members, channel views, post views and more.",
  },
  {
    name: "Spotify",
    icon: SpotifyIcon,
    bg: "bg-green-50",
    color: "text-[#1DB954]",
    desc: "Streams, saves, followers and more.",
  },
  {
    name: "Twitter / X",
    icon: XIcon,
    bg: "bg-slate-50",
    color: "text-black",
    desc: "Followers, likes, retweets, impressions and more.",
  },
  {
    name: "Twitch",
    icon: TwitchIcon,
    bg: "bg-purple-50",
    color: "text-[#9146FF]",
    desc: "Followers, viewers and stream engagement.",
  },
  {
    name: "Discord",
    icon: DiscordIcon,
    bg: "bg-indigo-50",
    color: "text-[#5865F2]",
    desc: "Members, server boosts and community growth.",
  },
  {
    name: "Google Reviews",
    icon: GoogleIcon,
    bg: "bg-slate-50",
    color: "text-slate-900",
    desc: "Reviews, ratings, maps and business trust.",
  },
  {
    name: "Website Traffic",
    icon: Globe2,
    bg: "bg-blue-50",
    color: "text-blue-600",
    desc: "Visitors, traffic, clicks and engagement.",
  },
  {
    name: "More Platforms",
    icon: MoreIcon,
    bg: "bg-slate-50",
    color: "text-blue-600",
    desc: "Many more platform services available.",
  },
];

const serviceTypes = [
  {
    title: "Followers",
    text: "Get real and active followers.",
    icon: UserPlus,
  },
  {
    title: "Likes",
    text: "Increase likes and engagement.",
    icon: Heart,
  },
  {
    title: "Views",
    text: "Boost your video reach instantly.",
    icon: BarChart3,
  },
  {
    title: "Subscribers",
    text: "Grow your channel subscribers.",
    icon: Users,
  },
  {
    title: "Comments",
    text: "Get comments and engagement.",
    icon: MessageCircle,
  },
  {
    title: "Shares",
    text: "Increase shares and reach.",
    icon: Share2,
  },
  {
    title: "Watch Time",
    text: "Boost watch time at any time.",
    icon: Zap,
  },
  {
    title: "Members",
    text: "Get members for groups and channels.",
    icon: Users,
  },
  {
    title: "Reviews",
    text: "High quality reviews and ratings.",
    icon: Star,
  },
  {
    title: "Website Traffic",
    text: "Drive real traffic to your website.",
    icon: TrafficCone,
  },
];

const featuredServices = [
  {
    service: "TikTok Followers",
    platform: "TikTok",
    icon: TikTokIcon,
    color: "text-black",
    price: "₱0.25",
    delivery: "Fast",
  },
  {
    service: "Instagram Likes",
    platform: "Instagram",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
    price: "₱0.10",
    delivery: "Instant",
  },
  {
    service: "YouTube Views",
    platform: "YouTube",
    icon: YouTubeIcon,
    color: "text-[#FF0000]",
    price: "₱0.20",
    delivery: "Fast",
  },
  {
    service: "Facebook Page Likes",
    platform: "Facebook",
    icon: FacebookIcon,
    color: "text-[#1877F2]",
    price: "₱0.30",
    delivery: "Fast",
  },
  {
    service: "Telegram Members",
    platform: "Telegram",
    icon: TelegramIcon,
    color: "text-[#229ED9]",
    price: "₱0.35",
    delivery: "Instant",
  },
];

const serviceFinderItems = [
  {
    service: "TikTok Followers",
    platform: "TikTok",
    category: "Followers",
    price: "₱0.25",
    icon: TikTokIcon,
    color: "text-black",
  },
  {
    service: "TikTok Views",
    platform: "TikTok",
    category: "Views",
    price: "₱0.08",
    icon: TikTokIcon,
    color: "text-black",
  },
  {
    service: "TikTok Likes",
    platform: "TikTok",
    category: "Likes",
    price: "₱0.10",
    icon: TikTokIcon,
    color: "text-black",
  },
  {
    service: "Instagram Likes",
    platform: "Instagram",
    category: "Likes",
    price: "₱0.10",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
  },
  {
    service: "Instagram Followers",
    platform: "Instagram",
    category: "Followers",
    price: "₱0.30",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
  },
  {
    service: "Instagram Views",
    platform: "Instagram",
    category: "Views",
    price: "₱0.15",
    icon: InstagramIcon,
    color: "text-[#E4405F]",
  },
  {
    service: "YouTube Views",
    platform: "YouTube",
    category: "Views",
    price: "₱0.20",
    icon: YouTubeIcon,
    color: "text-[#FF0000]",
  },
  {
    service: "YouTube Subscribers",
    platform: "YouTube",
    category: "Subscribers",
    price: "₱1.50",
    icon: YouTubeIcon,
    color: "text-[#FF0000]",
  },
  {
    service: "Facebook Page Likes",
    platform: "Facebook",
    category: "Likes",
    price: "₱0.30",
    icon: FacebookIcon,
    color: "text-[#1877F2]",
  },
  {
    service: "Facebook Followers",
    platform: "Facebook",
    category: "Followers",
    price: "₱0.45",
    icon: FacebookIcon,
    color: "text-[#1877F2]",
  },
  {
    service: "Telegram Members",
    platform: "Telegram",
    category: "Members",
    price: "₱0.35",
    icon: TelegramIcon,
    color: "text-[#229ED9]",
  },
  {
    service: "Telegram Views",
    platform: "Telegram",
    category: "Views",
    price: "₱0.08",
    icon: TelegramIcon,
    color: "text-[#229ED9]",
  },
];

const finderPlatforms = [
  "All Platforms",
  "TikTok",
  "Instagram",
  "YouTube",
  "Facebook",
  "Telegram",
];

const finderCategories = [
  "All Categories",
  "Followers",
  "Likes",
  "Views",
  "Subscribers",
  "Members",
];

const benefits = [
  {
    title: "Fast Delivery",
    text: "We deliver your orders as fast as possible.",
    icon: Zap,
  },
  {
    title: "Secure & Safe",
    text: "Your account and data are always safe.",
    icon: ShieldCheck,
  },
  {
    title: "Multi-Platform",
    text: "We support all major platforms and many more.",
    icon: Globe2,
  },
  {
    title: "Real-Time Tracking",
    text: "Track your orders with live updates.",
    icon: BarChart3,
  },
];

export default function ServicesPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("TikTok");
  const [selectedCategory, setSelectedCategory] = useState("Followers");

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

  const primaryHref = loggedIn ? "/dashboard" : "/register";
  const primaryLabel = loggedIn ? "View Dashboard" : "Get Started";
  const orderHref = loggedIn ? "/dashboard/new-order" : "/register";

  const filteredFinderServices = serviceFinderItems.filter((item) => {
    const matchesSearch =
      item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlatform =
      selectedPlatform === "All Platforms" || item.platform === selectedPlatform;

    const matchesCategory =
      selectedCategory === "All Categories" ||
      item.category === selectedCategory;

    return matchesSearch && matchesPlatform && matchesCategory;
  });

  return (
    <main className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <PublicNavbar />

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,#e8f3ff_0%,transparent_32%),radial-gradient(circle_at_top_right,#dcecff_0%,transparent_30%),linear-gradient(135deg,#ffffff_0%,#f6f9ff_45%,#eef6ff_100%)]">
        <div className="absolute inset-0 opacity-[0.45]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#2563eb12_1px,transparent_1px),linear-gradient(to_bottom,#2563eb12_1px,transparent_1px)] bg-[size:42px_42px]" />
        </div>

        <div className="absolute -left-28 top-24 h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-3xl" />
        <div className="absolute right-0 top-0 h-[560px] w-[560px] rounded-full bg-cyan-200/30 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-2 text-sm font-black text-blue-600 shadow-sm">
              <Search size={17} />
              Explore Our Services
            </div>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight text-slate-950 md:text-6xl">
              Boost Every Platform with{" "}
              <span className="text-blue-600">Ascend Service</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              High-quality SMM services to grow your audience, increase
              engagement, and build your online presence faster and easier.
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
                href="/dashboard/tickets"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                <Headphones size={20} />
                Contact Support
              </Link>
            </div>

            <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-3">
              <MiniBenefit
                icon={TikTokIcon}
                title="Instant Delivery"
                text="Super Fast"
              />
              <MiniBenefit
                icon={ShieldCheck}
                title="Secure & Safe"
                text="100% Protected"
              />
              <MiniBenefit
                icon={Headphones}
                title="24/7 Support"
                text="Always Here"
              />
            </div>
          </div>

          <div className="mx-auto w-full max-w-[460px]">
            <div className="rounded-[2rem] border border-slate-200 bg-white/95 p-7 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
              <h2 className="text-2xl font-black text-slate-950">
                Find the right service
              </h2>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">
                <Search size={20} className="shrink-0 text-slate-400" />

                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search service..."
                  className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    Select Platform
                  </p>

                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="h-[68px] w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    {finderPlatforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute bottom-6 right-4 text-slate-400"
                  />
                </div>

                <div className="relative">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    Select Category
                  </p>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-[68px] w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-black text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  >
                    {finderCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute bottom-6 right-4 text-slate-400"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-slate-950">
                    Popular Services
                  </p>

                  <p className="text-xs font-black text-slate-400">
                    {filteredFinderServices.length} found
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {filteredFinderServices.length <= 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                      <p className="text-sm font-black text-slate-700">
                        No services found
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        Try another platform or category.
                      </p>
                    </div>
                  ) : (
                    filteredFinderServices.slice(0, 5).map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={`${item.platform}-${item.service}`}
                          href={orderHref}
                          className="flex items-center justify-between rounded-2xl p-2 transition hover:bg-slate-50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon
                              size={22}
                              className={`shrink-0 ${item.color}`}
                            />

                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-slate-950">
                                {item.service}
                              </p>

                              <p className="text-xs font-semibold text-slate-400">
                                {item.platform} • {item.category}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600">
                            From {item.price}
                          </span>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Platforms
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Popular Platforms
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              We provide services for all major social media platforms and more.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {platforms.map((platform) => {
              const Icon = platform.icon;

              return (
                <Link
                  key={platform.name}
                  href={orderHref}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-3xl ${platform.bg} ${platform.color}`}
                  >
                    <Icon size={34} />
                  </div>

                  <h3 className="mt-4 text-base font-black text-slate-950">
                    {platform.name}
                  </h3>

                  <p className="mt-2 min-h-[48px] text-xs font-semibold leading-5 text-slate-500">
                    {platform.desc}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-black text-blue-600">
                    View Services
                    <ArrowRight size={15} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fbff] px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Service Types
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              What You Can Get
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Explore our service categories to find exactly what you need.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            {serviceTypes.map((service) => {
              const Icon = service.icon;

              return (
                <div
                  key={service.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm transition hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={26} />
                  </div>

                  <h3 className="mt-4 text-sm font-black text-slate-950">
                    {service.title}
                  </h3>

                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                    {service.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Featured Services
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Popular Services
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Some of our most popular and in-demand services.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-blue-950/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-5 text-left font-black">Service</th>
                    <th className="p-5 text-left font-black">Platform</th>
                    <th className="p-5 text-left font-black">
                      Starting Price
                    </th>
                    <th className="p-5 text-left font-black">Delivery</th>
                    <th className="p-5 text-left font-black">Status</th>
                    <th className="p-5 text-right font-black">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {featuredServices.map((item) => {
                    const Icon = item.icon;

                    return (
                      <tr
                        key={item.service}
                        className="border-t border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="p-5 font-black text-slate-950">
                          {item.service}
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <Icon size={23} className={item.color} />

                            <span className="font-bold text-slate-700">
                              {item.platform}
                            </span>
                          </div>
                        </td>

                        <td className="p-5">
                          <span className="rounded-xl bg-slate-50 px-4 py-2 font-black text-slate-950">
                            {item.price}
                          </span>
                        </td>

                        <td className="p-5">
                          <span className="inline-flex items-center gap-2 font-bold text-slate-700">
                            <Zap size={15} className="text-green-600" />
                            {item.delivery}
                          </span>
                        </td>

                        <td className="p-5">
                          <span className="inline-flex items-center gap-2 font-bold text-slate-700">
                            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        </td>

                        <td className="p-5 text-right">
                          <Link
                            href={orderHref}
                            className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700"
                          >
                            Order Now
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 p-5 text-center">
              <Link
                href={orderHref}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                View All Services
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fbff] px-5 py-14 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">
              Why Choose Us
            </p>

            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Why Choose Ascend Service?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              We are committed to providing the best SMM experience.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/5"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                    <Icon size={31} />
                  </div>

                  <h3 className="mt-6 text-lg font-black text-slate-950">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_360px]">
              <div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                  Want to resell SMM services?
                </h2>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-blue-50">
                  Join our reseller program and start earning more. Get special
                  discounts, earn points, and grow your own business with Ascend
                  Service.
                </p>

                <Link
                  href="/reseller"
                  className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-600 transition hover:bg-blue-50"
                >
                  Explore Reseller Program
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="rounded-3xl bg-white/10 p-6">
                <div className="space-y-4">
                  {["Special Discounts", "Earn Points", "More Profit"].map(
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
                  <Wallet size={120} className="text-white/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-14 text-center">
            <div className="absolute left-0 top-8 hidden text-blue-200 md:block">
              <Send size={58} />
            </div>

            <div className="absolute right-0 top-8 hidden text-blue-200 md:block">
              <Send size={58} />
            </div>

            <h2 className="text-4xl font-black text-slate-950">
              Ready to grow your social media?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-slate-500">
              Join thousands of customers who trust Ascend Service for their SMM
              needs.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={primaryHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
              >
                {checkingSession ? "Loading..." : primaryLabel}
                <ArrowRight size={18} />
              </Link>

              <Link
                href={orderHref}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
              >
                View Services
                <ArrowRight size={18} />
              </Link>
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
              Ascend Service is your all-in-one platform for high-quality SMM
              services. We help you grow faster and smarter.
            </p>

            <div className="mt-5 flex gap-3">
              {[TelegramIcon, FacebookIcon, TikTokIcon, InstagramIcon].map(
                (Icon, index) => (
                  <div
                    key={index}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-300"
                  >
                    <Icon size={18} />
                  </div>
                ),
              )}
            </div>
          </div>

          {[
            {
              title: "Company",
              links: ["About Us", "Reseller Program", "Affiliates", "API"],
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
              title: "Services",
              links: [
                "All Services",
                "Popular Services",
                "New Services",
                "Service Status",
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
          <p>Made with ❤️ for our customers.</p>
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

function TikTokIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M184.7 72.1c-16.8-10.9-27.7-29.5-27.7-50.5h-39.4v143.8c0 17.7-14.3 32-32 32s-32-14.3-32-32 14.3-32 32-32c4.1 0 8 .8 11.6 2.2V95.8c-3.8-.5-7.6-.8-11.6-.8-39.4 0-71.4 32-71.4 71.4s32 71.4 71.4 71.4 71.4-32 71.4-71.4V94.1c15.3 11 34 17.5 54.2 17.5V72.2c-9.7 0-18.8-2.8-26.5-7.6v7.5Z" />
    </svg>
  );
}

function InstagramIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M128 82.7A45.3 45.3 0 1 0 173.3 128 45.35 45.35 0 0 0 128 82.7Zm0 74.7a29.4 29.4 0 1 1 29.4-29.4 29.43 29.43 0 0 1-29.4 29.4ZM176.6 80.9a10.6 10.6 0 1 1 10.6 10.6 10.6 10.6 0 0 1-10.6-10.6ZM224 128c0-30.5-.1-34.3-.7-46.2-.6-11.9-2.4-20-5.2-27a55.1 55.1 0 0 0-31-31c-7-2.8-15.1-4.6-27-5.2C148.3 18.1 144.5 18 128 18s-20.3.1-32.1.6c-11.9.6-20 2.4-27 5.2a55.1 55.1 0 0 0-31 31c-2.8 7-4.6 15.1-5.2 27C32.1 93.7 32 97.5 32 128s.1 34.3.7 46.2c.6 11.9 2.4 20 5.2 27a55.1 55.1 0 0 0 31 31c7 2.8 15.1 4.6 27 5.2 11.8.5 15.6.6 32.1.6s20.3-.1 32.1-.6c11.9-.6 20-2.4 27-5.2a55.1 55.1 0 0 0 31-31c2.8-7 4.6-15.1 5.2-27 .6-11.9.7-15.7.7-46.2Z" />
    </svg>
  );
}

function YouTubeIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M234.3 73.1a29.2 29.2 0 0 0-20.5-20.6C195.7 47.6 128 47.6 128 47.6s-67.7 0-85.8 4.9a29.2 29.2 0 0 0-20.5 20.6C16.8 91.3 16.8 128 16.8 128s0 36.7 4.9 54.9a29.2 29.2 0 0 0 20.5 20.6c18.1 4.9 85.8 4.9 85.8 4.9s67.7 0 85.8-4.9a29.2 29.2 0 0 0 20.5-20.6c4.9-18.2 4.9-54.9 4.9-54.9s0-36.7-4.9-54.9ZM105.8 162.6V93.4L164 128l-58.2 34.6Z" />
    </svg>
  );
}

function FacebookIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M232 128a104 104 0 1 0-120.25 102.7v-72.65H85.35V128h26.4v-22.9c0-26.05 15.52-40.45 39.25-40.45 11.36 0 23.25 2.03 23.25 2.03v25.55h-13.1c-12.9 0-16.9 8-16.9 16.2V128h28.75l-4.6 30.05h-24.15v72.65A104.03 104.03 0 0 0 232 128Z" />
    </svg>
  );
}

function TelegramIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M226.6 35.7 18.9 115.8c-14.2 5.7-14.1 13.7-2.6 17.2l53.3 16.6 20.4 62.6c2.6 7.1 1.3 9.9 8.8 9.9 5.8 0 8.4-2.6 11.6-5.8l27.9-27.1 58 42.8c10.7 5.9 18.4 2.8 21.1-9.9l38.2-179.9c3.9-15.7-6-22.8-19-16.5ZM79.9 145.8l121.4-76.5c6.1-3.7 11.7-1.7 7.1 2.4L104.4 165.6l-4 42.9-20.5-62.7Z" />
    </svg>
  );
}

function SpotifyIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M128 20C68.4 20 20 68.4 20 128s48.4 108 108 108 108-48.4 108-108S187.6 20 128 20Zm49.5 156.2c-2.4 3.9-7.5 5.1-11.4 2.7-31.2-19-70.5-23.3-116.7-12.8-4.5 1-8.9-1.8-9.9-6.2-1-4.5 1.8-8.9 6.2-9.9 50.6-11.5 94.3-6.5 130.9 15.8 3.9 2.4 5.2 7.5 2.9 11.4Zm15.2-33.8c-3 4.9-9.4 6.4-14.3 3.4-35.7-21.9-90.1-28.2-132.4-15.4-5.5 1.7-11.3-1.4-13-6.9-1.7-5.5 1.4-11.3 6.9-13 48.3-14.7 108.3-7.6 149.4 17.5 4.9 3 6.4 9.4 3.4 14.4Zm1.3-35.2c-42.8-25.4-113.4-27.8-154.3-15.4-6.5 2-13.4-1.7-15.4-8.2-2-6.5 1.7-13.4 8.2-15.4 47-14.2 124.9-11.4 174.1 17.8 5.9 3.5 7.8 11 4.3 16.9-3.5 5.8-11 7.8-16.9 4.3Z" />
    </svg>
  );
}

function XIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M150.7 113.6 233.3 18h-19.6l-71.7 83-57.3-83H18.8l86.6 125.5L18.8 238h19.6l75.7-87.6 60.5 87.6h65.9l-89.8-124.4Zm-26.8 31-8.8-12.5-69.8-99.5h30l56.4 80.4 8.8 12.5 73.2 104.4h-30l-59.8-85.3Z" />
    </svg>
  );
}

function TwitchIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M45 20 28 65v151h52v20h30l20-20h39l59-59V20H45Zm163 127-33 33h-52l-20 20v-20H62V40h146v107Zm-29-74v63h-21V73h21Zm-57 0v63h-21V73h21Z" />
    </svg>
  );
}

function DiscordIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M210.5 55.2A172.6 172.6 0 0 0 167.9 42l-2.1 4.2a158.5 158.5 0 0 1 37.8 18.4 128.2 128.2 0 0 0-151.1 0 158.5 158.5 0 0 1 37.8-18.4L88.2 42a172.6 172.6 0 0 0-42.7 13.2C18.5 96.1 11.1 136 14.8 175.4A171.4 171.4 0 0 0 67.2 202l6.3-8.6a110.2 110.2 0 0 1-33.2-16.8c2.8 2.1 5.5 4 8.2 5.8a128.9 128.9 0 0 0 159 0c2.8-1.8 5.5-3.8 8.2-5.8a110.2 110.2 0 0 1-33.2 16.8l6.3 8.6a171.4 171.4 0 0 0 52.4-26.6c4.4-45.7-7.3-85.2-30.7-120.2ZM88.2 151.7c-10.2 0-18.6-9.5-18.6-21.1s8.2-21.1 18.6-21.1c10.5 0 18.8 9.6 18.6 21.1 0 11.6-8.2 21.1-18.6 21.1Zm79.6 0c-10.2 0-18.6-9.5-18.6-21.1s8.2-21.1 18.6-21.1c10.5 0 18.8 9.6 18.6 21.1 0 11.6-8.2 21.1-18.6 21.1Z" />
    </svg>
  );
}

function GoogleIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M233.5 130.6c0-8.4-.8-16.5-2.2-24.3H128v45.9h59.1c-2.5 13.7-10.3 25.3-21.9 33.1v27h35.5c20.8-19.2 32.8-47.5 32.8-81.7Z"
      />
      <path
        fill="#34A853"
        d="M128 238c29.7 0 54.6-9.8 72.8-26.7l-35.5-27c-9.8 6.6-22.4 10.5-37.3 10.5-28.6 0-52.9-19.3-61.6-45.3H29.7v27.8C47.8 213.2 85 238 128 238Z"
      />
      <path
        fill="#FBBC05"
        d="M66.4 149.5c-2.2-6.6-3.5-13.7-3.5-21.5s1.3-14.9 3.5-21.5V78.7H29.7C22.3 93.6 18 110.3 18 128s4.3 34.4 11.7 49.3l36.7-27.8Z"
      />
      <path
        fill="#EA4335"
        d="M128 61.2c16.2 0 30.7 5.6 42.1 16.5l31.5-31.5C182.6 28.5 157.7 18 128 18 85 18 47.8 42.8 29.7 78.7l36.7 27.8C75.1 80.5 99.4 61.2 128 61.2Z"
      />
    </svg>
  );
}

function MoreIcon({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 256 256"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M60 148a20 20 0 1 1 20-20 20 20 0 0 1-20 20Zm68-40a20 20 0 1 0 20 20 20 20 0 0 0-20-20Zm68 0a20 20 0 1 0 20 20 20 20 0 0 0-20-20Z" />
    </svg>
  );
}
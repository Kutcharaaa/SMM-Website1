"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LayoutDashboard, ShieldCheck, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

type Profile = {
  username: string | null;
  role: string | null;
  avatar_url: string | null;
};

const navItems = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Services",
    href: "/services",
  },
  {
    name: "Reseller",
    href: "/reseller",
  },
  {
    name: "Affiliates",
    href: "/affiliates",
  },
  {
    name: "API",
    href: "/api2",
  },
  {
    name: "Support",
    href: "/support",
  },
];

function getRoleLabel(role: string) {
  if (role === "super_admin") return "Developer";
  if (role === "head_admin") return "Head Admin";
  if (role === "admin") return "Admin";
  return "User";
}

function isAdminRole(role: string) {
  return role === "admin" || role === "head_admin" || role === "super_admin";
}

export default function PublicNavbar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    username: null,
    role: "user",
    avatar_url: null,
  });

  async function loadSession() {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoggedIn(false);
      setProfile({
        username: null,
        role: "user",
        avatar_url: null,
      });
      setLoading(false);
      return;
    }

    setLoggedIn(true);

    const { data } = await supabase
      .from("profiles")
      .select("username, role, avatar_url")
      .eq("id", session.user.id)
      .single();

    setProfile({
      username: data?.username || session.user.email?.split("@")[0] || "User",
      role: data?.role || "user",
      avatar_url: data?.avatar_url || null,
    });

    setLoading(false);
  }

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  const role = profile.role || "user";
  const username = profile.username || "User";
  const adminAccess = isAdminRole(role);
  const avatarInitial = username.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl">
        <div className="mx-auto flex h-24 w-full max-w-[1780px] items-center justify-between gap-6 px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <img
              src="/logo.png"
              alt="Ascend Service"
              className="h-14 w-auto"
            />
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 xl:flex">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "text-slate-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 xl:flex">
            {!loading && !loggedIn && (
              <>
                <Link
                  href="/login"
                  className="rounded-2xl border border-slate-700 bg-slate-900 px-7 py-3.5 text-sm font-black text-white shadow-sm transition hover:border-blue-500 hover:text-blue-400"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            )}

            {!loading && loggedIn && (
              <>
                <div className="flex min-w-[190px] items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="max-w-[120px] truncate text-sm font-black leading-5 text-white">
                      {username}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                        User
                      </span>

                      {adminAccess && (
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                          {getRoleLabel(role)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-sm font-black text-white">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                </div>

                {adminAccess && (
                  <Link
                    href="/admin"
                    className="inline-flex whitespace-nowrap items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                  >
                    <ShieldCheck size={17} />
                    Admin
                  </Link>
                )}

                <Link
                  href="/dashboard"
                  className="inline-flex whitespace-nowrap items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  <LayoutDashboard size={17} />
                  Dashboard
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 text-white xl:hidden"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] xl:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <div className="absolute right-0 top-0 flex h-dvh w-[330px] max-w-[88vw] flex-col overflow-hidden border-l border-slate-800 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-5">
              <img
                src="/logo.png"
                alt="Ascend Service"
                className="h-11 w-auto"
              />

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-950 px-5 py-6">
              <div className="space-y-2">
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`block rounded-2xl px-4 py-3 text-sm font-black transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-slate-800 pt-5">
                {!loading && !loggedIn && (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl border border-slate-700 bg-slate-900 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Login
                    </Link>

                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Get Started
                    </Link>
                  </div>
                )}

                {!loading && loggedIn && (
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm font-black text-white">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={username}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          avatarInitial
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {username}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white">
                            User
                          </span>

                          {adminAccess && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                              {getRoleLabel(role)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {adminAccess && (
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-2xl bg-emerald-600 px-5 py-3 text-center text-sm font-black text-white"
                      >
                        Admin
                      </Link>
                    )}

                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-black text-white"
                    >
                      Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
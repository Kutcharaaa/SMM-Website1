"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  username: string | null;
  role: string | null;
};

export default function Navbar() {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Reseller", href: "/reseller" },
    { name: "API", href: "/api" },
    { name: "Support", href: "/support" },
  ];

  const isAdmin =
    profile?.role === "admin" ||
    profile?.role === "head_admin" ||
    profile?.role === "super_admin";

  async function loadUser() {
    setLoadingAuth(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setUserEmail("");
      setLoadingAuth(false);
      return;
    }

    setUserEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();

    setProfile(data || null);
    setLoadingAuth(false);
  }

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
    setUserEmail("");
    setProfileOpen(false);
    setMenuOpen(false);
    window.location.href = "/";
  }

  function getInitial() {
    const name = profile?.username || userEmail || "U";
    return name.charAt(0).toUpperCase();
  }

  return (
    <header className="border-b border-zinc-800 backdrop-blur-xl bg-black/70 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/">
          <img
            src="/logo.png"
            alt="Ascend Service"
            className="h-14 w-auto cursor-pointer"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition font-medium ${
                  isActive ? "text-blue-400" : "text-white hover:text-blue-400"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {!loadingAuth && !profile && (
            <>
              <Link href="/login" className="hover:text-blue-400 transition">
                Login
              </Link>

              <Link
                href="/register"
                className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-semibold transition"
              >
                Get Started
              </Link>
            </>
          )}

          {!loadingAuth && profile && (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 font-black text-white transition"
              >
                {getInitial()}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-4 w-64 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <p className="font-bold text-white">
                      {profile.username || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {userEmail}
                    </p>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="block rounded-xl px-4 py-3 text-zinc-300 hover:bg-zinc-900 hover:text-white transition"
                    >
                      User Dashboard
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block rounded-xl px-4 py-3 text-blue-400 hover:bg-zinc-900 transition"
                      >
                        Admin Dashboard
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="w-full text-left rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1"
        >
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
          <span className="w-6 h-[2px] bg-white"></span>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/95 backdrop-blur-xl">
          <div className="flex flex-col px-6 py-6 gap-5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`transition font-medium ${
                    isActive ? "text-blue-400" : "text-white hover:text-blue-400"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}

            {!loadingAuth && !profile && (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-400 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}

            {!loadingAuth && profile && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
                  <div className="h-11 w-11 rounded-full bg-blue-600 flex items-center justify-center font-black">
                    {getInitial()}
                  </div>

                  <div>
                    <p className="font-bold">{profile.username || "User"}</p>
                    <p className="text-xs text-zinc-500 truncate max-w-[220px]">
                      {userEmail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-zinc-900"
                  >
                    User Dashboard
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-blue-400 hover:bg-zinc-900"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="text-left rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [plan, setPlan] = useState("Starter");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function getUserProfile() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      setEmail(authData.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "User");
        setPlan(profile.plan || "Starter");
      }
    }

    getUserProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = username
    ? username.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        <div className="hidden xl:block text-right">
          <p className="text-sm font-semibold text-white">
            {username || "User"}
          </p>

          <p className="text-xs text-zinc-500">
            {email || "Loading..."}
          </p>

          <p className="text-xs text-blue-400 capitalize">
            {plan} Account
          </p>
        </div>

        <div className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm">
          {initial}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-4 w-72 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-zinc-800">
            <p className="font-semibold text-white">
              {username || "User"}
            </p>

            <p className="text-xs text-zinc-500 truncate">
              {email}
            </p>

            <p className="text-xs text-blue-400 mt-1 capitalize">
              {plan} Account
            </p>
          </div>

          <a
            href="/dashboard/settings"
            className="block px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Settings
          </a>

          <a
            href="/dashboard/wallet"
            className="block px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Wallet
          </a>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Settings,
  Wallet,
  LogOut,
  ChevronDown,
} from "lucide-react";

export default function UserProfile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function getUserProfile() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", authData.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || "User");
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
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
            {initial}
          </div>

          <ChevronDown
            size={16}
            className="text-slate-400"
          />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
          {initial}
        </div>

        <ChevronDown
          size={16}
          className="hidden text-slate-400 lg:block"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-5">
            <p className="text-base font-black text-slate-900">
              {username || "User"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Ascend Service User
            </p>
          </div>

          <div className="p-2">
            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Settings size={18} />
              Settings
            </a>

            <a
              href="/dashboard/wallet"
              className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Wallet size={18} />
              Wallet
            </a>

            <button
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
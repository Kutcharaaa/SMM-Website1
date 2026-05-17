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

type ProfileData = {
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  avatar_url?: string | null;
};

export default function UserProfile() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function getUserProfile() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, firstname, lastname, avatar_url")
      .eq("id", authData.user.id)
      .single();

    if (profile) {
      const profileData = profile as ProfileData;

      setUsername(
        profileData.username ||
          profileData.firstname ||
          authData.user.email?.split("@")[0] ||
          "User",
      );

      setAvatarUrl(profileData.avatar_url || null);
    }
  }

  useEffect(() => {
    getUserProfile();

    function handleFocus() {
      getUserProfile();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={username || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <ChevronDown
          size={16}
          className="hidden text-slate-400 lg:block"
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-4 w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-slate-900 ring-1 ring-slate-200">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={username || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-900">
                  {username || "User"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Ascend Service User
                </p>
              </div>
            </div>
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
              href="/dashboard/api"
              className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <Wallet size={18} />
              API
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
"use client";

import NotificationsDropdown from "@/components/NotificationsDropdown";
import UserProfile from "@/components/UserProfile";

import { Menu } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useDisplayCurrency } from "@/lib/useDisplayCurrency";
import { useEffect, useState } from "react";

type DashboardTopbarProps = {
  onMenuClick?: () => void;
};

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const [username, setUsername] = useState("User");
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState("Starter");

  const { formatAmount } = useDisplayCurrency();

  async function loadProfile() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, balance, plan")
      .eq("id", authData.user.id)
      .single();

    if (profile) {
      setUsername(profile.username || "User");
      setBalance(Number(profile.balance || 0));
      setPlan(profile.plan || "Starter");
    }
  }

  useEffect(() => {
    loadProfile();

    function handleFocus() {
      loadProfile();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 min-h-20 border-b border-slate-200 bg-[#f8fbff]/95 backdrop-blur">
      <div className="flex min-h-20 w-full min-w-0 items-center justify-between gap-3 px-3 sm:px-4 lg:min-h-24 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
          <button
            type="button"
            onClick={onMenuClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600 lg:hidden"
          >
            <Menu size={24} strokeWidth={2} />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-500">
              Welcome back,
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-2 sm:gap-3">
              <h1 className="min-w-0 truncate text-base font-black text-slate-950 sm:text-xl">
                {username}
              </h1>

              <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white sm:px-3 sm:text-[11px]">
                {plan}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold text-slate-500">
              Wallet Balance
            </p>

            <p className="mt-1 text-xl font-black text-blue-600 lg:text-2xl">
              {formatAmount(balance)}
            </p>
          </div>

          <NotificationsDropdown />

          <UserProfile />
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white/60 px-4 py-2 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-500">
            Wallet Balance
          </p>

          <p className="truncate text-sm font-black text-blue-600">
            {formatAmount(balance)}
          </p>
        </div>
      </div>
    </header>
  );
}
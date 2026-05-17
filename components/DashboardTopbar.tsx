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

export default function DashboardTopbar({
  onMenuClick,
}: DashboardTopbarProps) {
  const [username, setUsername] = useState("User");
  const [balance, setBalance] = useState(0);
  const [plan, setPlan] = useState("Starter");

  const { code, formatAmount, formatPhpAmount } = useDisplayCurrency();

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
    <header className="h-24 border-b border-slate-200 bg-[#f8fbff]">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-5">
          <button
            onClick={onMenuClick}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition hover:bg-blue-50 hover:text-blue-600"
          >
            <Menu size={24} strokeWidth={2} />
          </button>

          <div>
            <p className="text-xs font-semibold text-slate-500">
              Welcome back,
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-950">
                {username}
              </h1>

              <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white">
                {plan}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-500">
              Wallet Balance
            </p>

            <p
              className="mt-1 text-2xl font-black text-blue-600"
              title={
                code === "PHP"
                  ? "Wallet balance stored in PHP"
                  : `Stored value: ${formatPhpAmount(balance)} PHP`
              }
            >
              {formatAmount(balance)}
            </p>

            {code !== "PHP" && (
              <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                Displayed in {code}
              </p>
            )}
          </div>

          <NotificationsDropdown />

          <UserProfile />
        </div>
      </div>
    </header>
  );
}
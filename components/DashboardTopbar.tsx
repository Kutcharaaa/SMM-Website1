"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import UserProfile from "@/components/UserProfile";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function DashboardTopbar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="h-24 border-b border-zinc-900 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8">
      <div>
        <h1 className="text-3xl font-black text-white">
          Dashboard
        </h1>

        <p className="text-sm text-zinc-500 mt-1">
          Welcome back to Ascend Service
        </p>
      </div>

      <div className="flex items-center gap-6 text-white">
        <button className="text-xl hover:text-zinc-400 transition">🌐</button>
        <button className="text-xl hover:text-zinc-400 transition">$</button>
        <button className="text-xl hover:text-zinc-400 transition">☾</button>
        <NotificationsDropdown />

        <UserProfile />
      </div>
    </header>
  );
}
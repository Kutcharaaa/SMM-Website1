"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRight, LayoutDashboard, Lock, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

export default function PublicHeroActions() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  async function checkSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setLoggedIn(!!session?.user);
    setLoading(false);
  }

  useEffect(() => {
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session?.user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <div className="h-[56px] w-[160px] animate-pulse rounded-2xl bg-blue-100" />
        <div className="h-[56px] w-[180px] animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 sm:flex-row">
      {loggedIn ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
      ) : (
        <Link
          href="/register"
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Rocket size={20} />
          Get Started
        </Link>
      )}

      <Link
        href="/services"
        className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-black text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
      >
        <Lock size={20} />
        View Services
        <ArrowRight size={18} />
      </Link>
    </div>
  );
}
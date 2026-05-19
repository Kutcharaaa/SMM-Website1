"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setAllowed(false);
        setChecking(false);
        router.replace("/login");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAllowed(false);
        router.replace("/login");
      } else {
        setAllowed(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f9fc] p-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-bold text-slate-500">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
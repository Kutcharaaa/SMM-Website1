"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DashboardGuardProps = {
  children: ReactNode;
};

export default function DashboardGuard({
  children,
}: DashboardGuardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setAllowed(true);
      setLoading(false);
    }

    checkAccess();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Checking session...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
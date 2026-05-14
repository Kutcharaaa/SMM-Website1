"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminGuardProps = {
  children: ReactNode;
  allowedRoles: string[];
};

export default function AdminGuard({
  children,
  allowedRoles,
}: AdminGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const rolesKey = useMemo(() => allowedRoles.join(","), [allowedRoles]);

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

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile?.role) {
        router.replace("/dashboard");
        return;
      }

      if (!allowedRoles.includes(profile.role)) {
        router.replace("/dashboard");
        return;
      }

      setAllowed(true);
      setLoading(false);
    }

    checkAccess();
  }, [router, rolesKey]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">Checking permission...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
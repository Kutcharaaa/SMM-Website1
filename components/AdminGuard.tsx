"use client";

import { ReactNode, useEffect, useState } from "react";
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

  useEffect(() => {
    async function checkAccess() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single();

      if (!profile || !allowedRoles.includes(profile.role)) {
        router.push("/admin");
        return;
      }

      setAllowed(true);
      setLoading(false);
    }

    checkAccess();
  }, [router, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-zinc-500">Checking permission...</p>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
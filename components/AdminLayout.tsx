"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabase";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
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

      const adminRoles = ["admin", "head_admin", "super_admin"];

      if (!profile || !adminRoles.includes(profile.role)) {
        router.push("/dashboard");
        return;
      }

      setAllowed(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-400">Checking admin access...</p>
      </main>
    );
  }

  if (!allowed) return null;

  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}
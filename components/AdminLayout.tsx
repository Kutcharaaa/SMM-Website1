"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";
import { useEffect, useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    const syncSidebarState = () => {
      setSidebarMinimized(
        localStorage.getItem("admin_sidebar_minimized") === "true"
      );
    };

    syncSidebarState();

    const interval = setInterval(syncSidebarState, 300);

    window.addEventListener("storage", syncSidebarState);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", syncSidebarState);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <AdminSidebar />

      <section
        className={`min-h-screen transition-all duration-300 ${
          sidebarMinimized ? "lg:pl-24" : "lg:pl-72"
        }`}
      >
        <AdminTopbar />

        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </section>
    </main>
  );
}
"use client";

import { ReactNode, useState } from "react";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <section className="min-h-screen lg:ml-[260px]">
        <DashboardTopbar
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
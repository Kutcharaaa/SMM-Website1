"use client";

import { ReactNode, useState } from "react";

import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] text-slate-900">
      <DashboardSidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <section className="min-h-screen min-w-0 lg:ml-[260px]">
        <DashboardTopbar onMenuClick={() => setMobileSidebarOpen(true)} />

        <div className="w-full min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </section>
    </main>
  );
}
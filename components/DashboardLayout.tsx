import { ReactNode } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">{children}</div>
      </section>
    </main>
  );
}
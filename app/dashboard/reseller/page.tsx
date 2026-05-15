"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";

export default function DashboardResellerPage() {
  return (
    <DashboardGuard>
      <DashboardLayout>
        <h2 className="text-4xl font-black mb-4">Reseller</h2>

        <p className="text-zinc-400">
          Reseller level, points, and conversion system will be added here.
        </p>
      </DashboardLayout>
    </DashboardGuard>
  );
}
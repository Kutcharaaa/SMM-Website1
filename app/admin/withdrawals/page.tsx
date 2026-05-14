"use client";

import AdminSidebar from "@/components/AdminSidebar";
import AdminTopbar from "@/components/AdminTopbar";

export default function AdminWithdrawalsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <AdminSidebar />

      <section className="lg:ml-72 min-h-screen">
        <AdminTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Owner Withdrawals</h2>

          <p className="text-zinc-400">
            Owner withdrawal tracking will be added here.
          </p>
        </div>
      </section>
    </main>
  );
}
import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import RecentOrders from "@/components/RecentOrders";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
            User Dashboard
          </p>

          <h2 className="mt-2 text-4xl font-black text-slate-950">
            Overview
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500">
            Track your wallet balance, orders, tickets, reseller progress, and
            growth activity in one place.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/dashboard/new-order"
            className="rounded-2xl bg-blue-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            New Order
          </a>

          <a
            href="/dashboard/add-funds"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
          >
            Add Funds
          </a>
        </div>
      </div>

      <div className="space-y-8">
        <DashboardStats />

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <QuickActions />
          </div>

          <div className="xl:col-span-2">
            <RecentOrders />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
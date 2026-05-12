import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import RecentOrders from "@/components/RecentOrders";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <h2 className="text-4xl font-black mb-4">Overview</h2>

      <p className="text-zinc-400 mb-8">
        Track your orders, wallet balance, tickets, and growth activity.
      </p>

      <DashboardStats />

      <QuickActions />

      <RecentOrders />
    </DashboardLayout>
  );
}
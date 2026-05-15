import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";
import QuickActions from "@/components/QuickActions";
import RecentOrders from "@/components/RecentOrders";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardStats />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RecentOrders />
          </div>

          <div className="xl:col-span-1">
            <QuickActions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
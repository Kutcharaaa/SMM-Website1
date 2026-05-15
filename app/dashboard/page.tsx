import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";
import RecentOrders from "@/components/RecentOrders";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardStats />

        <div className="grid gap-6 xl:grid-cols-2">
          <div>
            {/* Later: Reseller Level Card */}
          </div>

          <div>
            {/* Later: Reseller Points Card */}
          </div>
        </div>

        <RecentOrders />
      </div>
    </DashboardLayout>
  );
}
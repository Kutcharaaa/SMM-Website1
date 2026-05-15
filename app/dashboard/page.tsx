import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";
import RecentOrders from "@/components/RecentOrders";

import ResellerLevelCard from "@/components/ResellerLevelCard";
import ResellerPointsCard from "@/components/ResellerPointsCard";
import LatestAnnouncements from "@/components/LatestAnnouncements";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardStats />

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1">
            <ResellerLevelCard />
          </div>

          <div className="xl:col-span-1">
            <ResellerPointsCard />
          </div>

          <div className="xl:col-span-1">
            <LatestAnnouncements />
          </div>
        </div>

        <RecentOrders />
      </div>
    </DashboardLayout>
  );
}
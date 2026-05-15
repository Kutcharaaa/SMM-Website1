import DashboardLayout from "@/components/DashboardLayout";
import DashboardStats from "@/components/DashboardStats";

import ResellerLevelCard from "@/components/ResellerLevelCard";
import ResellerPointsCard from "@/components/ResellerPointsCard";
import LatestAnnouncements from "@/components/LatestAnnouncements";
import TopResellers from "@/components/TopResellers";

import RecentOrders from "@/components/RecentOrders";
import RecentPayments from "@/components/RecentPayments";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <DashboardStats />

        <div className="grid gap-6 xl:grid-cols-4">
          <ResellerLevelCard />

          <ResellerPointsCard />

          <LatestAnnouncements />

          <TopResellers />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <RecentOrders />

          <RecentPayments />
        </div>
      </div>
    </DashboardLayout>
  );
}
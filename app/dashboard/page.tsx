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

        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <ResellerLevelCard />
          </div>

          <div className="xl:col-span-2">
            <ResellerPointsCard />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <RecentOrders />

          <LatestAnnouncements />
        </div>
      </div>
    </DashboardLayout>
  );
}
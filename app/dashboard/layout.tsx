import DashboardAuthGuard from "@/components/DashboardAuthGuard";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardAuthGuard>{children}</DashboardAuthGuard>;
}
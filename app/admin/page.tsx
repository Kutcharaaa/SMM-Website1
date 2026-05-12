import AdminLayout from "@/components/AdminLayout";
import AdminStats from "@/components/AdminStats";

export default function AdminPage() {
  return (
    <AdminLayout>
      <h2 className="text-4xl font-black mb-4">
        Admin Overview
      </h2>

      <p className="text-zinc-400">
        Welcome to the Ascend Service administration panel.
      </p>

      <AdminStats />
    </AdminLayout>
  );
}
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">Settings</h2>

          <p className="text-zinc-400 mb-8">
            Manage your account, security, preferences, and notifications.
          </p>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
              <h3 className="text-2xl font-black mb-6">Profile</h3>

              <div className="flex flex-col gap-5">
                <input
                  type="text"
                  placeholder="Full name"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  type="email"
                  placeholder="Email address"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <button className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition">
                  Save Profile
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
              <h3 className="text-2xl font-black mb-6">Security</h3>

              <div className="flex flex-col gap-5">
                <input
                  type="password"
                  placeholder="Current password"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <input
                  type="password"
                  placeholder="New password"
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />

                <button className="bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold transition">
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
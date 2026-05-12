import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopbar from "@/components/DashboardTopbar";

export default function ApiPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <DashboardSidebar />

      <section className="lg:ml-72 min-h-screen">
        <DashboardTopbar />

        <div className="p-8">
          <h2 className="text-4xl font-black mb-4">API Access</h2>

          <p className="text-zinc-400 mb-8">
            Connect your reseller website or app to Ascend Service.
          </p>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
              <h3 className="text-2xl font-black mb-6">API Key</h3>

              <div className="bg-black border border-zinc-800 rounded-xl px-4 py-4 mb-5 text-zinc-400">
                sk_live_xxxxxxxxxxxxxxxxxxxxxx
              </div>

              <button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-5 py-3 font-semibold transition">
                Generate New Key
              </button>
            </div>

            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-8">
              <h3 className="text-2xl font-black mb-4">Reseller API</h3>

              <p className="text-zinc-400 text-sm mb-6">
                API access is available for Reseller and Agency plans.
              </p>

              <a
                href="/api"
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                View API Docs →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
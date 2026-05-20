"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { BarChart3, CheckCircle2, Loader2, RefreshCw, Store, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ title, value, subtitle, icon: Icon, tone }: { title: string; value: string; subtitle: string; icon: any; tone: string }) {
  const color = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", purple: "bg-purple-50 text-purple-700", orange: "bg-orange-50 text-orange-700" }[tone] || "bg-slate-100 text-slate-700";
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex gap-4"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}><Icon size={23}/></div><div><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p><h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3><p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p></div></div></div>;
}

export default function AdminChildPanelReportsPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [summary, setSummary] = useState<any>({});
  const [reports, setReports] = useState<any[]>([]);

  async function loadReports() {
    setLoading(true);
    setMessage("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setMessage("Please login again."); setLoading(false); return; }
    const response = await fetch("/api/admin/child-panel/reports", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` } });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) { setMessage(result?.message || "Failed to load reports."); setLoading(false); return; }
    setSummary(result.summary || {});
    setReports(result.reports || []);
    setLoading(false);
  }

  useEffect(() => { loadReports(); }, []);

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div><h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Child Panel Reports</h2><p className="mt-2 text-sm font-semibold text-slate-500">Platform-wide child panel revenue, profit, deposits, and panel performance.</p></div>
            <button onClick={loadReports} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50"><RefreshCw size={17}/> Refresh</button>
          </div>
          {message && <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">{message}</div>}
          {loading && <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500"><Loader2 className="mx-auto animate-spin"/> Loading reports...</div>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Active Panels" value={`${summary.active_panels || 0}/${summary.total_panels || 0}`} subtitle="Active / total child panels" icon={Store} tone="blue" />
            <StatCard title="Customer Revenue" value={formatMoney(summary.total_customer_revenue)} subtitle="Child customer paid" icon={Wallet} tone="green" />
            <StatCard title="Base Cost" value={formatMoney(summary.total_base_cost)} subtitle="Base order cost" icon={BarChart3} tone="orange" />
            <StatCard title="Owner Profit" value={formatMoney(summary.total_owner_profit)} subtitle="Total markup profit" icon={CheckCircle2} tone="purple" />
          </div>
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h3 className="text-xl font-black text-slate-950">Panel Performance</h3><p className="mt-1 text-sm font-semibold text-slate-500">Sorted by owner profit.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4 text-left">Panel</th><th className="px-5 py-4 text-left">Status</th><th className="px-5 py-4 text-left">Orders</th><th className="px-5 py-4 text-left">Revenue</th><th className="px-5 py-4 text-left">Base</th><th className="px-5 py-4 text-left">Profit</th><th className="px-5 py-4 text-left">Deposits</th><th className="px-5 py-4 text-left">Markup</th></tr></thead><tbody>{reports.length <= 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">No child panel report data yet.</td></tr> : reports.map((row) => <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-5 py-5"><p className="font-black text-slate-900">{row.panel_name}</p><p className="mt-1 text-xs font-semibold text-slate-500">/{row.panel_slug}</p></td><td className="px-5 py-5 font-black capitalize text-slate-700">{row.status}</td><td className="px-5 py-5 font-black text-slate-700">{row.total_orders}</td><td className="px-5 py-5 font-black text-emerald-600">{formatMoney(row.customer_revenue)}</td><td className="px-5 py-5 font-black text-orange-600">{formatMoney(row.base_cost)}</td><td className="px-5 py-5 font-black text-purple-600">{formatMoney(row.owner_profit)}</td><td className="px-5 py-5 font-black text-blue-600">{formatMoney(row.approved_deposits)}</td><td className="px-5 py-5 font-black text-slate-700">{Number(row.markup_percent || 0)}%</td></tr>)}</tbody></table></div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

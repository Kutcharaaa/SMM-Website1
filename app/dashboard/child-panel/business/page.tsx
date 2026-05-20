"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/components/ToastProvider";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  CheckCircle2,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CustomerOrder = {
  id: string;
  main_order_id: string | null;
  service_name: string;
  link: string;
  quantity: number | null;
  base_price: number | null;
  customer_price: number | null;
  markup_percent: number | null;
  owner_profit: number | null;
  status: string | null;
  provider_order_id: string | null;
  provider_name: string | null;
  comments?: string | null;
  order_type?: string | null;
  created_at: string;
  child_panel_customers?: any;
};

type CustomerDeposit = {
  id: string;
  amount: number | null;
  method: string | null;
  reference_number: string | null;
  proof_url: string | null;
  status: string | null;
  reject_reason: string | null;
  created_at: string;
  child_panel_customers?: any;
};

type PaymentMethod = {
  id: string;
  method_name: string;
  account_name: string | null;
  account_number: string | null;
  qr_url: string | null;
  instructions: string | null;
  status: string;
  created_at: string;
};

function formatMoney(value: number | string | null | undefined) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCustomerName(row: any) {
  const customer = Array.isArray(row?.child_panel_customers)
    ? row.child_panel_customers[0]
    : row?.child_panel_customers;

  if (!customer) return "Unknown Customer";
  const fullName = `${customer.firstname || ""} ${customer.lastname || ""}`.trim();
  return fullName || customer.username || customer.email || "Unknown Customer";
}

function getStatusClass(status?: string | null) {
  const clean = String(status || "pending").toLowerCase();
  if (clean === "completed" || clean === "approved") return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  if (clean === "processing" || clean === "partial") return "bg-blue-50 text-blue-700 ring-blue-100";
  if (clean === "failed" || clean === "rejected" || clean === "cancelled") return "bg-red-50 text-red-700 ring-red-100";
  return "bg-orange-50 text-orange-700 ring-orange-100";
}

function StatCard({ title, value, subtitle, icon: Icon, tone }: { title: string; value: string; subtitle: string; icon: any; tone: string }) {
  const color = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-purple-50 text-purple-700",
    orange: "bg-orange-50 text-orange-700",
  }[tone] || "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          <Icon size={23} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <h3 className="mt-2 truncate text-2xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function ChildPanelBusinessPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [deposits, setDeposits] = useState<CustomerDeposit[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [methodId, setMethodId] = useState("");
  const [methodName, setMethodName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [status, setStatus] = useState("active");

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.customer_price || 0), 0);
    const totalBase = orders.reduce((sum, o) => sum + Number(o.base_price || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + Number(o.owner_profit || 0), 0);
    const pending = orders.filter((o) => ["pending", "processing", "partial"].includes(String(o.status || "").toLowerCase())).length;
    const completed = orders.filter((o) => String(o.status || "").toLowerCase() === "completed").length;
    const todayKey = new Date().toDateString();
    const todayProfit = orders
      .filter((o) => new Date(o.created_at).toDateString() === todayKey)
      .reduce((sum, o) => sum + Number(o.owner_profit || 0), 0);
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const monthProfit = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, o) => sum + Number(o.owner_profit || 0), 0);
    return { totalRevenue, totalBase, totalProfit, pending, completed, todayProfit, monthProfit };
  }, [orders]);

  const ledger = useMemo(() => {
    const orderRows = orders.map((o) => ({
      id: `order-${o.id}`,
      date: o.created_at,
      type: "Order Profit",
      description: o.service_name,
      amount: Number(o.owner_profit || 0),
      status: o.status || "pending",
    }));
    const depositRows = deposits.map((d) => ({
      id: `deposit-${d.id}`,
      date: d.created_at,
      type: "Customer Deposit",
      description: `${getCustomerName(d)} · ${d.method || "Method"}`,
      amount: Number(d.amount || 0),
      status: d.status || "pending",
    }));
    return [...orderRows, ...depositRows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [orders, deposits]);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }

  async function loadAll() {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      showToast("Please login again.", "error");
      setLoading(false);
      return;
    }

    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const [ordersRes, depositsRes, methodsRes] = await Promise.all([
      fetch("/api/child-panel/owner/orders/list", { method: "POST", headers }),
      fetch("/api/child-panel/owner/deposits/list", { method: "POST", headers }),
      fetch("/api/child-panel/owner/payment-methods/list", { method: "POST", headers }),
    ]);

    const ordersData = await ordersRes.json().catch(() => null);
    const depositsData = await depositsRes.json().catch(() => null);
    const methodsData = await methodsRes.json().catch(() => null);

    if (ordersData?.success) setOrders(ordersData.orders || []);
    if (depositsData?.success) setDeposits(depositsData.deposits || []);
    if (methodsData?.success) setMethods(methodsData.methods || []);

    if (!ordersData?.success) showToast(ordersData?.message || "Failed to load orders.", "error");
    if (!depositsData?.success) showToast(depositsData?.message || "Failed to load deposits.", "error");
    if (!methodsData?.success) showToast(methodsData?.message || "Failed to load payment methods.", "error");
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  function resetMethodForm() {
    setMethodId("");
    setMethodName("");
    setAccountName("");
    setAccountNumber("");
    setQrUrl("");
    setInstructions("");
    setStatus("active");
  }

  function editMethod(method: PaymentMethod) {
    setMethodId(method.id);
    setMethodName(method.method_name || "");
    setAccountName(method.account_name || "");
    setAccountNumber(method.account_number || "");
    setQrUrl(method.qr_url || "");
    setInstructions(method.instructions || "");
    setStatus(method.status || "active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadQr(file?: File | null) {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      showToast("QR must be PNG, JPG, or WEBP.", "error");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast("QR must be 3MB or smaller.", "error");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showToast("Please login again.", "error");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${Date.now()}-payment-method.${ext}`;
    const { error } = await supabase.storage.from("child-panel-payment-methods").upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      showToast(error.message, "error");
      return;
    }
    const { data } = supabase.storage.from("child-panel-payment-methods").getPublicUrl(path);
    setQrUrl(data.publicUrl);
    showToast("QR uploaded.", "success");
  }

  async function saveMethod() {
    if (saving) return;
    setSaving(true);
    const token = await getToken();
    if (!token) {
      showToast("Please login again.", "error");
      setSaving(false);
      return;
    }
    const response = await fetch("/api/child-panel/owner/payment-methods/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ methodId, methodName, accountName, accountNumber, qrUrl, instructions, status }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      showToast(result?.message || "Failed to save payment method.", "error");
      setSaving(false);
      return;
    }
    showToast(result.message || "Payment method saved.", "success");
    resetMethodForm();
    await loadAll();
    setSaving(false);
  }

  async function deleteMethod(id: string) {
    const token = await getToken();
    if (!token) return;
    const response = await fetch("/api/child-panel/owner/payment-methods/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ methodId: id }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      showToast(result?.message || "Failed to delete payment method.", "error");
      return;
    }
    showToast("Payment method deleted.", "success");
    await loadAll();
  }

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
                <BarChart3 size={15} /> Business Center
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Child Panel Business</h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Earnings, order status, transaction ledger, and reseller-owned payment methods.
              </p>
            </div>
            <button onClick={loadAll} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50">
              <RefreshCw size={17} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-500 shadow-sm">
              <Loader2 className="mx-auto animate-spin" /> Loading business data...
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Customer Revenue" value={formatMoney(summary.totalRevenue)} subtitle="Total customer paid" icon={Wallet} tone="blue" />
            <StatCard title="Base Cost" value={formatMoney(summary.totalBase)} subtitle="Ascend base cost" icon={CreditCard} tone="orange" />
            <StatCard title="Owner Profit" value={formatMoney(summary.totalProfit)} subtitle="Markup earnings" icon={BarChart3} tone="purple" />
            <StatCard title="This Month Profit" value={formatMoney(summary.monthProfit)} subtitle={`Today: ${formatMoney(summary.todayProfit)}`} icon={CheckCircle2} tone="green" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h2 className="text-xl font-black text-slate-950">Customer Orders Status</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Monitor customer price, base cost, profit, and synced order status.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Customer</th>
                      <th className="px-5 py-4 text-left">Service</th>
                      <th className="px-5 py-4 text-left">Paid</th>
                      <th className="px-5 py-4 text-left">Base</th>
                      <th className="px-5 py-4 text-left">Profit</th>
                      <th className="px-5 py-4 text-left">Status</th>
                      <th className="px-5 py-4 text-left">Main Order</th>
                      <th className="px-5 py-4 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length <= 0 ? (
                      <tr><td colSpan={8} className="px-5 py-12 text-center font-semibold text-slate-500">No customer orders yet.</td></tr>
                    ) : orders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-5 py-5 font-black text-slate-800">{getCustomerName(order)}</td>
                        <td className="px-5 py-5"><p className="max-w-[280px] truncate font-black text-slate-900">{order.service_name}</p><a href={order.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600">Open Link</a></td>
                        <td className="px-5 py-5 font-black text-emerald-600">{formatMoney(order.customer_price)}</td>
                        <td className="px-5 py-5 font-black text-slate-700">{formatMoney(order.base_price)}</td>
                        <td className="px-5 py-5 font-black text-purple-600">{formatMoney(order.owner_profit)}</td>
                        <td className="px-5 py-5"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusClass(order.status)}`}>{order.status || "pending"}</span></td>
                        <td className="px-5 py-5 font-bold text-slate-600">{order.main_order_id ? `#${order.main_order_id.slice(0, 8).toUpperCase()}` : "—"}</td>
                        <td className="px-5 py-5 font-semibold text-slate-500">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Payment Methods</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">These appear in your child panel customer Add Funds modal.</p>

              <div className="mt-5 grid gap-4">
                <input value={methodName} onChange={(e) => setMethodName(e.target.value)} placeholder="Method Name e.g. GCash" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" />
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Account Name" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" />
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account Number / Wallet Address" className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none" />
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Payment instructions" className="min-h-24 rounded-2xl border border-slate-200 p-4 text-sm font-bold outline-none" />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  {qrUrl ? <img src={qrUrl} alt="QR" className="h-24 w-24 rounded-2xl object-cover" /> : <p className="text-sm font-semibold text-slate-500">No QR uploaded</p>}
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
                    <Upload size={16} /> Upload QR
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => uploadQr(e.target.files?.[0])} className="hidden" />
                  </label>
                </div>

                <div className="flex gap-3">
                  <button onClick={saveMethod} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Method
                  </button>
                  {methodId && <button onClick={resetMethodForm} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700">Cancel</button>}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {methods.map((method) => (
                  <div key={method.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-950">{method.method_name}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{method.account_name || "No name"} · {method.account_number || "No number"}</p>
                        <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${method.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{method.status}</span>
                      </div>
                      {method.qr_url && <a href={method.qr_url} target="_blank" rel="noreferrer"><Eye size={18} /></a>}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => editMethod(method)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">Edit</button>
                      <button onClick={() => deleteMethod(method.id)} className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-xl font-black text-slate-950">Transaction Ledger</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Combined view of deposits and order profits.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Type</th><th className="px-5 py-4 text-left">Description</th><th className="px-5 py-4 text-left">Amount</th><th className="px-5 py-4 text-left">Status</th></tr>
                </thead>
                <tbody>
                  {ledger.length <= 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No ledger entries yet.</td></tr> : ledger.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-semibold text-slate-500">{formatDateTime(row.date)}</td>
                      <td className="px-5 py-4 font-black text-slate-800">{row.type}</td>
                      <td className="px-5 py-4 font-semibold text-slate-600">{row.description}</td>
                      <td className="px-5 py-4 font-black text-slate-900">{formatMoney(row.amount)}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusClass(row.status)}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

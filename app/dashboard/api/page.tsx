"use client";

import DashboardGuard from "@/components/DashboardGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";
import {
  AlertCircle,
  CheckSquare,
  Clock3,
  Code2,
  Copy,
  Database,
  Eye,
  EyeOff,
  Globe2,
  Info,
  KeyRound,
  Layers3,
  Lock,
  RefreshCcw,
  Rocket,
  Server,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ProfileData = {
  id: string;
  balance?: number | string | null;
  api_key?: string | null;
};

type ApiOrder = {
  id: string;
  created_at: string;
  status?: string | null;
  order_source?: string | null;
};

type CodeTab = "curl" | "php" | "javascript" | "python";
type ActionTab = "add" | "status" | "balance" | "services";

const API_RATE_LIMIT = 60;

const endpoints = [
  {
    action: "services",
    endpoint: "/api/v2",
    description: "Get list of all available services",
    required: "key",
    color: "bg-blue-100 text-blue-700",
  },
  {
    action: "add",
    endpoint: "/api/v2",
    description: "Create a new order",
    required: "key, service, link, quantity",
    color: "bg-green-100 text-green-700",
  },
  {
    action: "status",
    endpoint: "/api/v2",
    description: "Get order status",
    required: "key, order",
    color: "bg-purple-100 text-purple-700",
  },
  {
    action: "balance",
    endpoint: "/api/v2",
    description: "Check wallet/API balance",
    required: "key",
    color: "bg-orange-100 text-orange-700",
  },
];

export default function ApiPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [apiOrders, setApiOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>("curl");
  const [activeActionTab, setActiveActionTab] = useState<ActionTab>("add");

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v2`
      : "https://ascend-service.org/api/v2";

  async function loadApiData() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setApiOrders([]);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, balance, api_key")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("API_PROFILE_ERROR:", profileError.message);
      setProfile(null);
      setApiOrders([]);
      setLoading(false);
      return;
    }

    setProfile((profileData || null) as ProfileData | null);

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at, status, order_source")
      .eq("user_id", user.id)
      .eq("order_source", "api")
      .order("created_at", { ascending: false })
      .limit(500);

    if (ordersError) {
      console.warn("API_ORDERS_NOT_READY:", ordersError.message);
      setApiOrders([]);
    } else {
      setApiOrders((ordersData || []) as ApiOrder[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadApiData();
  }, []);

  const balance = toNumber(profile?.balance);
  const apiKey = profile?.api_key || "No API key yet";

  const maskedApiKey = useMemo(() => {
    if (!profile?.api_key) return "No API key yet";
    if (showApiKey) return profile.api_key;

    if (profile.api_key.length <= 14) {
      return `${profile.api_key.slice(0, 4)}••••••`;
    }

    return `${profile.api_key.slice(0, 10)}••••••••••${profile.api_key.slice(-6)}`;
  }, [profile?.api_key, showApiKey]);

  const completedApiOrders = apiOrders.filter((order) => {
    const status = (order.status || "").toLowerCase();
    return (
      status.includes("completed") ||
      status.includes("success") ||
      status.includes("done")
    );
  }).length;

  const successRate =
    apiOrders.length > 0 ? (completedApiOrders / apiOrders.length) * 100 : 100;

  async function copyText(text: string, type: "key" | "baseUrl" | "example") {
    try {
      await navigator.clipboard.writeText(text);

      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 1600);
      }

      if (type === "baseUrl") {
        setCopiedBaseUrl(true);
        setTimeout(() => setCopiedBaseUrl(false), 1600);
      }

      if (type === "example") {
        setCopiedExample(true);
        setTimeout(() => setCopiedExample(false), 1600);
      }
    } catch {
      alert("Unable to copy.");
    }
  }

  async function generateApiKey() {
    const confirmReset = window.confirm(
      "Generate a new API key? Your current API key will stop working.",
    );

    if (!confirmReset) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const newKey = `as_live_${crypto.randomUUID().replace(/-/g, "")}`;

    const { error } = await supabase
      .from("profiles")
      .update({
        api_key: newKey,
      })
      .eq("id", user.id);

    if (error) {
      console.error("RESET_API_KEY_ERROR:", error.message);
      alert(error.message);
      return;
    }

    await loadApiData();
    setShowApiKey(true);
  }

  const exampleCode = getExampleCode(
    activeCodeTab,
    activeActionTab,
    baseUrl,
    profile?.api_key || "YOUR_API_KEY",
  );

  const exampleResponse = getExampleResponse(activeActionTab);

  return (
    <DashboardGuard>
      <DashboardLayout>
        <div className="min-w-0 text-slate-950">
            <div>
              <h1 className="text-3xl font-black text-slate-950">API</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                Dashboard / API
              </p>
            </div>

            <section className="mt-6 grid min-w-0 grid-cols-1 gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                    <KeyRound size={22} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black text-slate-950">
                      Your API Key
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Use this API key to authenticate your requests.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    readOnly
                    value={maskedApiKey}
                    className="h-14 min-w-0 flex-1 bg-transparent px-4 font-mono text-sm font-black text-slate-800 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => copyText(apiKey, "key")}
                    disabled={!profile?.api_key}
                    className="flex h-14 w-14 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Copy API key"
                  >
                    <Copy size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowApiKey((current) => !current)}
                    disabled={!profile?.api_key}
                    className="flex h-14 w-14 items-center justify-center border-l border-slate-200 bg-white text-slate-500 transition hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Show or hide API key"
                  >
                    {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    Keep your API key secure and never share it with anyone.
                  </p>

                  {copiedKey && (
                    <p className="text-sm font-black text-green-600">
                      API key copied.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="text-lg font-black text-slate-950">
                  Reset API Key
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Generate a new API key. This will revoke your current key.
                </p>

                <button
                  type="button"
                  onClick={generateApiKey}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 sm:w-fit"
                >
                  <RefreshCcw size={17} />
                  Reset API Key
                </button>
              </div>
            </section>

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Database}
                title="API Balance"
                value={loading ? "..." : `₱${formatMoney(balance)}`}
                subtitle="Available in wallet"
                color="bg-blue-600 text-white"
              />

              <StatCard
                icon={ShoppingCart}
                title="Total API Orders"
                value={loading ? "..." : apiOrders.length.toLocaleString()}
                subtitle="All time orders via API"
                color="bg-green-600 text-white"
              />

              <StatCard
                icon={TrendingUp}
                title="Success Rate"
                value={loading ? "..." : `${successRate.toFixed(1)}%`}
                subtitle="Based on API orders"
                color="bg-purple-600 text-white"
              />

              <StatCard
                icon={Clock3}
                title="Rate Limit"
                value={`${API_RATE_LIMIT} / 60`}
                subtitle="Requests per minute"
                color="bg-orange-500 text-white"
              />
            </section>

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <Rocket size={24} className="text-blue-600" />
                  <div>
                    <h3 className="truncate text-xl font-black text-slate-950">
                      Quick Start
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Follow these simple steps to get started
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    "Get your API key above",
                    "Send POST requests to /api/v2",
                    "Use action=services, add, status, or balance",
                    "Use the returned order ID to check status",
                  ].map((item, index) => (
                    <div key={item} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-bold text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                  Use form-data or x-www-form-urlencoded body parameters.
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <Globe2 size={24} className="text-blue-600" />
                  <div>
                    <h3 className="truncate text-xl font-black text-slate-950">
                      Base URL
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      All API requests should be sent to this base URL
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <input
                    readOnly
                    value={baseUrl}
                    className="h-14 min-w-0 flex-1 bg-transparent px-4 font-mono text-sm font-black text-blue-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => copyText(baseUrl, "baseUrl")}
                    className="flex h-14 w-14 items-center justify-center bg-blue-600 text-white transition hover:bg-blue-700"
                  >
                    <Copy size={20} />
                  </button>
                </div>

                {copiedBaseUrl && (
                  <p className="mt-3 text-sm font-black text-green-600">
                    Base URL copied.
                  </p>
                )}

                <div className="mt-5 rounded-xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">
                  All requests must be POST requests with form data.
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Layers3 size={24} className="text-blue-600" />
                <div>
                  <h3 className="text-xl font-black text-slate-950">
                    API Endpoints
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Available API actions and required parameters
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-4 text-left font-black">Action</th>
                        <th className="p-4 text-left font-black">Endpoint</th>
                        <th className="p-4 text-left font-black">Description</th>
                        <th className="p-4 text-left font-black">
                          Required Parameters
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {endpoints.map((endpoint) => (
                        <tr key={endpoint.action} className="border-t border-slate-100">
                          <td className="p-4">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black ${endpoint.color}`}
                            >
                              {endpoint.action}
                            </span>
                          </td>

                          <td className="p-4 font-mono font-black text-slate-700">
                            {endpoint.endpoint}
                          </td>

                          <td className="p-4 font-semibold text-slate-600">
                            {endpoint.description}
                          </td>

                          <td className="p-4 font-mono text-sm font-black text-slate-600">
                            {endpoint.required}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="mt-5 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <Code2 size={24} className="text-blue-600" />
                  <div>
                    <h3 className="truncate text-xl font-black text-slate-950">
                      Example Request
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Select an API action and language example.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
                  {(["add", "status", "balance", "services"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveActionTab(tab)}
                      className={`shrink-0 rounded-xl px-4 py-2 text-sm font-black capitalize transition ${
                        activeActionTab === tab
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="mt-5 border-b border-slate-200">
                  <div className="flex gap-2 overflow-x-auto">
                    {(["curl", "php", "javascript", "python"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveCodeTab(tab)}
                        className={`shrink-0 border-b-2 px-5 py-3 text-sm font-black capitalize transition ${
                          activeCodeTab === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-blue-600"
                        }`}
                      >
                        {tab === "curl" ? "cURL" : tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative mt-5 overflow-hidden rounded-xl bg-[#071225]">
                  <button
                    type="button"
                    onClick={() => copyText(exampleCode, "example")}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-blue-50"
                  >
                    <Copy size={17} />
                  </button>

                  <pre className="max-h-[360px] overflow-auto p-5 pr-16 text-xs font-semibold leading-6 text-blue-100 sm:text-sm sm:leading-7">
                    <code>{exampleCode}</code>
                  </pre>
                </div>

                {copiedExample && (
                  <p className="mt-3 text-sm font-black text-green-600">
                    Example copied.
                  </p>
                )}
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <Server size={24} className="text-blue-600" />
                  <div>
                    <h3 className="truncate text-xl font-black text-slate-950">
                      Example Response
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Real Ascend Service response format.
                    </p>
                  </div>
                </div>

                <div className="relative mt-5 overflow-hidden rounded-xl bg-[#071225]">
                  <button
                    type="button"
                    onClick={() => copyText(exampleResponse, "example")}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 transition hover:bg-blue-50"
                  >
                    <Copy size={17} />
                  </button>

                  <pre className="max-h-[360px] overflow-auto p-5 pr-16 text-xs font-semibold leading-6 text-green-200 sm:text-sm sm:leading-7">
                    <code>{exampleResponse}</code>
                  </pre>
                </div>

                <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                  For status requests, use the <span className="font-black">order</span>{" "}
                  value returned from the add request, not the provider_order_id.
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Info size={24} className="text-blue-600" />
                <h3 className="text-xl font-black text-slate-950">
                  Important Notes
                </h3>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                <NoteCard
                  icon={ShieldCheck}
                  title="Keep API key secure"
                  text="Never share your API key with anyone."
                  color="bg-green-100 text-green-600"
                />

                <NoteCard
                  icon={Clock3}
                  title="Rate Limit"
                  text="60 requests per minute. Exceeding limit may block your API temporarily."
                  color="bg-orange-100 text-orange-500"
                />

                <NoteCard
                  icon={CheckSquare}
                  title="Valid Parameters"
                  text="Make sure all required parameters are included in your request."
                  color="bg-blue-100 text-blue-600"
                />

                <NoteCard
                  icon={AlertCircle}
                  title="Order Status"
                  text="There may be a delay in provider status updates."
                  color="bg-purple-100 text-purple-600"
                />

                <NoteCard
                  icon={Lock}
                  title="No Refund via API"
                  text="Refunds must be handled through support/admin review."
                  color="bg-red-100 text-red-500"
                />
              </div>
            </section>
        </div>
      </DashboardLayout>
    </DashboardGuard>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4 sm:gap-5">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14 ${color}`}
        >
          <Icon size={26} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-slate-600">{title}</p>
          <h3 className="mt-2 truncate text-2xl font-black text-slate-950">{value}</h3>
          <p className="mt-1 truncate text-sm font-semibold text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function NoteCard({
  icon: Icon,
  title,
  text,
  color,
}: {
  icon: any;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <div className="flex min-w-0 gap-4 rounded-2xl bg-slate-50 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <Icon size={21} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-black text-slate-800">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function getActionPayload(action: ActionTab, apiKey: string): Record<string, string> {
  if (action === "services") {
    return {
      key: apiKey,
      action: "services",
    };
  }

  if (action === "balance") {
    return {
      key: apiKey,
      action: "balance",
    };
  }

  if (action === "status") {
    return {
      key: apiKey,
      action: "status",
      order: "6fbf76be-ee45-4363-9d7a-b4b3ea4ebf45",
    };
  }

  return {
    key: apiKey,
    action: "add",
    service: "174",
    link: "https://www.tiktok.com/@username/video/7610258462613802241",
    quantity: "100",
  };
}

function getExampleCode(
  codeTab: CodeTab,
  actionTab: ActionTab,
  baseUrl: string,
  apiKey: string,
) {
  const safeApiKey = apiKey === "No API key yet" ? "YOUR_API_KEY" : apiKey;
  const payload = getActionPayload(actionTab, safeApiKey);

  if (codeTab === "php") {
    return `<?php
$api_url = "${baseUrl}";
$data = ${phpArray(payload)};

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $api_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;
  }

  if (codeTab === "javascript") {
    return `const response = await fetch("${baseUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: new URLSearchParams(${JSON.stringify(payload, null, 4)})
});

const data = await response.json();
console.log(data);`;
  }

  if (codeTab === "python") {
    return `import requests

url = "${baseUrl}"

payload = ${pythonDict(payload)}

response = requests.post(url, data=payload)

print(response.json())`;
  }

  return `curl -X POST ${baseUrl} \\
${Object.entries(payload)
  .map(([key, value]) => `  -d "${key}=${value}"`)
  .join(" \\\n")}`;
}

function getExampleResponse(action: ActionTab) {
  if (action === "services") {
    return `[
  {
    "service": "174",
    "name": "TikTok - Views",
    "category": "TikTok - Views",
    "rate": 2.5,
    "min": 100,
    "max": 100000,
    "refill": false,
    "cancel": false
  }
]`;
  }

  if (action === "balance") {
    return `{
  "success": true,
  "balance": "3.55",
  "currency": "PHP"
}`;
  }

  if (action === "status") {
    return `{
  "success": true,
  "order": "6fbf76be-ee45-4363-9d7a-b4b3ea4ebf45",
  "status": "processing",
  "charge": "0.25",
  "start_count": 0,
  "current_count": 0,
  "provider_order_id": "1189631"
}`;
  }

  return `{
  "success": true,
  "order": "6fbf76be-ee45-4363-9d7a-b4b3ea4ebf45",
  "charge": "0.25",
  "balance": "3.55",
  "status": "processing",
  "provider_order_id": "1189631",
  "message": "Order placed successfully. Your order is now processing."
}`;
}

function phpArray(payload: Record<string, string>) {
  const rows = Object.entries(payload)
    .map(([key, value]) => `  "${key}" => "${value}"`)
    .join(",\n");

  return `[\n${rows}\n]`;
}

function pythonDict(payload: Record<string, string>) {
  const rows = Object.entries(payload)
    .map(([key, value]) => `    "${key}": "${value}"`)
    .join(",\n");

  return `{\n${rows}\n}`;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Database,
  Headphones,
  Info,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Ticket,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type SettingsState = {
  platform_name: string;
  support_email: string;
  timezone: string;
  default_currency: string;
  maintenance_mode: boolean;
  website_status: boolean;

  minimum_add_funds: string;
  maximum_add_funds: string;
  proof_upload_required: boolean;
  pending_deposit_auto_expire_hours: string;
  deposit_instructions: string;

  margin_percent: string;
  exchange_sync_enabled: boolean;

  child_panel_price: string;
  child_panel_free_level: string;
  reseller_points_spend_amount: string;
  minimum_points_conversion: string;
  child_panel_auto_renew_enabled: boolean;

  affiliate_enabled: boolean;
  affiliate_min_transfer: string;
  affiliate_commission_rule: string;

  auto_order_enabled: boolean;
  order_status_sync_enabled: boolean;
  provider_balance_sync_enabled: boolean;
  low_provider_balance_alert: string;

  live_chat_enabled: boolean;
  ticket_system_enabled: boolean;
  auto_close_resolved_tickets_days: string;
  support_hours_text: string;
  urgent_ticket_notice: string;

  admin_action_confirmation_enabled: boolean;
  require_reject_reason_enabled: boolean;
  activity_logs_enabled: boolean;
  emergency_lock_enabled: boolean;
};

type SettingKey = keyof SettingsState;
type SettingRow = {
  key: string;
  value: string | null;
};

const DEFAULT_SETTINGS: SettingsState = {
  platform_name: "Ascend Service",
  support_email: "support@ascendservice.com",
  timezone: "Asia/Manila",
  default_currency: "PHP",
  maintenance_mode: false,
  website_status: true,

  minimum_add_funds: "50",
  maximum_add_funds: "10000",
  proof_upload_required: true,
  pending_deposit_auto_expire_hours: "48",
  deposit_instructions:
    "Please upload a clear screenshot of your payment and wait for admin confirmation. Do not send multiple payments.",

  margin_percent: "0",
  exchange_sync_enabled: true,

  child_panel_price: "349",
  child_panel_free_level: "3",
  reseller_points_spend_amount: "200",
  minimum_points_conversion: "100",
  child_panel_auto_renew_enabled: true,

  affiliate_enabled: true,
  affiliate_min_transfer: "10",
  affiliate_commission_rule: "All approved deposits from referred users qualify for commission.",

  auto_order_enabled: true,
  order_status_sync_enabled: true,
  provider_balance_sync_enabled: true,
  low_provider_balance_alert: "500",

  live_chat_enabled: true,
  ticket_system_enabled: true,
  auto_close_resolved_tickets_days: "7",
  support_hours_text: "Support is available daily. We usually reply as soon as possible.",
  urgent_ticket_notice:
    "For urgent payment/order issues, please include your order ID, payment reference, and screenshot.",

  admin_action_confirmation_enabled: true,
  require_reject_reason_enabled: true,
  activity_logs_enabled: true,
  emergency_lock_enabled: false,
};

const settingGroups: {
  id: string;
  label: string;
  icon: any;
}[] = [
  { id: "platform", label: "Platform", icon: Store },
  { id: "add-funds", label: "Add Funds", icon: CreditCard },
  { id: "currency", label: "Currency", icon: CircleDollarSign },
  { id: "reseller", label: "Reseller", icon: Users },
  { id: "affiliates", label: "Affiliates", icon: Wallet },
  { id: "orders", label: "Orders", icon: SlidersHorizontal },
  { id: "support", label: "Support", icon: Headphones },
  { id: "security", label: "Security", icon: ShieldCheck },
];

const booleanKeys = new Set<SettingKey>([
  "maintenance_mode",
  "website_status",
  "proof_upload_required",
  "exchange_sync_enabled",
  "child_panel_auto_renew_enabled",
  "affiliate_enabled",
  "auto_order_enabled",
  "order_status_sync_enabled",
  "provider_balance_sync_enabled",
  "live_chat_enabled",
  "ticket_system_enabled",
  "admin_action_confirmation_enabled",
  "require_reject_reason_enabled",
  "activity_logs_enabled",
  "emergency_lock_enabled",
]);

function stringToBoolean(value: string | null | undefined) {
  return String(value || "").toLowerCase() === "true";
}

function serializeSettingValue(key: SettingKey, value: SettingsState[SettingKey]) {
  if (booleanKeys.has(key)) return String(Boolean(value));
  return String(value ?? "");
}

function parseSettingValue(key: SettingKey, value: string | null) {
  if (booleanKeys.has(key)) return stringToBoolean(value);
  return value ?? DEFAULT_SETTINGS[key];
}

function formatPeso(value: string | number) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
      />
    </label>
  );
}

function SettingCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          {icon}
        </div>
        <h3 className="text-lg font-black text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StatusRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "connected" | "active" | "warning" | "disabled";
  detail: string;
}) {
  const icon =
    status === "warning" || status === "disabled" ? (
      <XCircle size={16} className="text-orange-500" />
    ) : (
      <CheckCircle2 size={16} className="text-emerald-600" />
    );

  const textClass =
    status === "warning" || status === "disabled"
      ? "text-orange-600"
      : "text-emerald-600";

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      {icon}
      <p className="flex-1 text-sm font-black text-slate-700">{label}</p>
      <p className={`text-sm font-black ${textClass}`}>{detail}</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    useState<SettingsState>(DEFAULT_SETTINGS);
  const [activeSection, setActiveSection] = useState("platform");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  }, [originalSettings, settings]);

  function updateSetting<K extends SettingKey>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadSettings() {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.from("platform_settings").select("key, value");

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const merged: SettingsState = { ...DEFAULT_SETTINGS };

    for (const row of (data || []) as SettingRow[]) {
      const key = row.key as SettingKey;

      if (key in merged) {
        (merged as any)[key] = parseSettingValue(key, row.value);
      }
    }

    setSettings(merged);
    setOriginalSettings(merged);
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    const rows = (Object.keys(settings) as SettingKey[]).map((key) => ({
      key,
      value: serializeSettingValue(key, settings[key]),
    }));

    const { error } = await supabase
      .from("platform_settings")
      .upsert(rows, { onConflict: "key" });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setOriginalSettings(settings);
    setSaving(false);
    setMessage("Settings saved successfully.");
  }

  function resetChanges() {
    setSettings(originalSettings);
    setMessage("Unsaved changes were reset.");
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <AdminGuard allowedRoles={["head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Settings
              </h2>

              <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-500">
                Manage platform configuration, add funds rules, reseller settings,
                affiliate settings, support controls, and security options.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetChanges}
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={17} />
                Reset Changes
              </button>

              <button
                type="button"
                onClick={saveSettings}
                disabled={!hasChanges || saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <RefreshCw size={17} className="animate-spin" /> : <Save size={17} />}
                {saving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-sm font-bold text-slate-500 shadow-sm">
              Loading settings...
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[240px_1fr_350px]">
              <aside className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="space-y-1">
                  {settingGroups.map((group) => {
                    const Icon = group.icon;
                    const active = activeSection === group.id;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setActiveSection(group.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                          active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                        }`}
                      >
                        <Icon size={18} />
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="space-y-5">
                {(activeSection === "platform" || activeSection === "add-funds") && (
                  <>
                    {activeSection === "platform" && (
                      <SettingCard
                        title="Platform Settings"
                        icon={<Store size={22} />}
                      >
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                          <TextInput
                            label="Platform Name"
                            value={settings.platform_name}
                            onChange={(value) => updateSetting("platform_name", value)}
                          />

                          <TextInput
                            label="Support Email"
                            value={settings.support_email}
                            onChange={(value) => updateSetting("support_email", value)}
                          />

                          <SelectInput
                            label="Timezone"
                            value={settings.timezone}
                            onChange={(value) => updateSetting("timezone", value)}
                            options={[
                              { label: "(GMT+08:00) Asia/Manila", value: "Asia/Manila" },
                              { label: "UTC", value: "UTC" },
                              { label: "Asia/Bangkok", value: "Asia/Bangkok" },
                            ]}
                          />

                          <SelectInput
                            label="Default Currency"
                            value={settings.default_currency}
                            onChange={(value) => updateSetting("default_currency", value)}
                            options={[
                              { label: "PHP", value: "PHP" },
                              { label: "USD", value: "USD" },
                              { label: "THB", value: "THB" },
                            ]}
                          />

                          <div>
                            <p className="text-sm font-black text-slate-700">
                              Maintenance Mode
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <Toggle
                                checked={settings.maintenance_mode}
                                onChange={(value) => updateSetting("maintenance_mode", value)}
                              />
                              <span className="text-sm font-bold text-slate-500">
                                {settings.maintenance_mode ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-black text-slate-700">
                              Website Status
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <Toggle
                                checked={settings.website_status}
                                onChange={(value) => updateSetting("website_status", value)}
                              />
                              <span className="text-sm font-bold text-slate-500">
                                {settings.website_status ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </SettingCard>
                    )}

                    {activeSection === "add-funds" && (
                      <SettingCard
                        title="Add Funds Settings"
                        icon={<CreditCard size={22} />}
                      >
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                          <TextInput
                            label="Minimum Add Funds"
                            value={settings.minimum_add_funds}
                            onChange={(value) => updateSetting("minimum_add_funds", value)}
                            type="number"
                          />

                          <TextInput
                            label="Maximum Add Funds"
                            value={settings.maximum_add_funds}
                            onChange={(value) => updateSetting("maximum_add_funds", value)}
                            type="number"
                          />

                          <div>
                            <p className="text-sm font-black text-slate-700">
                              Proof Upload Required
                            </p>
                            <div className="mt-3 flex items-center gap-3">
                              <Toggle
                                checked={settings.proof_upload_required}
                                onChange={(value) =>
                                  updateSetting("proof_upload_required", value)
                                }
                              />
                              <span className="text-sm font-bold text-slate-500">
                                {settings.proof_upload_required ? "Required" : "Optional"}
                              </span>
                            </div>
                          </div>

                          <TextInput
                            label="Pending Deposit Auto Expire (hours)"
                            value={settings.pending_deposit_auto_expire_hours}
                            onChange={(value) =>
                              updateSetting("pending_deposit_auto_expire_hours", value)
                            }
                            type="number"
                          />
                        </div>

                        <div className="mt-5">
                          <TextAreaInput
                            label="Deposit Instructions"
                            value={settings.deposit_instructions}
                            onChange={(value) =>
                              updateSetting("deposit_instructions", value)
                            }
                            rows={4}
                          />
                        </div>
                      </SettingCard>
                    )}
                  </>
                )}

                {activeSection === "currency" && (
                  <SettingCard title="Currency & Exchange Settings" icon={<CircleDollarSign size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <TextInput
                        label="Margin Percent"
                        value={settings.margin_percent}
                        onChange={(value) => updateSetting("margin_percent", value)}
                        type="number"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-700">
                          Exchange Sync Enabled
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Toggle
                            checked={settings.exchange_sync_enabled}
                            onChange={(value) =>
                              updateSetting("exchange_sync_enabled", value)
                            }
                          />
                          <span className="text-sm font-bold text-slate-500">
                            {settings.exchange_sync_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-700">
                      Currency rates are managed in your Currencies page. This section only stores global exchange settings.
                    </div>
                  </SettingCard>
                )}

                {activeSection === "reseller" && (
                  <SettingCard title="Reseller & Child Panel Settings" icon={<Users size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <TextInput
                        label="Child Panel Price"
                        value={settings.child_panel_price}
                        onChange={(value) => updateSetting("child_panel_price", value)}
                        type="number"
                      />

                      <SelectInput
                        label="Free Child Panel Starting Level"
                        value={settings.child_panel_free_level}
                        onChange={(value) => updateSetting("child_panel_free_level", value)}
                        options={[
                          { label: "Level 3", value: "3" },
                          { label: "Level 4", value: "4" },
                          { label: "Level 5", value: "5" },
                          { label: "Level 6", value: "6" },
                        ]}
                      />

                      <TextInput
                        label="Points Earning Rule Spend Amount"
                        value={settings.reseller_points_spend_amount}
                        onChange={(value) =>
                          updateSetting("reseller_points_spend_amount", value)
                        }
                        type="number"
                      />

                      <TextInput
                        label="Minimum Points Conversion"
                        value={settings.minimum_points_conversion}
                        onChange={(value) =>
                          updateSetting("minimum_points_conversion", value)
                        }
                        type="number"
                      />

                      <div>
                        <p className="text-sm font-black text-slate-700">
                          Child Panel Auto Renew
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Toggle
                            checked={settings.child_panel_auto_renew_enabled}
                            onChange={(value) =>
                              updateSetting("child_panel_auto_renew_enabled", value)
                            }
                          />
                          <span className="text-sm font-bold text-slate-500">
                            {settings.child_panel_auto_renew_enabled
                              ? "Enabled"
                              : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">
                      Current display: Child Panel {formatPeso(settings.child_panel_price)}/month · Free from Level {settings.child_panel_free_level}.
                    </div>
                  </SettingCard>
                )}

                {activeSection === "affiliates" && (
                  <SettingCard title="Affiliate Settings" icon={<Wallet size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-black text-slate-700">
                          Affiliate System
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Toggle
                            checked={settings.affiliate_enabled}
                            onChange={(value) => updateSetting("affiliate_enabled", value)}
                          />
                          <span className="text-sm font-bold text-slate-500">
                            {settings.affiliate_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      <TextInput
                        label="Minimum Transfer Amount"
                        value={settings.affiliate_min_transfer}
                        onChange={(value) => updateSetting("affiliate_min_transfer", value)}
                        type="number"
                      />
                    </div>

                    <div className="mt-5">
                      <TextAreaInput
                        label="Commission Rule"
                        value={settings.affiliate_commission_rule}
                        onChange={(value) =>
                          updateSetting("affiliate_commission_rule", value)
                        }
                        rows={3}
                      />
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3 text-left">Affiliate Level</th>
                            <th className="px-4 py-3 text-left">Required Referral Deposits</th>
                            <th className="px-4 py-3 text-left">Commission Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Starter Affiliate", "₱0", "1.25%"],
                            ["Active Affiliate", "₱12,000", "1.5%"],
                            ["Pro Affiliate", "₱35,000", "2%"],
                            ["Elite Affiliate", "₱80,000", "2.5%"],
                            ["Ascend Partner", "₱200,000", "3%"],
                          ].map((row) => (
                            <tr key={row[0]} className="border-t border-slate-100">
                              <td className="px-4 py-3 font-black text-slate-800">{row[0]}</td>
                              <td className="px-4 py-3 font-semibold text-slate-600">{row[1]}</td>
                              <td className="px-4 py-3 font-black text-emerald-600">{row[2]}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SettingCard>
                )}

                {activeSection === "orders" && (
                  <SettingCard title="Orders & Provider Settings" icon={<SlidersHorizontal size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      {[
                        ["Auto Order", "auto_order_enabled"],
                        ["Order Status Sync", "order_status_sync_enabled"],
                        ["Provider Balance Sync", "provider_balance_sync_enabled"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <p className="text-sm font-black text-slate-700">{label}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Toggle
                              checked={Boolean(settings[key as SettingKey])}
                              onChange={(value) =>
                                updateSetting(key as SettingKey, value as any)
                              }
                            />
                            <span className="text-sm font-bold text-slate-500">
                              {Boolean(settings[key as SettingKey]) ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                        </div>
                      ))}

                      <TextInput
                        label="Low Provider Balance Alert"
                        value={settings.low_provider_balance_alert}
                        onChange={(value) =>
                          updateSetting("low_provider_balance_alert", value)
                        }
                        type="number"
                      />
                    </div>
                  </SettingCard>
                )}

                {activeSection === "support" && (
                  <SettingCard title="Support Settings" icon={<Headphones size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-black text-slate-700">
                          Live Chat Enabled
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Toggle
                            checked={settings.live_chat_enabled}
                            onChange={(value) => updateSetting("live_chat_enabled", value)}
                          />
                          <span className="text-sm font-bold text-slate-500">
                            {settings.live_chat_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-700">
                          Ticket System Enabled
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <Toggle
                            checked={settings.ticket_system_enabled}
                            onChange={(value) =>
                              updateSetting("ticket_system_enabled", value)
                            }
                          />
                          <span className="text-sm font-bold text-slate-500">
                            {settings.ticket_system_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>

                      <TextInput
                        label="Auto Close Resolved Tickets After Days"
                        value={settings.auto_close_resolved_tickets_days}
                        onChange={(value) =>
                          updateSetting("auto_close_resolved_tickets_days", value)
                        }
                        type="number"
                      />
                    </div>

                    <div className="mt-5 grid gap-5">
                      <TextAreaInput
                        label="Support Hours Text"
                        value={settings.support_hours_text}
                        onChange={(value) => updateSetting("support_hours_text", value)}
                        rows={3}
                      />

                      <TextAreaInput
                        label="Urgent Ticket Notice"
                        value={settings.urgent_ticket_notice}
                        onChange={(value) => updateSetting("urgent_ticket_notice", value)}
                        rows={3}
                      />
                    </div>
                  </SettingCard>
                )}

                {activeSection === "security" && (
                  <SettingCard title="Security Settings" icon={<ShieldCheck size={22} />}>
                    <div className="grid gap-5 md:grid-cols-2">
                      {[
                        ["Admin Action Confirmation", "admin_action_confirmation_enabled"],
                        ["Require Reject Reason", "require_reject_reason_enabled"],
                        ["Activity Logs", "activity_logs_enabled"],
                        ["Emergency Lock", "emergency_lock_enabled"],
                      ].map(([label, key]) => (
                        <div key={key}>
                          <p className="text-sm font-black text-slate-700">{label}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Toggle
                              checked={Boolean(settings[key as SettingKey])}
                              onChange={(value) =>
                                updateSetting(key as SettingKey, value as any)
                              }
                            />
                            <span className="text-sm font-bold text-slate-500">
                              {Boolean(settings[key as SettingKey])
                                ? "Enabled"
                                : "Disabled"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {settings.emergency_lock_enabled && (
                      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm font-bold leading-6 text-orange-700">
                        Emergency Lock is enabled. Later we can connect this to block orders, deposits, and public access.
                      </div>
                    )}
                  </SettingCard>
                )}
              </div>

              <aside className="space-y-5">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <Database size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-950">
                      System Status
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <StatusRow label="Database" status="connected" detail="Connected" />
                    <StatusRow
                      label="Exchange Sync"
                      status={settings.exchange_sync_enabled ? "active" : "disabled"}
                      detail={settings.exchange_sync_enabled ? "Active" : "Disabled"}
                    />
                    <StatusRow
                      label="Cron Jobs"
                      status="active"
                      detail="Configured"
                    />
                    <StatusRow
                      label="Live Chat"
                      status={settings.live_chat_enabled ? "active" : "disabled"}
                      detail={settings.live_chat_enabled ? "Active" : "Disabled"}
                    />
                    <StatusRow
                      label="Tickets"
                      status={settings.ticket_system_enabled ? "active" : "disabled"}
                      detail={settings.ticket_system_enabled ? "Active" : "Disabled"}
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Info size={18} className="text-blue-600" />
                    <h3 className="text-lg font-black text-slate-950">
                      Safe Mode Note
                    </h3>
                  </div>

                  <p className="text-sm font-semibold leading-6 text-slate-500">
                    This settings page saves values into platform_settings first.
                    Existing pages will not change until we connect each setting one by one.
                  </p>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock3 size={18} className="text-emerald-600" />
                    <h3 className="text-lg font-black text-slate-950">
                      Current Important Values
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-bold text-slate-500">Minimum Add Funds</span>
                      <span className="font-black text-slate-900">
                        {formatPeso(settings.minimum_add_funds)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="font-bold text-slate-500">Child Panel</span>
                      <span className="font-black text-slate-900">
                        {formatPeso(settings.child_panel_price)}/mo
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="font-bold text-slate-500">Affiliate Transfer</span>
                      <span className="font-black text-slate-900">
                        Min {formatPeso(settings.affiliate_min_transfer)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="font-bold text-slate-500">Margin</span>
                      <span className="font-black text-slate-900">
                        {settings.margin_percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {hasChanges && (
                  <div className="rounded-[28px] border border-orange-100 bg-orange-50 p-5 text-sm font-bold leading-6 text-orange-700 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle size={18} />
                      Unsaved Changes
                    </div>
                    You have unsaved settings. Click Save All Changes to store them.
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

"use client";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowDownRight,
  Award,
  CheckCircle2,
  Crown,
  Diamond,
  Download,
  Eye,
  Filter,
  Gift,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trophy,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type ProfileData = {
  id: string;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  referral_code?: string | null;
  created_at?: string | null;
};

type ReferralRecord = {
  id: string;
  referrer_id?: string | null;
  referred_user_id?: string | null;
  referred_username?: string | null;
  created_at: string;
  total_deposits?: number | string | null;
  total_commission?: number | string | null;
  commission_rate?: number | string | null;
  is_qualified?: boolean | null;
  status?: string | null;
};

type CommissionRecord = {
  id: string;
  referrer_id?: string | null;
  referred_user_id?: string | null;
  referred_username?: string | null;
  deposit_amount?: number | string | null;
  commission_rate?: number | string | null;
  commission_amount?: number | string | null;
  used_amount?: number | string | null;
  status?: string | null;
  created_at: string;
};

type TransferRecord = {
  id: string;
  user_id?: string | null;
  amount: number | string;
  status: string;
  created_at: string;
};

type AffiliateLevel = {
  level: number;
  name: string;
  requiredDeposits: number;
  commissionRate: number;
  icon: any;
};

type AffiliateRow = {
  profile: ProfileData;
  level: AffiliateLevel;
  referrals: ReferralRecord[];
  commissions: CommissionRecord[];
  transfers: TransferRecord[];
  totalReferrals: number;
  qualifiedReferrals: number;
  totalReferralDeposits: number;
  availableCommission: number;
  totalEarnedCommission: number;
  paidCommission: number;
  pendingTransfer: number;
  status: "active" | "inactive";
};

type LevelFilter = "all" | "1" | "2" | "3" | "4" | "5";
type StatusFilter = "all" | "active" | "inactive";

const AFFILIATE_LEVELS: AffiliateLevel[] = [
  {
    level: 1,
    name: "Starter Affiliate",
    requiredDeposits: 0,
    commissionRate: 1.25,
    icon: Star,
  },
  {
    level: 2,
    name: "Active Affiliate",
    requiredDeposits: 12000,
    commissionRate: 1.5,
    icon: ShieldCheck,
  },
  {
    level: 3,
    name: "Pro Affiliate",
    requiredDeposits: 35000,
    commissionRate: 2,
    icon: Crown,
  },
  {
    level: 4,
    name: "Elite Affiliate",
    requiredDeposits: 80000,
    commissionRate: 2.5,
    icon: Diamond,
  },
  {
    level: 5,
    name: "Ascend Partner",
    requiredDeposits: 200000,
    commissionRate: 3,
    icon: Trophy,
  },
];

const levelFilters: { label: string; value: LevelFilter }[] = [
  { label: "All Levels", value: "all" },
  { label: "Level 1", value: "1" },
  { label: "Level 2", value: "2" },
  { label: "Level 3", value: "3" },
  { label: "Level 4", value: "4" },
  { label: "Level 5", value: "5" },
];

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function formatAmount(value: number | string | null | undefined) {
  return `₱${toNumber(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatNumber(value: number | string | null | undefined) {
  return toNumber(value).toLocaleString("en-PH", {
    maximumFractionDigits: 0,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCurrentAffiliateLevel(totalReferralDeposits: number) {
  return AFFILIATE_LEVELS.reduce((current, level) => {
    if (totalReferralDeposits >= level.requiredDeposits) {
      return level;
    }

    return current;
  }, AFFILIATE_LEVELS[0]);
}

function getNextAffiliateLevel(currentLevel: number) {
  return AFFILIATE_LEVELS.find((level) => level.level === currentLevel + 1);
}

function getDisplayName(profile: ProfileData | null | undefined) {
  if (!profile) return "User";

  if (profile.username) return profile.username;
  if (profile.full_name) return profile.full_name;

  const name = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return name || "User";
}

function getFullName(profile: ProfileData | null | undefined) {
  if (!profile) return "User";

  const name = `${profile.firstname || ""} ${profile.lastname || ""}`.trim();

  return name || profile.full_name || profile.username || "User";
}

function getInitial(profile: ProfileData) {
  return getDisplayName(profile).charAt(0).toUpperCase();
}

function getProfileEmail(profile: ProfileData) {
  return profile.email || "No email";
}

function isReferralQualified(referral: ReferralRecord) {
  const status = String(referral.status || "").toLowerCase();

  return (
    Boolean(referral.is_qualified) ||
    status === "qualified" ||
    toNumber(referral.total_deposits) >= 1000
  );
}

function getCommissionAvailableAmount(item: CommissionRecord) {
  const commissionAmount = toNumber(item.commission_amount);
  const usedAmount = toNumber(item.used_amount);

  if (String(item.status || "").toLowerCase() !== "available") {
    return 0;
  }

  return Math.max(0, commissionAmount - usedAmount);
}

function levelBadgeClass(level: number) {
  if (level === 5) return "bg-amber-50 text-amber-700 ring-amber-100";
  if (level === 4) return "bg-purple-50 text-purple-700 ring-purple-100";
  if (level === 3) return "bg-blue-50 text-blue-700 ring-blue-100";
  if (level === 2) return "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function LevelBadge({ level }: { level: AffiliateLevel }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${levelBadgeClass(
        level.level,
      )}`}
    >
      Level {level.level} · {level.name}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function UserAvatar({ profile }: { profile: ProfileData }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 font-black text-emerald-700 ring-1 ring-emerald-100">
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={getDisplayName(profile)}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(profile)
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  tone: "green" | "blue" | "orange" | "purple";
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    orange: "bg-orange-50 text-orange-700 ring-orange-100",
    purple: "bg-purple-50 text-purple-700 ring-purple-100",
  }[tone];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ring-1 ${toneClass}`}>
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-1 text-3xl font-black tracking-tight text-slate-950">{value}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className={`text-sm font-black ${valueClassName}`}>{value}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
      <div className={`mt-2 text-sm font-black ${valueClassName}`}>{value}</div>
    </div>
  );
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function AdminAffiliatesPage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateRow | null>(null);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadTable<T>(tableName: string, orderColumn = "created_at") {
    let allRows: T[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const to = from + batchSize - 1;

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order(orderColumn, { ascending: false })
        .range(from, to);

      if (error) {
        console.warn(`${tableName.toUpperCase()}_LOAD_ERROR:`, error.message);
        return allRows;
      }

      const batch = (data || []) as T[];
      allRows = [...allRows, ...batch];

      if (batch.length < batchSize) break;
      from += batchSize;
    }

    return allRows;
  }

  async function loadAffiliates() {
    setLoading(true);
    setMessage("");

    const [profileRows, referralRows, commissionRows, transferRows] = await Promise.all([
      loadTable<ProfileData>("profiles"),
      loadTable<ReferralRecord>("affiliate_referrals"),
      loadTable<CommissionRecord>("affiliate_commissions"),
      loadTable<TransferRecord>("affiliate_commission_transfers"),
    ]);

    setProfiles(profileRows);
    setReferrals(referralRows);
    setCommissions(commissionRows);
    setTransfers(transferRows);
    setLoading(false);
  }

  useEffect(() => {
    loadAffiliates();
  }, []);

  const affiliateRows = useMemo<AffiliateRow[]>(() => {
    return profiles.map((profile) => {
      const userReferrals = referrals.filter((item) => item.referrer_id === profile.id);
      const userCommissions = commissions.filter((item) => item.referrer_id === profile.id);
      const userTransfers = transfers.filter((item) => item.user_id === profile.id);

      const totalReferrals = userReferrals.length;
      const qualifiedReferrals = userReferrals.filter(isReferralQualified).length;
      const totalReferralDeposits = userReferrals.reduce(
        (sum, item) => sum + toNumber(item.total_deposits),
        0,
      );

      const availableCommission = userCommissions.reduce(
        (sum, item) => sum + getCommissionAvailableAmount(item),
        0,
      );

      const totalEarnedCommission = userCommissions.reduce(
        (sum, item) => sum + toNumber(item.commission_amount),
        0,
      );

      const paidCommission = userTransfers
        .filter((item) => String(item.status || "").toLowerCase() === "completed")
        .reduce((sum, item) => sum + toNumber(item.amount), 0);

      const pendingTransfer = userTransfers
        .filter((item) => String(item.status || "").toLowerCase() === "pending")
        .reduce((sum, item) => sum + toNumber(item.amount), 0);

      const level = getCurrentAffiliateLevel(totalReferralDeposits);

      return {
        profile,
        level,
        referrals: userReferrals,
        commissions: userCommissions,
        transfers: userTransfers,
        totalReferrals,
        qualifiedReferrals,
        totalReferralDeposits,
        availableCommission,
        totalEarnedCommission,
        paidCommission,
        pendingTransfer,
        status: totalReferrals > 0 || totalEarnedCommission > 0 ? "active" : "inactive",
      };
    });
  }, [commissions, profiles, referrals, transfers]);

  const filteredAffiliates = useMemo(() => {
    const query = search.toLowerCase().trim();

    return affiliateRows.filter((row) => {
      const profile = row.profile;

      const matchesSearch =
        !query ||
        String(profile.username || "").toLowerCase().includes(query) ||
        String(profile.email || "").toLowerCase().includes(query) ||
        String(profile.firstname || "").toLowerCase().includes(query) ||
        String(profile.lastname || "").toLowerCase().includes(query) ||
        String(profile.full_name || "").toLowerCase().includes(query) ||
        String(profile.referral_code || "").toLowerCase().includes(query);

      const matchesLevel =
        levelFilter === "all" ? true : String(row.level.level) === levelFilter;

      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [affiliateRows, levelFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const activeAffiliates = affiliateRows.filter((row) => row.status === "active").length;
    const totalReferrals = referrals.length;
    const qualifiedReferrals = referrals.filter(isReferralQualified).length;

    const availableCommission = affiliateRows.reduce(
      (sum, row) => sum + row.availableCommission,
      0,
    );

    const totalEarnedCommission = affiliateRows.reduce(
      (sum, row) => sum + row.totalEarnedCommission,
      0,
    );

    const totalPaidCommission = affiliateRows.reduce(
      (sum, row) => sum + row.paidCommission,
      0,
    );

    const totalReferralDeposits = affiliateRows.reduce(
      (sum, row) => sum + row.totalReferralDeposits,
      0,
    );

    return {
      activeAffiliates,
      totalReferrals,
      qualifiedReferrals,
      availableCommission,
      totalEarnedCommission,
      totalPaidCommission,
      totalReferralDeposits,
    };
  }, [affiliateRows, referrals]);

  const topAffiliates = [...affiliateRows]
    .sort((a, b) => b.totalEarnedCommission - a.totalEarnedCommission)
    .slice(0, 5);

  const recentActivity = [
    ...referrals.slice(0, 4).map((item) => ({
      id: `referral-${item.id}`,
      title: `New referral: ${item.referred_username || "Referral"}`,
      amount: toNumber(item.total_deposits),
      date: item.created_at,
      type: "referral",
    })),
    ...commissions.slice(0, 4).map((item) => ({
      id: `commission-${item.id}`,
      title: `Commission from ${item.referred_username || "Referral"}`,
      amount: toNumber(item.commission_amount),
      date: item.created_at,
      type: "commission",
    })),
    ...transfers.slice(0, 4).map((item) => ({
      id: `transfer-${item.id}`,
      title: "Commission transferred to wallet",
      amount: toNumber(item.amount),
      date: item.created_at,
      type: "transfer",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  function exportAffiliatesToPDF() {
    const reportDate = new Date().toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const rows = filteredAffiliates
      .map((row) => {
        return `
          <tr>
            <td>${escapeHtml(getDisplayName(row.profile))}</td>
            <td>${escapeHtml(getProfileEmail(row.profile))}</td>
            <td>Level ${row.level.level} - ${escapeHtml(row.level.name)}</td>
            <td>${row.level.commissionRate}%</td>
            <td>${formatNumber(row.totalReferrals)}</td>
            <td>${formatNumber(row.qualifiedReferrals)}</td>
            <td>${formatAmount(row.totalReferralDeposits)}</td>
            <td>${formatAmount(row.availableCommission)}</td>
            <td>${formatAmount(row.totalEarnedCommission)}</td>
            <td>${row.status}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank", "width=1200,height=900");

    if (!printWindow) {
      alert("Please allow popups to export PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Affiliates Report</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #ffffff; }
            .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }
            h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.04em; }
            .muted { color: #64748b; font-size: 13px; font-weight: 700; line-height: 1.7; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 18px; padding: 16px; background: #f8fafc; }
            .card span { display: block; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
            .card strong { display: block; margin-top: 8px; font-size: 22px; font-weight: 900; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: 0.08em; font-weight: 900; padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #334155; vertical-align: top; }
            .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; gap: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Affiliates Report</h1>
              <p class="muted">Ascend Service · Generated ${reportDate}</p>
            </div>
            <div class="muted">
              <div>Total Affiliates: ${affiliateRows.length}</div>
              <div>Filtered Affiliates: ${filteredAffiliates.length}</div>
            </div>
          </div>

          <div class="summary">
            <div class="card"><span>Active Affiliates</span><strong>${formatNumber(stats.activeAffiliates)}</strong></div>
            <div class="card"><span>Total Referrals</span><strong>${formatNumber(stats.totalReferrals)}</strong></div>
            <div class="card"><span>Available Commission</span><strong>${formatAmount(stats.availableCommission)}</strong></div>
            <div class="card"><span>Paid Commission</span><strong>${formatAmount(stats.totalPaidCommission)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Affiliate</th>
                <th>Email</th>
                <th>Level</th>
                <th>Rate</th>
                <th>Referrals</th>
                <th>Qualified</th>
                <th>Referral Funds</th>
                <th>Available</th>
                <th>Total Earned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                rows ||
                `<tr><td colspan="10" style="text-align:center; padding:32px;">No affiliates found.</td></tr>`
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Ascend Service · Affiliate Management Report</span>
            <span>This report was generated from the Admin Affiliates page.</span>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                Affiliates
              </h2>

              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Manage and track affiliate users, referrals, commissions, and transfers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={loadAffiliates}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <RefreshCw size={17} />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportAffiliatesToPDF}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Download size={17} />
                Export PDF
              </button>
            </div>
          </div>

          {message && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Affiliates"
              value={formatNumber(stats.activeAffiliates)}
              subtitle="Users with referrals or commission"
              icon={<Users size={26} />}
              tone="green"
            />

            <StatCard
              title="Total Referrals"
              value={formatNumber(stats.totalReferrals)}
              subtitle={`${formatNumber(stats.qualifiedReferrals)} qualified referrals`}
              icon={<User size={26} />}
              tone="blue"
            />

            <StatCard
              title="Available Commission"
              value={formatAmount(stats.availableCommission)}
              subtitle="Ready to transfer"
              icon={<Wallet size={26} />}
              tone="orange"
            />

            <StatCard
              title="Paid Commission"
              value={formatAmount(stats.totalPaidCommission)}
              subtitle="Transferred to wallets"
              icon={<Gift size={26} />}
              tone="purple"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1fr_230px_210px_auto]">
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, username, referral code..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <select
                    value={levelFilter}
                    onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {levelFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm outline-none"
                  >
                    {statusFilters.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setLevelFilter("all");
                      setStatusFilter("all");
                    }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Filter size={17} />
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1280px] text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 text-left">Affiliate</th>
                        <th className="px-5 py-4 text-left">Level / Rate</th>
                        <th className="px-5 py-4 text-left">Referrals</th>
                        <th className="px-5 py-4 text-left">Referral Funds</th>
                        <th className="px-5 py-4 text-left">Available Commission</th>
                        <th className="px-5 py-4 text-left">Total Earned</th>
                        <th className="px-5 py-4 text-left">Paid</th>
                        <th className="px-5 py-4 text-left">Status</th>
                        <th className="px-5 py-4 text-left">Joined</th>
                        <th className="px-5 py-4 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAffiliates.map((row) => {
                        return (
                          <tr key={row.profile.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                            <td className="px-5 py-5 align-top">
                              <div className="flex items-center gap-4">
                                <UserAvatar profile={row.profile} />

                                <div className="min-w-0">
                                  <p className="max-w-[210px] truncate font-black text-slate-950">
                                    {getFullName(row.profile)}
                                  </p>

                                  <p className="mt-1 max-w-[210px] truncate text-xs font-black text-emerald-600">
                                    @{getDisplayName(row.profile)}
                                  </p>

                                  <p className="mt-1 max-w-[210px] truncate text-xs font-semibold text-slate-500">
                                    {getProfileEmail(row.profile)}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <LevelBadge level={row.level} />
                              <p className="mt-2 text-xs font-black text-blue-600">
                                {row.level.commissionRate}% commission
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-950">
                                {formatNumber(row.totalReferrals)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-emerald-600">
                                {formatNumber(row.qualifiedReferrals)} qualified
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top font-black text-slate-800">
                              {formatAmount(row.totalReferralDeposits)}
                            </td>

                            <td className="px-5 py-5 align-top font-black text-orange-600">
                              {formatAmount(row.availableCommission)}
                            </td>

                            <td className="px-5 py-5 align-top font-black text-emerald-600">
                              {formatAmount(row.totalEarnedCommission)}
                            </td>

                            <td className="px-5 py-5 align-top font-black text-blue-600">
                              {formatAmount(row.paidCommission)}
                            </td>

                            <td className="px-5 py-5 align-top">
                              <StatusBadge status={row.status} />
                            </td>

                            <td className="px-5 py-5 align-top">
                              <p className="font-black text-slate-800">
                                {formatDate(row.profile.created_at)}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {formatTime(row.profile.created_at)}
                              </p>
                            </td>

                            <td className="px-5 py-5 align-top">
                              <button
                                type="button"
                                onClick={() => setSelectedAffiliate(row)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                                title="View affiliate"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredAffiliates.length <= 0 && (
                        <tr>
                          <td colSpan={10} className="px-5 py-16 text-center">
                            <div className="mx-auto flex max-w-sm flex-col items-center">
                              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                                <Users size={26} />
                              </div>

                              <h3 className="mt-4 text-lg font-black text-slate-950">
                                No affiliates found
                              </h3>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                Try clearing your search or filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing <span className="font-black text-slate-800">{filteredAffiliates.length}</span>{" "}
                    of <span className="font-black text-slate-800">{affiliateRows.length}</span> affiliates
                  </p>

                  <p>{loading ? "Loading affiliates..." : "Affiliate data loaded"}</p>
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Award size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Level Rules</h3>
                </div>

                <div className="space-y-3">
                  {AFFILIATE_LEVELS.map((level) => {
                    const Icon = level.icon;

                    return (
                      <div key={level.level} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${levelBadgeClass(level.level)}`}>
                            <Icon size={18} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-900">{level.name}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Required funds: {formatAmount(level.requiredDeposits)}
                            </p>
                          </div>

                          <p className="text-sm font-black text-emerald-600">
                            {level.commissionRate}%
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <p className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold leading-5 text-emerald-700">
                    Note: Level increases from total approved add funds by referrals.
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-600" />
                  <h3 className="text-lg font-black text-slate-950">Commission Health</h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow label="Referral Funds" value={formatAmount(stats.totalReferralDeposits)} />
                  <SummaryRow label="Total Earned" value={formatAmount(stats.totalEarnedCommission)} valueClassName="text-emerald-600" />
                  <SummaryRow label="Available" value={formatAmount(stats.availableCommission)} valueClassName="text-orange-600" />
                  <SummaryRow label="Paid" value={formatAmount(stats.totalPaidCommission)} valueClassName="text-blue-600" />
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Top Affiliates</h3>

                <div className="mt-5 space-y-4">
                  {topAffiliates.length <= 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No top affiliates yet.
                    </p>
                  ) : (
                    topAffiliates.map((row, index) => (
                      <div key={row.profile.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-black text-amber-600 ring-1 ring-amber-100">
                          {index + 1}
                        </div>

                        <UserAvatar profile={row.profile} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900">
                            {getDisplayName(row.profile)}
                          </p>
                          <p className="text-xs font-semibold text-slate-500">
                            {formatAmount(row.totalEarnedCommission)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">Recent Activity</h3>

                <div className="mt-5 space-y-4">
                  {recentActivity.length <= 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No recent affiliate activity.
                    </p>
                  ) : (
                    recentActivity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            item.type === "commission"
                              ? "bg-emerald-500"
                              : item.type === "transfer"
                                ? "bg-blue-500"
                                : "bg-orange-500"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-800">
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatDate(item.date)} {formatTime(item.date)}
                          </p>
                        </div>

                        {item.amount > 0 && (
                          <p className="text-xs font-black text-emerald-600">
                            {formatAmount(item.amount)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {selectedAffiliate && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm lg:items-center">
            <div className="my-8 w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">Affiliate Details</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Review affiliate referrals, commissions, and transfer summary.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAffiliate(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-y-auto p-6">
                <div className="flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <UserAvatar profile={selectedAffiliate.profile} />

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-black text-slate-950">
                      {getFullName(selectedAffiliate.profile)}
                    </h4>

                    <p className="mt-1 text-sm font-black text-emerald-600">
                      @{getDisplayName(selectedAffiliate.profile)}
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {getProfileEmail(selectedAffiliate.profile)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <LevelBadge level={selectedAffiliate.level} />
                      <StatusBadge status={selectedAffiliate.status} />
                    </div>
                  </div>

                  <p className="shrink-0 text-2xl font-black text-emerald-600">
                    {selectedAffiliate.level.commissionRate}%
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <InfoBlock label="Total Referrals" value={formatNumber(selectedAffiliate.totalReferrals)} />
                  <InfoBlock label="Qualified Referrals" value={formatNumber(selectedAffiliate.qualifiedReferrals)} />
                  <InfoBlock label="Referral Funds" value={formatAmount(selectedAffiliate.totalReferralDeposits)} />
                  <InfoBlock label="Available Commission" value={formatAmount(selectedAffiliate.availableCommission)} valueClassName="text-orange-600" />
                  <InfoBlock label="Total Earned" value={formatAmount(selectedAffiliate.totalEarnedCommission)} valueClassName="text-emerald-600" />
                  <InfoBlock label="Paid Commission" value={formatAmount(selectedAffiliate.paidCommission)} valueClassName="text-blue-600" />
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                      <h4 className="font-black text-slate-950">Recent Referrals</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] text-sm">
                        <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-4 text-left">Referral</th>
                            <th className="px-5 py-4 text-left">Deposits</th>
                            <th className="px-5 py-4 text-left">Commission</th>
                            <th className="px-5 py-4 text-left">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedAffiliate.referrals.slice(0, 8).map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="px-5 py-4">
                                <p className="font-black text-slate-900">{item.referred_username || "Referral"}</p>
                                <p className="text-xs font-semibold text-slate-500">{formatDate(item.created_at)}</p>
                              </td>
                              <td className="px-5 py-4 font-black text-slate-800">{formatAmount(item.total_deposits)}</td>
                              <td className="px-5 py-4 font-black text-emerald-600">{formatAmount(item.total_commission)}</td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                  {isReferralQualified(item) ? "Qualified" : item.status || "Active"}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {selectedAffiliate.referrals.length <= 0 && (
                            <tr>
                              <td colSpan={4} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                                No referrals yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                      <h4 className="font-black text-slate-950">Recent Commissions</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-sm">
                        <thead className="bg-white text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-4 text-left">Referral</th>
                            <th className="px-5 py-4 text-left">Deposit</th>
                            <th className="px-5 py-4 text-left">Rate</th>
                            <th className="px-5 py-4 text-left">Commission</th>
                            <th className="px-5 py-4 text-left">Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {selectedAffiliate.commissions.slice(0, 8).map((item) => (
                            <tr key={item.id} className="border-t border-slate-100">
                              <td className="px-5 py-4">
                                <p className="font-black text-slate-900">{item.referred_username || "Referral"}</p>
                                <p className="text-xs font-semibold text-slate-500">{formatDate(item.created_at)}</p>
                              </td>
                              <td className="px-5 py-4 font-black text-slate-800">{formatAmount(item.deposit_amount)}</td>
                              <td className="px-5 py-4 font-black text-blue-600">{toNumber(item.commission_rate)}%</td>
                              <td className="px-5 py-4 font-black text-emerald-600">{formatAmount(item.commission_amount)}</td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700">
                                  {item.status || "available"}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {selectedAffiliate.commissions.length <= 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-8 text-center text-sm font-semibold text-slate-500">
                                No commission records yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}

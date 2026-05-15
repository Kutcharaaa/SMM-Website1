"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  EyeOff,
  Info,
  Megaphone,
  Pencil,
  Percent,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
};

const typeOptions = ["update", "maintenance", "feature", "promotion", "info"];

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getTypeConfig(type: string) {
  if (type === "maintenance") {
    return {
      icon: Settings,
      color: "bg-orange-50 text-orange-500",
      typeStyle: "bg-orange-50 text-orange-500",
    };
  }

  if (type === "feature") {
    return {
      icon: Sparkles,
      color: "bg-purple-50 text-purple-600",
      typeStyle: "bg-purple-50 text-purple-600",
    };
  }

  if (type === "promotion") {
    return {
      icon: Percent,
      color: "bg-green-50 text-green-600",
      typeStyle: "bg-green-50 text-green-600",
    };
  }

  if (type === "info") {
    return {
      icon: Info,
      color: "bg-blue-50 text-blue-600",
      typeStyle: "bg-blue-50 text-blue-600",
    };
  }

  return {
    icon: Megaphone,
    color: "bg-green-50 text-green-600",
    typeStyle: "bg-green-50 text-green-600",
  };
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [activeTab, setActiveTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("update");
  const [status, setStatus] = useState("published");

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("update");
    setStatus("published");
    setEditingAnnouncement(null);
  }

  function openCreateModal() {
    resetForm();
    setOpen(true);
  }

  function openEditModal(item: Announcement) {
    setEditingAnnouncement(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setType(item.type || "update");
    setStatus(item.status || "published");
    setOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) return;

    if (editingAnnouncement) {
      await supabase
        .from("announcements")
        .update({
          title,
          description,
          type,
          status,
        })
        .eq("id", editingAnnouncement.id);
    } else {
      await supabase.from("announcements").insert({
        title,
        description,
        type,
        status,
      });
    }

    setOpen(false);
    resetForm();
    loadAnnouncements();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("Delete this announcement?");
    if (!confirmDelete) return;

    await supabase.from("announcements").delete().eq("id", id);

    loadAnnouncements();
  }

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((item) => {
      const matchesTab =
        activeTab === "all" ? true : item.status === activeTab;

      const matchesType =
        typeFilter === "all" ? true : item.type === typeFilter;

      const keyword = search.toLowerCase();

      const matchesSearch =
        item.title.toLowerCase().includes(keyword) ||
        (item.description || "").toLowerCase().includes(keyword);

      return matchesTab && matchesType && matchesSearch;
    });
  }, [announcements, activeTab, typeFilter, search]);

  const publishedCount = announcements.filter(
    (item) => item.status === "published"
  ).length;

  const hiddenCount = announcements.filter(
    (item) => item.status === "hidden"
  ).length;

  const thisMonthCount = announcements.filter((item) => {
    const date = new Date(item.created_at);
    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <AdminGuard allowedRoles={["admin", "head_admin", "super_admin"]}>
      <AdminLayout>
        <div className="-m-8 min-h-screen bg-[#f6f9fc] p-8 text-slate-950">
          <div className="mb-6">
            <h1 className="text-3xl font-black">Announcement Management</h1>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <span>Dashboard</span>
              <span>›</span>
              <span>Announcements</span>
            </div>
          </div>

          <div className="mb-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Megaphone}
              title="Total Announcements"
              value={String(announcements.length)}
              subtitle="All time announcements"
            />
            <StatCard
              icon={Send}
              title="Published"
              value={String(publishedCount)}
              subtitle="Visible to users"
            />
            <StatCard
              icon={EyeOff}
              title="Hidden"
              value={String(hiddenCount)}
              subtitle="Not visible to users"
            />
            <StatCard
              icon={CalendarDays}
              title="This Month"
              value={String(thisMonthCount)}
              subtitle="New announcements"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-5">
                {["all", "published", "hidden"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-3 text-sm font-black capitalize ${
                      activeTab === tab
                        ? "border-b-2 border-green-600 text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none"
                >
                  <option value="all">All Types</option>
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {formatType(option)}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm outline-none md:w-80"
                  />
                </div>

                <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                  <SlidersHorizontal size={18} />
                </button>

                <button
                  onClick={openCreateModal}
                  className="flex h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 text-sm font-black text-white transition hover:bg-green-700"
                >
                  <Plus size={18} />
                  Create Announcement
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-5 text-left font-black">TITLE</th>
                    <th className="p-5 text-left font-black">TYPE</th>
                    <th className="p-5 text-left font-black">STATUS</th>
                    <th className="p-5 text-left font-black">PUBLISHED AT</th>
                    <th className="p-5 text-left font-black">ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAnnouncements.length <= 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-500">
                        No announcements found.
                      </td>
                    </tr>
                  ) : (
                    filteredAnnouncements.map((item) => {
                      const config = getTypeConfig(item.type);
                      const Icon = config.icon;

                      return (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="p-5">
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex h-12 w-12 items-center justify-center rounded-full ${config.color}`}
                              >
                                <Icon size={22} />
                              </div>

                              <div>
                                <h4 className="font-black text-slate-950">
                                  {item.title}
                                </h4>
                                <p className="mt-1 text-slate-500">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-5">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black ${config.typeStyle}`}
                            >
                              {formatType(item.type)}
                            </span>
                          </td>

                          <td className="p-5">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black capitalize ${
                                item.status === "published"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-orange-50 text-orange-500"
                              }`}
                            >
                              • {item.status}
                            </span>
                          </td>

                          <td className="p-5">
                            <p className="font-semibold text-slate-700">
                              {new Date(item.created_at).toLocaleString()}
                            </p>
                          </td>

                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditModal(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                onClick={() => handleDelete(item.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-500">
                Showing {filteredAnnouncements.length} of {announcements.length} results
              </p>
            </div>
          </div>

          {open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      {editingAnnouncement
                        ? "Edit Announcement"
                        : "Create Announcement"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Add or update a dashboard announcement.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />

                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Announcement description"
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    >
                      {typeOptions.map((option) => (
                        <option key={option} value={option}>
                          {formatType(option)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSave}
                    className="w-full rounded-2xl bg-green-600 py-4 text-sm font-black text-white hover:bg-green-700"
                  >
                    {editingAnnouncement
                      ? "Save Announcement"
                      : "Publish Announcement"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: any;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
          <Icon size={30} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <h3 className="mt-2 text-4xl font-black text-slate-950">{value}</h3>
          <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
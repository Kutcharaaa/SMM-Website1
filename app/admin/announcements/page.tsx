"use client";

import { useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
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

const announcements = [
  {
    title: "New Payment Method Available",
    desc: "We now accept GCash payments!",
    type: "Update",
    status: "Published",
    date: "May 20, 2024 10:30 AM",
    ago: "2 days ago",
    icon: Megaphone,
    color: "bg-green-50 text-green-600",
    typeStyle: "bg-green-50 text-green-600",
  },
  {
    title: "System Maintenance",
    desc: "Scheduled maintenance this weekend.",
    type: "Maintenance",
    status: "Published",
    date: "May 18, 2024 08:45 AM",
    ago: "4 days ago",
    icon: Settings,
    color: "bg-orange-50 text-orange-500",
    typeStyle: "bg-orange-50 text-orange-500",
  },
  {
    title: "New Instagram Services Added",
    desc: "Check out our new Instagram services.",
    type: "Feature",
    status: "Published",
    date: "May 15, 2024 02:15 PM",
    ago: "7 days ago",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-600",
    typeStyle: "bg-purple-50 text-purple-600",
  },
  {
    title: "Special Discount Event",
    desc: "Get up to 20% off on selected services!",
    type: "Promotion",
    status: "Hidden",
    date: "May 10, 2024 11:20 AM",
    ago: "12 days ago",
    icon: Percent,
    color: "bg-green-50 text-green-600",
    typeStyle: "bg-green-50 text-green-600",
  },
  {
    title: "Terms of Service Update",
    desc: "Important updates to our terms.",
    type: "Update",
    status: "Published",
    date: "May 5, 2024 09:00 AM",
    ago: "17 days ago",
    icon: Info,
    color: "bg-green-50 text-green-600",
    typeStyle: "bg-green-50 text-green-600",
  },
];

export default function AdminAnnouncementsPage() {
  const [open, setOpen] = useState(false);

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
              value="12"
              subtitle="All time announcements"
            />
            <StatCard
              icon={Send}
              title="Published"
              value="10"
              subtitle="Visible to users"
            />
            <StatCard
              icon={EyeOff}
              title="Hidden"
              value="2"
              subtitle="Not visible to users"
            />
            <StatCard
              icon={CalendarDays}
              title="This Month"
              value="4"
              subtitle="New announcements"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-5">
                <button className="border-b-2 border-green-600 px-3 py-3 text-sm font-black text-green-600">
                  All
                </button>

                <button className="px-3 py-3 text-sm font-bold text-slate-500">
                  Published
                </button>

                <button className="px-3 py-3 text-sm font-bold text-slate-500">
                  Hidden
                </button>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <select className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none">
                  <option>All Types</option>
                  <option>Update</option>
                  <option>Maintenance</option>
                  <option>Feature</option>
                  <option>Promotion</option>
                </select>

                <div className="relative">
                  <Search
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    placeholder="Search announcements..."
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm outline-none md:w-80"
                  />
                </div>

                <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600">
                  <SlidersHorizontal size={18} />
                </button>

                <button
                  onClick={() => setOpen(true)}
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
                  {announcements.map((item) => {
                    const Icon = item.icon;

                    return (
                      <tr key={item.title} className="border-t border-slate-100">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}
                            >
                              <Icon size={22} />
                            </div>

                            <div>
                              <h4 className="font-black text-slate-950">
                                {item.title}
                              </h4>
                              <p className="mt-1 text-slate-500">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-5">
                          <span
                            className={`rounded-lg px-3 py-1 text-xs font-black ${item.typeStyle}`}
                          >
                            {item.type}
                          </span>
                        </td>

                        <td className="p-5">
                          <span
                            className={`rounded-lg px-3 py-1 text-xs font-black ${
                              item.status === "Published"
                                ? "bg-green-50 text-green-600"
                                : "bg-orange-50 text-orange-500"
                            }`}
                          >
                            • {item.status}
                          </span>
                        </td>

                        <td className="p-5">
                          <p className="font-semibold text-slate-700">
                            {item.date}
                          </p>
                          <p className="mt-1 text-slate-500">{item.ago}</p>
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                              <Pencil size={17} />
                            </button>

                            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-500">
                Showing 1 to 5 of 12 results
              </p>

              <div className="flex items-center gap-2">
                <button className="h-10 w-10 rounded-xl border border-slate-200 text-slate-500">
                  ‹
                </button>
                <button className="h-10 w-10 rounded-xl bg-green-700 font-black text-white">
                  1
                </button>
                <button className="h-10 w-10 rounded-xl border border-slate-200 font-bold text-slate-600">
                  2
                </button>
                <button className="h-10 w-10 rounded-xl border border-slate-200 font-bold text-slate-600">
                  3
                </button>
                <button className="h-10 w-10 rounded-xl border border-slate-200 text-slate-500">
                  ›
                </button>
              </div>
            </div>
          </div>

          {open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Create Announcement
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Add a new dashboard announcement.
                    </p>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5 p-6">
                  <input
                    placeholder="Announcement title"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />

                  <textarea
                    rows={4}
                    placeholder="Announcement description"
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                      <option>Update</option>
                      <option>Maintenance</option>
                      <option>Feature</option>
                      <option>Promotion</option>
                    </select>

                    <select className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                      <option>Published</option>
                      <option>Hidden</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="w-full rounded-2xl bg-green-600 py-4 text-sm font-black text-white hover:bg-green-700"
                  >
                    Publish Announcement
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
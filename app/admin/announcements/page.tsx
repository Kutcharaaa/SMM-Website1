"use client";

import { useEffect, useState } from "react";

import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";

import { supabase } from "@/lib/supabase";

import {
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [type, setType] =
    useState("update");

  const [status, setStatus] =
    useState("published");

  async function loadAnnouncements() {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleCreate() {
    if (!title) return;

    await supabase.from("announcements").insert({
      title,
      description,
      type,
      status,
    });

    setTitle("");
    setDescription("");
    setType("update");
    setStatus("published");

    setOpen(false);

    loadAnnouncements();
  }

  async function handleDelete(id: string) {
    await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    loadAnnouncements();
  }

  const publishedCount =
    announcements.filter(
      (item) => item.status === "published"
    ).length;

  const hiddenCount =
    announcements.filter(
      (item) => item.status === "hidden"
    ).length;

  return (
    <AdminGuard
      allowedRoles={[
        "admin",
        "head_admin",
        "super_admin",
      ]}
    >
      <AdminLayout>
        <div className="space-y-6">

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-950">
                Announcement Management
              </h1>

              <p className="mt-2 text-slate-500">
                Manage dashboard announcements and updates.
              </p>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />

              Create Announcement
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Total Announcements
              </p>

              <h3 className="mt-4 text-4xl font-black text-slate-950">
                {announcements.length}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Published
              </p>

              <h3 className="mt-4 text-4xl font-black text-green-600">
                {publishedCount}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Hidden
              </p>

              <h3 className="mt-4 text-4xl font-black text-orange-500">
                {hiddenCount}
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                This Month
              </p>

              <h3 className="mt-4 text-4xl font-black text-purple-600">
                {
                  announcements.filter(
                    (item) =>
                      new Date(
                        item.created_at
                      ).getMonth() ===
                      new Date().getMonth()
                  ).length
                }
              </h3>
            </div>

          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 p-5">
              <h3 className="text-lg font-black text-slate-950">
                Announcements
              </h3>
            </div>

            {announcements.length <= 0 ? (
              <div className="p-10 text-center text-slate-500">
                No announcements yet.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px] text-sm">

                  <thead className="bg-slate-50 text-slate-500">

                    <tr>
                      <th className="p-5 text-left font-bold">
                        Title
                      </th>

                      <th className="p-5 text-left font-bold">
                        Type
                      </th>

                      <th className="p-5 text-left font-bold">
                        Status
                      </th>

                      <th className="p-5 text-left font-bold">
                        Published
                      </th>

                      <th className="p-5 text-left font-bold">
                        Actions
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {announcements.map((item) => (

                      <tr
                        key={item.id}
                        className="border-t border-slate-100"
                      >

                        <td className="p-5">

                          <h4 className="font-black text-slate-950">
                            {item.title}
                          </h4>

                          <p className="mt-1 text-slate-500">
                            {item.description}
                          </p>

                        </td>

                        <td className="p-5">

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 capitalize">
                            {item.type}
                          </span>

                        </td>

                        <td className="p-5">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black capitalize ${
                              item.status ===
                              "published"
                                ? "bg-green-50 text-green-600"
                                : "bg-orange-50 text-orange-600"
                            }`}
                          >
                            {item.status}
                          </span>

                        </td>

                        <td className="p-5 text-slate-500">
                          {new Date(
                            item.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td className="p-5">

                          <button
                            onClick={() =>
                              handleDelete(item.id)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                          >
                            <Trash2 size={18} />
                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            )}

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
                      Publish updates to user dashboards.
                    </p>
                  </div>

                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>

                </div>

                <div className="space-y-5 p-6">

                  <div>

                    <label className="text-sm font-bold text-slate-700">
                      Title
                    </label>

                    <input
                      value={title}
                      onChange={(e) =>
                        setTitle(e.target.value)
                      }
                      placeholder="Announcement title"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    />

                  </div>

                  <div>

                    <label className="text-sm font-bold text-slate-700">
                      Description
                    </label>

                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) =>
                        setDescription(
                          e.target.value
                        )
                      }
                      placeholder="Announcement description"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 resize-none"
                    />

                  </div>

                  <div className="grid gap-4 md:grid-cols-2">

                    <div>

                      <label className="text-sm font-bold text-slate-700">
                        Type
                      </label>

                      <select
                        value={type}
                        onChange={(e) =>
                          setType(e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="update">
                          Update
                        </option>

                        <option value="maintenance">
                          Maintenance
                        </option>

                        <option value="feature">
                          Feature
                        </option>

                        <option value="promotion">
                          Promotion
                        </option>

                        <option value="info">
                          Info
                        </option>
                      </select>

                    </div>

                    <div>

                      <label className="text-sm font-bold text-slate-700">
                        Status
                      </label>

                      <select
                        value={status}
                        onChange={(e) =>
                          setStatus(e.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="published">
                          Published
                        </option>

                        <option value="hidden">
                          Hidden
                        </option>
                      </select>

                    </div>

                  </div>

                  <button
                    onClick={handleCreate}
                    className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white transition hover:bg-blue-700"
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
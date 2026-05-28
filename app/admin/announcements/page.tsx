"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  EyeOff,
  Gift,
  ImageIcon,
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
  Upload,
  X,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  created_at: string;
  image_url?: string | null;
  show_popup?: boolean | null;
  promo_enabled?: boolean | null;
  promo_type?: string | null;
  promo_min_amount?: number | string | null;
  promo_bonus_percent?: number | string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type PromoTemplate = {
  label: string;
  title: string;
  description: string;
  type: string;
  show_popup: boolean;
  promo_enabled: boolean;
  promo_type: string;
  promo_min_amount: string;
  promo_bonus_percent: string;
};

const typeOptions = ["update", "maintenance", "feature", "promotion", "info"];

const promoTemplates: PromoTemplate[] = [
  {
    label: "+10% bonus on every ₱500 Add Funds",
    title: "Add Funds Bonus Promo",
    description:
      "Get an additional 10% bonus when you add funds worth ₱500 or more. Example: Add ₱500 and receive ₱550 wallet credit after approval.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "add_funds_bonus",
    promo_min_amount: "500",
    promo_bonus_percent: "10",
  },
  {
    label: "+5% bonus on every ₱1,000 Add Funds",
    title: "Big Add Funds Bonus",
    description:
      "Get an additional 5% bonus when you add funds worth ₱1,000 or more. Bonus is applied after admin approval.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "add_funds_bonus",
    promo_min_amount: "1000",
    promo_bonus_percent: "5",
  },
  {
    label: "10% Discount to all Facebook Services",
    title: "Facebook Services Discount",
    description:
      "Limited promo: Enjoy 10% discount on selected Facebook services while the promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "service_discount",
    promo_min_amount: "0",
    promo_bonus_percent: "10",
  },
  {
    label: "Weekend Promo Announcement Only",
    title: "Weekend Promo",
    description:
      "Weekend promo is now live. Check our services and add funds while the offer is available.",
    type: "promotion",
    show_popup: true,
    promo_enabled: false,
    promo_type: "",
    promo_min_amount: "0",
    promo_bonus_percent: "0",
  },
];

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function dateTimeLocalToIso(value: string) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
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

  const [imageUrl, setImageUrl] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoType, setPromoType] = useState("");
  const [promoMinAmount, setPromoMinAmount] = useState("0");
  const [promoBonusPercent, setPromoBonusPercent] = useState("0");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  const [message, setMessage] = useState("");

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setAnnouncements((data || []) as Announcement[]);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("update");
    setStatus("published");
    setImageUrl("");
    setShowPopup(false);
    setPromoEnabled(false);
    setPromoType("");
    setPromoMinAmount("0");
    setPromoBonusPercent("0");
    setStartsAt("");
    setEndsAt("");
    setEditingAnnouncement(null);
    setMessage("");
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
    setImageUrl(item.image_url || "");
    setShowPopup(Boolean(item.show_popup));
    setPromoEnabled(Boolean(item.promo_enabled));
    setPromoType(item.promo_type || "");
    setPromoMinAmount(String(item.promo_min_amount ?? "0"));
    setPromoBonusPercent(String(item.promo_bonus_percent ?? "0"));
    setStartsAt(toDateTimeLocal(item.starts_at));
    setEndsAt(toDateTimeLocal(item.ends_at));
    setMessage("");
    setOpen(true);
  }

  function applyPromoTemplate(templateLabel: string) {
    const template = promoTemplates.find((item) => item.label === templateLabel);

    if (!template) return;

    setTitle(template.title);
    setDescription(template.description);
    setType(template.type);
    setShowPopup(template.show_popup);
    setPromoEnabled(template.promo_enabled);
    setPromoType(template.promo_type);
    setPromoMinAmount(template.promo_min_amount);
    setPromoBonusPercent(template.promo_bonus_percent);
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image file.");
      return;
    }

    setUploadingImage(true);
    setMessage("");

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
    const filePath = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("announcement-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setMessage(error.message);
      setUploadingImage(false);
      return;
    }

    const { data } = supabase.storage
      .from("announcement-images")
      .getPublicUrl(filePath);

    setImageUrl(data.publicUrl);
    setUploadingImage(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      setMessage("Announcement title is required.");
      return;
    }

    if (showPopup && !imageUrl) {
      setMessage("Please upload an announcement image before enabling popup modal.");
      return;
    }

    if (promoEnabled && !promoType) {
      setMessage("Please select a promo type.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      image_url: imageUrl || null,
      show_popup: showPopup,
      promo_enabled: promoEnabled,
      promo_type: promoEnabled ? promoType : null,
      promo_min_amount: promoEnabled ? Number(promoMinAmount || 0) : 0,
      promo_bonus_percent: promoEnabled ? Number(promoBonusPercent || 0) : 0,
      starts_at: dateTimeLocalToIso(startsAt),
      ends_at: dateTimeLocalToIso(endsAt),
    };

    if (editingAnnouncement) {
      const { error } = await supabase
        .from("announcements")
        .update(payload)
        .eq("id", editingAnnouncement.id);

      if (error) {
        setMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("announcements").insert(payload);

      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setOpen(false);
    resetForm();
    loadAnnouncements();
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm("Delete this announcement?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

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
    (item) => item.status === "published",
  ).length;

  const hiddenCount = announcements.filter(
    (item) => item.status === "hidden",
  ).length;

  const popupCount = announcements.filter((item) => item.show_popup).length;

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

          {message && (
            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-700">
              {message}
            </div>
          )}

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
              icon={ImageIcon}
              title="Popup Enabled"
              value={String(popupCount)}
              subtitle="Shown as modal"
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
              <div className="flex items-center gap-5 overflow-x-auto">
                {["all", "published", "hidden"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 px-3 py-3 text-sm font-black capitalize ${
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
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-5 text-left font-black">TITLE</th>
                    <th className="p-5 text-left font-black">TYPE</th>
                    <th className="p-5 text-left font-black">POPUP</th>
                    <th className="p-5 text-left font-black">PROMO</th>
                    <th className="p-5 text-left font-black">STATUS</th>
                    <th className="p-5 text-left font-black">PUBLISHED AT</th>
                    <th className="p-5 text-left font-black">ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAnnouncements.length <= 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500">
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
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.title}
                                  className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
                                />
                              ) : (
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-full ${config.color}`}
                                >
                                  <Icon size={22} />
                                </div>
                              )}

                              <div>
                                <h4 className="font-black text-slate-950">
                                  {item.title}
                                </h4>
                                <p className="mt-1 line-clamp-2 max-w-[420px] text-slate-500">
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
                              className={`rounded-lg px-3 py-1 text-xs font-black ${
                                item.show_popup
                                  ? "bg-purple-50 text-purple-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.show_popup ? "Show Modal" : "No Popup"}
                            </span>
                          </td>

                          <td className="p-5">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-black ${
                                item.promo_enabled
                                  ? "bg-green-50 text-green-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.promo_enabled
                                ? `${item.promo_bonus_percent || 0}% ${
                                    item.promo_type || "promo"
                                  }`
                                : "No Promo"}
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
                              {formatDateTime(item.created_at)}
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
              <div className="my-6 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
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

                <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
                  {message && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                      {message}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Promo Templates
                    </label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        applyPromoTemplate(e.target.value);
                        e.target.value = "";
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-green-500"
                    >
                      <option value="">Choose example template...</option>
                      {promoTemplates.map((template) => (
                        <option key={template.label} value={template.label}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Announcement title"
                      className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500 md:col-span-2"
                    />

                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Announcement description"
                      className="resize-none rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500 md:col-span-2"
                    />

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

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="font-black text-slate-950">
                          Announcement Image
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Upload image for popup modal.
                        </p>
                      </div>

                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">
                        <Upload size={17} />
                        {uploadingImage ? "Uploading..." : "Upload Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e.target.files?.[0] || null)
                          }
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>

                    {imageUrl && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                        <img
                          src={imageUrl}
                          alt="Announcement preview"
                          className="max-h-80 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setShowPopup(true)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        showPopup
                          ? "border-purple-300 bg-purple-50 ring-4 ring-purple-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            showPopup ? "bg-purple-600" : "bg-slate-300"
                          }`}
                        />
                        <span className="font-black text-slate-900">
                          Show in Popup Modal
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Users will see this announcement in a popup.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPopup(false)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        !showPopup
                          ? "border-slate-300 bg-slate-50 ring-4 ring-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            !showPopup ? "bg-slate-600" : "bg-slate-300"
                          }`}
                        />
                        <span className="font-black text-slate-900">
                          No Popup Modal
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        Announcement only appears in LatestAnnouncement.
                      </p>
                    </button>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                    <div className="flex items-start gap-3">
                      <Gift size={20} className="mt-0.5 text-green-600" />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-slate-950">
                          Promo Settings
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Use this for promos like +10% on every ₱500 Add Funds.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setPromoEnabled(true)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          promoEnabled
                            ? "border-green-300 bg-white ring-4 ring-green-100"
                            : "border-green-100 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <span className="font-black text-slate-900">
                          Promo Enabled
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPromoEnabled(false);
                          setPromoType("");
                          setPromoMinAmount("0");
                          setPromoBonusPercent("0");
                        }}
                        className={`rounded-2xl border p-4 text-left transition ${
                          !promoEnabled
                            ? "border-slate-300 bg-white ring-4 ring-slate-100"
                            : "border-green-100 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <span className="font-black text-slate-900">
                          Promo Disabled
                        </span>
                      </button>

                      <select
                        value={promoType}
                        onChange={(e) => setPromoType(e.target.value)}
                        disabled={!promoEnabled}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none disabled:opacity-50"
                      >
                        <option value="">Select promo type</option>
                        <option value="add_funds_bonus">Add Funds Bonus</option>
                        <option value="service_discount">
                          Service Discount Later
                        </option>
                      </select>

                      <input
                        type="number"
                        value={promoMinAmount}
                        onChange={(e) => setPromoMinAmount(e.target.value)}
                        placeholder="Minimum amount"
                        disabled={!promoEnabled}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none disabled:opacity-50"
                      />

                      <input
                        type="number"
                        value={promoBonusPercent}
                        onChange={(e) => setPromoBonusPercent(e.target.value)}
                        placeholder="Bonus percent"
                        disabled={!promoEnabled}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none disabled:opacity-50"
                      />

                      <div className="rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm font-bold text-green-700">
                        Example: ₱500 + {promoBonusPercent || 0}% = ₱
                        {(
                          500 +
                          500 * (Number(promoBonusPercent || 0) / 100)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Starts At
                      </label>
                      <input
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Ends At
                      </label>
                      <input
                        type="datetime-local"
                        value={endsAt}
                        onChange={(e) => setEndsAt(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
                      />
                    </div>
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

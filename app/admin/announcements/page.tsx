"use client";

import { useEffect, useMemo, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import AdminLayout from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
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

type PromoType =
  | ""
  | "add_funds_bonus"
  | "first_add_funds_bonus"
  | "platform_discount"
  | "service_discount"
  | "category_discount"
  | "bulk_quantity_discount"
  | "minimum_spend_discount"
  | "new_user_first_order_discount"
  | "reseller_only_promo"
  | "promo_code";

type PromoConfig = {
  minAmount?: number;
  bonusPercent?: number;
  discountPercent?: number;
  platform?: string;
  category?: string;
  serviceId?: string;
  minQuantity?: number;
  minSpend?: number;
  requiredLevel?: string;
  code?: string;
  usageLimit?: number;
};

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
  promo_type?: PromoType | string | null;
  promo_config?: PromoConfig | null;
  promo_min_amount?: number | string | null;
  promo_bonus_percent?: number | string | null;
  promo_discount_percent?: number | string | null;
  promo_platform?: string | null;
  promo_service_id?: string | null;
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
  promo_type: PromoType;
  promo_config: PromoConfig;
};

const typeOptions = ["update", "maintenance", "feature", "promotion", "info"];

const platformOptions = [
  "Facebook",
  "TikTok",
  "Instagram",
  "YouTube",
  "Roblox",
  "Telegram",
  "Spotify",
  "Twitter",
  "Twitch",
  "Discord",
  "Google",
  "Website",
  "Reviews",
];

const resellerLevels = [
  "New Reseller",
  "Power Reseller",
  "Pro Reseller",
  "Master Reseller",
  "Premium Partner",
  "Elite Partner",
  "Ascend Partner",
];

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
    promo_config: {
      minAmount: 500,
      bonusPercent: 10,
    },
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
    promo_config: {
      minAmount: 1000,
      bonusPercent: 5,
    },
  },
  {
    label: "+10% bonus on first Add Funds",
    title: "First Add Funds Bonus",
    description:
      "New users can get an additional 10% bonus on their first Add Funds worth ₱500 or more.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "first_add_funds_bonus",
    promo_config: {
      minAmount: 500,
      bonusPercent: 10,
    },
  },
  {
    label: "10% off all Facebook Services",
    title: "Facebook Services Discount",
    description:
      "Limited promo: Enjoy 10% discount on all Facebook services while the promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "platform_discount",
    promo_config: {
      platform: "Facebook",
      discountPercent: 10,
    },
  },
  {
    label: "5% off Service ID 32",
    title: "Specific Service Discount",
    description:
      "Limited promo: Enjoy 5% discount on selected service ID 32 while the promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "service_discount",
    promo_config: {
      serviceId: "32",
      discountPercent: 5,
    },
  },
  {
    label: "10% off TikTok Followers category",
    title: "TikTok Followers Category Discount",
    description:
      "Limited promo: Enjoy 10% discount on TikTok Followers category services while the promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "category_discount",
    promo_config: {
      category: "TikTok Followers",
      discountPercent: 10,
    },
  },
  {
    label: "5% off 10,000+ quantity orders",
    title: "Bulk Quantity Discount",
    description:
      "Order 10,000 quantity or more and get 5% discount automatically while this promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "bulk_quantity_discount",
    promo_config: {
      minQuantity: 10000,
      discountPercent: 5,
      platform: "all",
    },
  },
  {
    label: "Spend ₱500 and get 5% off",
    title: "Minimum Spend Discount",
    description:
      "Spend at least ₱500 in one order and get 5% discount while this promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "minimum_spend_discount",
    promo_config: {
      minSpend: 500,
      discountPercent: 5,
    },
  },
  {
    label: "New user first order gets 10% off",
    title: "New User First Order Promo",
    description:
      "New users can get 10% discount on their first order while this promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "new_user_first_order_discount",
    promo_config: {
      discountPercent: 10,
    },
  },
  {
    label: "Power Resellers get 3% off",
    title: "Reseller Exclusive Discount",
    description:
      "Power Reseller and qualified reseller users can get 3% discount while this promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "reseller_only_promo",
    promo_config: {
      requiredLevel: "Power Reseller",
      discountPercent: 3,
    },
  },
  {
    label: "Promo code ASCEND10 for 10% off",
    title: "Promo Code Discount",
    description:
      "Use promo code ASCEND10 to get 10% discount while the promo is active.",
    type: "promotion",
    show_popup: true,
    promo_enabled: true,
    promo_type: "promo_code",
    promo_config: {
      code: "ASCEND10",
      discountPercent: 10,
      usageLimit: 100,
    },
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
    promo_config: {},
  },
];

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

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

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizeConfig(config: unknown): PromoConfig {
  if (!config || typeof config !== "object") return {};
  return config as PromoConfig;
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

function getPromoSummary(enabled: boolean, promoType: PromoType | string, config: PromoConfig) {
  if (!enabled || !promoType) return "No promo applied";

  if (promoType === "add_funds_bonus") {
    return `+${toNumber(config.bonusPercent)}% bonus on every ${formatMoney(
      config.minAmount || 0,
    )} Add Funds`;
  }

  if (promoType === "first_add_funds_bonus") {
    return `+${toNumber(config.bonusPercent)}% bonus on first Add Funds of at least ${formatMoney(
      config.minAmount || 0,
    )}`;
  }

  if (promoType === "platform_discount") {
    return `${toNumber(config.discountPercent)}% off all ${
      config.platform || "selected"
    } services`;
  }

  if (promoType === "service_discount") {
    return `${toNumber(config.discountPercent)}% off Service ID ${
      config.serviceId || "—"
    }`;
  }

  if (promoType === "category_discount") {
    return `${toNumber(config.discountPercent)}% off ${
      config.category || "selected"
    } category`;
  }

  if (promoType === "bulk_quantity_discount") {
    const platform =
      config.platform && config.platform !== "all"
        ? ` on ${config.platform} services`
        : "";
    return `${toNumber(config.discountPercent)}% off ${toNumber(
      config.minQuantity,
    ).toLocaleString("en-PH")}+ quantity orders${platform}`;
  }

  if (promoType === "minimum_spend_discount") {
    return `${toNumber(config.discountPercent)}% off orders worth at least ${formatMoney(
      config.minSpend || 0,
    )}`;
  }

  if (promoType === "new_user_first_order_discount") {
    return `${toNumber(config.discountPercent)}% off new user's first order`;
  }

  if (promoType === "reseller_only_promo") {
    return `${toNumber(config.discountPercent)}% off for ${
      config.requiredLevel || "selected reseller level"
    }`;
  }

  if (promoType === "promo_code") {
    return `Code ${String(config.code || "PROMO").toUpperCase()} gives ${toNumber(
      config.discountPercent,
    )}% off`;
  }

  return "Promo applied";
}

function buildPromoConfig({
  promoType,
  promoMinAmount,
  promoBonusPercent,
  promoDiscountPercent,
  promoPlatform,
  promoCategory,
  promoServiceId,
  promoMinQuantity,
  promoMinSpend,
  promoRequiredLevel,
  promoCode,
  promoUsageLimit,
}: {
  promoType: PromoType;
  promoMinAmount: string;
  promoBonusPercent: string;
  promoDiscountPercent: string;
  promoPlatform: string;
  promoCategory: string;
  promoServiceId: string;
  promoMinQuantity: string;
  promoMinSpend: string;
  promoRequiredLevel: string;
  promoCode: string;
  promoUsageLimit: string;
}): PromoConfig {
  if (promoType === "add_funds_bonus") {
    return {
      minAmount: toNumber(promoMinAmount),
      bonusPercent: toNumber(promoBonusPercent),
    };
  }

  if (promoType === "first_add_funds_bonus") {
    return {
      minAmount: toNumber(promoMinAmount),
      bonusPercent: toNumber(promoBonusPercent),
    };
  }

  if (promoType === "platform_discount") {
    return {
      platform: promoPlatform || "Facebook",
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "service_discount") {
    return {
      serviceId: promoServiceId.trim(),
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "category_discount") {
    return {
      category: promoCategory.trim(),
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "bulk_quantity_discount") {
    return {
      minQuantity: toNumber(promoMinQuantity),
      discountPercent: toNumber(promoDiscountPercent),
      platform: promoPlatform || "all",
    };
  }

  if (promoType === "minimum_spend_discount") {
    return {
      minSpend: toNumber(promoMinSpend),
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "new_user_first_order_discount") {
    return {
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "reseller_only_promo") {
    return {
      requiredLevel: promoRequiredLevel || "Power Reseller",
      discountPercent: toNumber(promoDiscountPercent),
    };
  }

  if (promoType === "promo_code") {
    return {
      code: promoCode.trim().toUpperCase(),
      discountPercent: toNumber(promoDiscountPercent),
      usageLimit: toNumber(promoUsageLimit),
    };
  }

  return {};
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [promoSettingsOpen, setPromoSettingsOpen] = useState(false);
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
  const [promoType, setPromoType] = useState<PromoType>("");
  const [promoConfig, setPromoConfig] = useState<PromoConfig>({});

  const [promoMinAmount, setPromoMinAmount] = useState("0");
  const [promoBonusPercent, setPromoBonusPercent] = useState("0");
  const [promoDiscountPercent, setPromoDiscountPercent] = useState("0");
  const [promoPlatform, setPromoPlatform] = useState("Facebook");
  const [promoCategory, setPromoCategory] = useState("");
  const [promoServiceId, setPromoServiceId] = useState("");
  const [promoMinQuantity, setPromoMinQuantity] = useState("10000");
  const [promoMinSpend, setPromoMinSpend] = useState("500");
  const [promoRequiredLevel, setPromoRequiredLevel] = useState("Power Reseller");
  const [promoCode, setPromoCode] = useState("");
  const [promoUsageLimit, setPromoUsageLimit] = useState("0");

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

  function setPromoStateFromConfig(nextType: PromoType, nextConfig: PromoConfig) {
    setPromoType(nextType);
    setPromoConfig(nextConfig);

    setPromoMinAmount(String(nextConfig.minAmount ?? "0"));
    setPromoBonusPercent(String(nextConfig.bonusPercent ?? "0"));
    setPromoDiscountPercent(String(nextConfig.discountPercent ?? "0"));
    setPromoPlatform(String(nextConfig.platform || "Facebook"));
    setPromoCategory(String(nextConfig.category || ""));
    setPromoServiceId(String(nextConfig.serviceId || ""));
    setPromoMinQuantity(String(nextConfig.minQuantity ?? "10000"));
    setPromoMinSpend(String(nextConfig.minSpend ?? "500"));
    setPromoRequiredLevel(String(nextConfig.requiredLevel || "Power Reseller"));
    setPromoCode(String(nextConfig.code || ""));
    setPromoUsageLimit(String(nextConfig.usageLimit ?? "0"));
  }

  function resetPromoFields() {
    setPromoEnabled(false);
    setPromoType("");
    setPromoConfig({});
    setPromoMinAmount("0");
    setPromoBonusPercent("0");
    setPromoDiscountPercent("0");
    setPromoPlatform("Facebook");
    setPromoCategory("");
    setPromoServiceId("");
    setPromoMinQuantity("10000");
    setPromoMinSpend("500");
    setPromoRequiredLevel("Power Reseller");
    setPromoCode("");
    setPromoUsageLimit("0");
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("update");
    setStatus("published");
    setImageUrl("");
    setShowPopup(false);
    resetPromoFields();
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
    const itemConfig = normalizeConfig(item.promo_config);
    const fallbackConfig: PromoConfig = itemConfig && Object.keys(itemConfig).length > 0
      ? itemConfig
      : {
          minAmount: toNumber(item.promo_min_amount),
          bonusPercent: toNumber(item.promo_bonus_percent),
          discountPercent: toNumber(item.promo_discount_percent || item.promo_bonus_percent),
          platform: item.promo_platform || "Facebook",
          serviceId: item.promo_service_id || "",
        };

    setEditingAnnouncement(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setType(item.type || "update");
    setStatus(item.status || "published");
    setImageUrl(item.image_url || "");
    setShowPopup(Boolean(item.show_popup));
    setPromoEnabled(Boolean(item.promo_enabled));
    setPromoStateFromConfig((item.promo_type || "") as PromoType, fallbackConfig);
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
    setPromoStateFromConfig(template.promo_type, template.promo_config);
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

  function validatePromoSettings() {
    if (!promoEnabled) return true;

    if (!promoType) {
      setMessage("Please select a promo type.");
      return false;
    }

    if (promoType === "add_funds_bonus" || promoType === "first_add_funds_bonus") {
      if (toNumber(promoMinAmount) <= 0) {
        setMessage("Add Funds Bonus needs a minimum amount.");
        return false;
      }

      if (toNumber(promoBonusPercent) <= 0) {
        setMessage("Add Funds Bonus needs a bonus percent.");
        return false;
      }
    }

    if (
      [
        "platform_discount",
        "service_discount",
        "category_discount",
        "bulk_quantity_discount",
        "minimum_spend_discount",
        "new_user_first_order_discount",
        "reseller_only_promo",
        "promo_code",
      ].includes(promoType)
    ) {
      if (toNumber(promoDiscountPercent) <= 0) {
        setMessage("This promo needs a discount percent.");
        return false;
      }
    }

    if (promoType === "service_discount" && !promoServiceId.trim()) {
      setMessage("Specific Service Discount needs a service ID.");
      return false;
    }

    if (promoType === "category_discount" && !promoCategory.trim()) {
      setMessage("Category Discount needs a category name.");
      return false;
    }

    if (promoType === "bulk_quantity_discount" && toNumber(promoMinQuantity) <= 0) {
      setMessage("Bulk Quantity Discount needs a minimum quantity.");
      return false;
    }

    if (promoType === "minimum_spend_discount" && toNumber(promoMinSpend) <= 0) {
      setMessage("Minimum Spend Discount needs a minimum spend amount.");
      return false;
    }

    if (promoType === "promo_code" && !promoCode.trim()) {
      setMessage("Promo Code discount needs a promo code.");
      return false;
    }

    return true;
  }

  function confirmPromoSettings() {
    if (!promoEnabled) {
      resetPromoFields();
      setPromoSettingsOpen(false);
      setMessage("");
      return;
    }

    if (!validatePromoSettings()) return;

    const config = buildPromoConfig({
      promoType,
      promoMinAmount,
      promoBonusPercent,
      promoDiscountPercent,
      promoPlatform,
      promoCategory,
      promoServiceId,
      promoMinQuantity,
      promoMinSpend,
      promoRequiredLevel,
      promoCode,
      promoUsageLimit,
    });

    setPromoConfig(config);
    setPromoSettingsOpen(false);
    setMessage("");
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

    if (!validatePromoSettings()) return;

    const finalPromoConfig = promoEnabled
      ? buildPromoConfig({
          promoType,
          promoMinAmount,
          promoBonusPercent,
          promoDiscountPercent,
          promoPlatform,
          promoCategory,
          promoServiceId,
          promoMinQuantity,
          promoMinSpend,
          promoRequiredLevel,
          promoCode,
          promoUsageLimit,
        })
      : {};

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      status,
      image_url: imageUrl || null,
      show_popup: showPopup,
      promo_enabled: promoEnabled,
      promo_type: promoEnabled ? promoType : null,
      promo_config: finalPromoConfig,
      promo_min_amount:
        promoEnabled &&
        (promoType === "add_funds_bonus" || promoType === "first_add_funds_bonus")
          ? toNumber(finalPromoConfig.minAmount)
          : 0,
      promo_bonus_percent:
        promoEnabled &&
        (promoType === "add_funds_bonus" || promoType === "first_add_funds_bonus")
          ? toNumber(finalPromoConfig.bonusPercent)
          : 0,
      promo_discount_percent:
        promoEnabled && "discountPercent" in finalPromoConfig
          ? toNumber(finalPromoConfig.discountPercent)
          : 0,
      promo_platform:
        promoEnabled && "platform" in finalPromoConfig
          ? String(finalPromoConfig.platform || "")
          : null,
      promo_service_id:
        promoEnabled && "serviceId" in finalPromoConfig
          ? String(finalPromoConfig.serviceId || "")
          : null,
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

  const promoSummary = getPromoSummary(promoEnabled, promoType, promoConfig);

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
                      const itemPromoConfig = normalizeConfig(item.promo_config);

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
                              className={`inline-flex max-w-[220px] rounded-lg px-3 py-1 text-xs font-black ${
                                item.promo_enabled
                                  ? "bg-green-50 text-green-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {item.promo_enabled
                                ? getPromoSummary(
                                    true,
                                    item.promo_type || "",
                                    itemPromoConfig,
                                  )
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start gap-3">
                        <Gift size={20} className="mt-0.5 text-green-600" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-950">
                            Promo Settings
                          </h4>
                          <p className="mt-1 text-sm font-semibold text-slate-600">
                            Configure Add Funds bonus, discounts, promo codes, and reseller promos.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPromoSettingsOpen(true)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white transition hover:bg-green-700"
                      >
                        <Settings size={17} />
                        Promo Settings
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-green-200 bg-white px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">
                        Final Promo Output
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {promoSummary}
                      </p>
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

          {promoSettingsOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
              <div className="my-6 w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Promo Settings
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Select a promo type. Different promo types have different settings.
                    </p>
                  </div>

                  <button
                    onClick={() => setPromoSettingsOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="max-h-[75vh] space-y-5 overflow-y-auto p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPromoEnabled(true)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        promoEnabled
                          ? "border-green-300 bg-green-50 ring-4 ring-green-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-black text-slate-900">
                        Promo Enabled
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Promo will be saved with this announcement.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={resetPromoFields}
                      className={`rounded-2xl border p-4 text-left transition ${
                        !promoEnabled
                          ? "border-slate-300 bg-slate-50 ring-4 ring-slate-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-black text-slate-900">
                        Promo Disabled
                      </span>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Announcement only, no automatic promo.
                      </p>
                    </button>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Promo Type
                    </label>
                    <select
                      value={promoType}
                      onChange={(e) => {
                        setPromoEnabled(Boolean(e.target.value));
                        setPromoType(e.target.value as PromoType);
                        setPromoConfig({});
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                    >
                      <option value="">No Promo</option>
                      <option value="add_funds_bonus">Add Funds Bonus</option>
                      <option value="first_add_funds_bonus">
                        First Add Funds Bonus
                      </option>
                      <option value="platform_discount">Platform Discount</option>
                      <option value="service_discount">
                        Specific Service Discount
                      </option>
                      <option value="category_discount">Category Discount</option>
                      <option value="bulk_quantity_discount">
                        Bulk Quantity Discount
                      </option>
                      <option value="minimum_spend_discount">
                        Minimum Spend Discount
                      </option>
                      <option value="new_user_first_order_discount">
                        New User First Order Discount
                      </option>
                      <option value="reseller_only_promo">Reseller-Only Promo</option>
                      <option value="promo_code">Promo Code</option>
                    </select>
                  </div>

                  {promoEnabled && promoType === "add_funds_bonus" && (
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <h4 className="font-black text-slate-950">Add Funds Bonus</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: customer adds ₱500, gets +10%, wallet credit becomes ₱550.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <InputBox
                          label="Minimum Add Funds Amount"
                          value={promoMinAmount}
                          onChange={setPromoMinAmount}
                          placeholder="500"
                        />
                        <InputBox
                          label="Bonus Percent"
                          value={promoBonusPercent}
                          onChange={setPromoBonusPercent}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "first_add_funds_bonus" && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <h4 className="font-black text-slate-950">
                        First Add Funds Bonus
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: user&apos;s first Add Funds is ₱500, gets +10%, wallet credit becomes ₱550.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <InputBox
                          label="Minimum First Add Funds Amount"
                          value={promoMinAmount}
                          onChange={setPromoMinAmount}
                          placeholder="500"
                        />
                        <InputBox
                          label="Bonus Percent"
                          value={promoBonusPercent}
                          onChange={setPromoBonusPercent}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "platform_discount" && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <h4 className="font-black text-slate-950">Platform Discount</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: 10% off on all Facebook services.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-black text-slate-700">
                            Platform
                          </label>
                          <select
                            value={promoPlatform}
                            onChange={(e) => setPromoPlatform(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                          >
                            {platformOptions.map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "service_discount" && (
                    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                      <h4 className="font-black text-slate-950">
                        Specific Service Discount
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: 5% off on Service ID 32.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <InputBox
                          label="Service ID"
                          value={promoServiceId}
                          onChange={setPromoServiceId}
                          placeholder="32"
                          type="text"
                        />
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "category_discount" && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                      <h4 className="font-black text-slate-950">
                        Category Discount
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: 10% off all TikTok Followers category services.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <InputBox
                          label="Category Name"
                          value={promoCategory}
                          onChange={setPromoCategory}
                          placeholder="TikTok Followers"
                          type="text"
                        />
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "bulk_quantity_discount" && (
                    <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                      <h4 className="font-black text-slate-950">
                        Bulk Quantity Discount
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: order 10,000+ quantity and get 5% off.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <InputBox
                          label="Minimum Quantity"
                          value={promoMinQuantity}
                          onChange={setPromoMinQuantity}
                          placeholder="10000"
                        />
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="5"
                        />
                        <div>
                          <label className="mb-2 block text-sm font-black text-slate-700">
                            Platform
                          </label>
                          <select
                            value={promoPlatform}
                            onChange={(e) => setPromoPlatform(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                          >
                            <option value="all">All Platforms</option>
                            {platformOptions.map((platform) => (
                              <option key={platform} value={platform}>
                                {platform}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "minimum_spend_discount" && (
                    <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4">
                      <h4 className="font-black text-slate-950">
                        Minimum Spend Discount
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: spend ₱500 on one order and get 5% off.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <InputBox
                          label="Minimum Order Price"
                          value={promoMinSpend}
                          onChange={setPromoMinSpend}
                          placeholder="500"
                        />
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled &&
                    promoType === "new_user_first_order_discount" && (
                      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                        <h4 className="font-black text-slate-950">
                          New User First Order Discount
                        </h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Example: new users get 10% discount on their first order only.
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <InputBox
                            label="Discount Percent"
                            value={promoDiscountPercent}
                            onChange={setPromoDiscountPercent}
                            placeholder="10"
                          />
                        </div>
                      </div>
                    )}

                  {promoEnabled && promoType === "reseller_only_promo" && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <h4 className="font-black text-slate-950">
                        Reseller-Only Promo
                      </h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: Power Resellers get extra 3% discount.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-black text-slate-700">
                            Required Reseller Level
                          </label>
                          <select
                            value={promoRequiredLevel}
                            onChange={(e) => setPromoRequiredLevel(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
                          >
                            {resellerLevels.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </div>
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="3"
                        />
                      </div>
                    </div>
                  )}

                  {promoEnabled && promoType === "promo_code" && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <h4 className="font-black text-slate-950">Promo Code</h4>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Example: ASCEND10 gives 10% off.
                      </p>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <InputBox
                          label="Promo Code"
                          value={promoCode}
                          onChange={setPromoCode}
                          placeholder="ASCEND10"
                          type="text"
                        />
                        <InputBox
                          label="Discount Percent"
                          value={promoDiscountPercent}
                          onChange={setPromoDiscountPercent}
                          placeholder="10"
                        />
                        <InputBox
                          label="Usage Limit"
                          value={promoUsageLimit}
                          onChange={setPromoUsageLimit}
                          placeholder="100"
                        />
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-green-200 bg-white px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-green-600">
                      Preview Output
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900">
                      {getPromoSummary(
                        promoEnabled,
                        promoType,
                        buildPromoConfig({
                          promoType,
                          promoMinAmount,
                          promoBonusPercent,
                          promoDiscountPercent,
                          promoPlatform,
                          promoCategory,
                          promoServiceId,
                          promoMinQuantity,
                          promoMinSpend,
                          promoRequiredLevel,
                          promoCode,
                          promoUsageLimit,
                        }),
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setPromoSettingsOpen(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={confirmPromoSettings}
                      className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white hover:bg-green-700"
                    >
                      Confirm Promo Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

function InputBox({
  label,
  value,
  onChange,
  placeholder,
  type = "number",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none"
      />
    </div>
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

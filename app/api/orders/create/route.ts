import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendEmail,
  orderPlacedEmail,
  adminAlertEmail,
} from "@/lib/email";

const USER_PROCESSING_ERROR =
  "We can't process your order right now. Please contact support or try again later.";

type JsonExtra = Record<string, unknown>;

type ProviderAddResult = {
  order?: string | number;
  error?: string;
  [key: string]: unknown;
};

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

type AnnouncementPromo = {
  id: string;
  title: string;
  status: string;
  promo_enabled?: boolean | null;
  promo_type?: PromoType | string | null;
  promo_config?: PromoConfig | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

type PromoResult = {
  applied: boolean;
  promoId: string | null;
  promoTitle: string | null;
  promoType: string | null;
  discountPercent: number;
  discountAmount: number;
  finalCharge: number;
  originalCharge: number;
};

function jsonResponse(
  success: boolean,
  message: string,
  status = 200,
  extra: JsonExtra = {},
) {
  return NextResponse.json(
    {
      success,
      message,
      ...extra,
    },
    { status },
  );
}

function getBearerToken(req: Request) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.replace("Bearer ", "").trim();
}

function cleanLink(value: unknown) {
  return String(value || "").trim();
}

function cleanQuantity(value: unknown) {
  const qty = Number(value);

  if (!Number.isFinite(qty)) return 0;

  return Math.floor(qty);
}

function cleanComments(value: unknown) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function cleanPromoCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function countCommentLines(comments: string) {
  if (!comments.trim()) return 0;

  return comments
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function isCustomCommentService(service: {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  type?: string | null;
}) {
  const text = `${service.name || ""} ${service.category || ""} ${
    service.description || ""
  } ${service.type || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasCommentWord =
    text.includes("comment") || text.includes("comments");

  const hasCustomWord =
    text.includes("custom") ||
    text.includes("comment package") ||
    text.includes("comments package");

  return hasCommentWord && hasCustomWord;
}

function normalizeConfig(config: unknown): PromoConfig {
  if (!config || typeof config !== "object") return {};
  return config as PromoConfig;
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function clampDiscountPercent(value: unknown) {
  const percent = toNumber(value);

  if (percent <= 0) return 0;
  if (percent > 100) return 100;

  return percent;
}

function roundMoney(value: number) {
  return Number(value.toFixed(6));
}

function serviceText(service: Record<string, unknown>) {
  return `${service.name || ""} ${service.category || ""} ${
    service.platform || ""
  } ${service.type || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesText(source: unknown, target: unknown) {
  const sourceText = String(source || "").toLowerCase().trim();
  const targetText = String(target || "").toLowerCase().trim();

  if (!sourceText || !targetText) return false;

  return sourceText === targetText || sourceText.includes(targetText);
}

function isPromoActiveNow(promo: AnnouncementPromo) {
  if (String(promo.status || "").toLowerCase() !== "published") return false;
  if (!promo.promo_enabled || !promo.promo_type) return false;

  const now = Date.now();

  if (promo.starts_at) {
    const startsAt = new Date(promo.starts_at).getTime();

    if (!Number.isNaN(startsAt) && now < startsAt) return false;
  }

  if (promo.ends_at) {
    const endsAt = new Date(promo.ends_at).getTime();

    if (!Number.isNaN(endsAt) && now > endsAt) return false;
  }

  return true;
}

function calculatePromoResult(
  originalCharge: number,
  discountPercent: number,
  promo: AnnouncementPromo,
): PromoResult {
  const safePercent = clampDiscountPercent(discountPercent);
  const discountAmount = roundMoney(originalCharge * (safePercent / 100));
  const finalCharge = Math.max(0, roundMoney(originalCharge - discountAmount));

  return {
    applied: safePercent > 0 && discountAmount > 0,
    promoId: promo.id,
    promoTitle: promo.title,
    promoType: String(promo.promo_type || ""),
    discountPercent: safePercent,
    discountAmount,
    finalCharge,
    originalCharge,
  };
}

async function userHasPreviousOrder(userId: string) {
  const { count, error } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    return true;
  }

  return Number(count || 0) > 0;
}

async function getBestOrderPromo({
  userId,
  profilePlan,
  service,
  qty,
  originalCharge,
  submittedPromoCode,
}: {
  userId: string;
  profilePlan: string;
  service: Record<string, unknown>;
  qty: number;
  originalCharge: number;
  submittedPromoCode: string;
}): Promise<PromoResult> {
  const noPromo: PromoResult = {
    applied: false,
    promoId: null,
    promoTitle: null,
    promoType: null,
    discountPercent: 0,
    discountAmount: 0,
    finalCharge: originalCharge,
    originalCharge,
  };

  const { data: promos, error } = await supabaseAdmin
    .from("announcements")
    .select("id, title, status, promo_enabled, promo_type, promo_config, starts_at, ends_at")
    .eq("promo_enabled", true)
    .eq("status", "published");

  if (error || !promos || promos.length <= 0) {
    return noPromo;
  }

  const activePromos = (promos as AnnouncementPromo[]).filter(isPromoActiveNow);

  if (activePromos.length <= 0) {
    return noPromo;
  }

  const previousOrderExistsCache: {
    loaded: boolean;
    value: boolean;
  } = {
    loaded: false,
    value: true,
  };

  async function hasPreviousOrderOnce() {
    if (!previousOrderExistsCache.loaded) {
      previousOrderExistsCache.value = await userHasPreviousOrder(userId);
      previousOrderExistsCache.loaded = true;
    }

    return previousOrderExistsCache.value;
  }

  const candidates: PromoResult[] = [];

  for (const promo of activePromos) {
    const promoType = String(promo.promo_type || "") as PromoType;
    const config = normalizeConfig(promo.promo_config);
    const discountPercent = clampDiscountPercent(config.discountPercent);

    if (!discountPercent) continue;

    if (promoType === "platform_discount") {
      const platform = String(config.platform || "").trim();

      if (!platform) continue;

      const platformMatches =
        matchesText(service.platform, platform) ||
        matchesText(service.category, platform) ||
        serviceText(service).includes(platform.toLowerCase());

      if (!platformMatches) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "service_discount") {
      const promoServiceId = String(config.serviceId || "").trim();

      if (!promoServiceId) continue;

      const serviceMatches =
        String(service.id || "") === promoServiceId ||
        String(service.provider_service_id || "") === promoServiceId;

      if (!serviceMatches) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "category_discount") {
      const category = String(config.category || "").trim();

      if (!category) continue;

      const categoryMatches =
        matchesText(service.category, category) ||
        serviceText(service).includes(category.toLowerCase());

      if (!categoryMatches) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "bulk_quantity_discount") {
      const minQuantity = toNumber(config.minQuantity);
      const platform = String(config.platform || "all").trim();

      if (minQuantity <= 0 || qty < minQuantity) continue;

      const platformMatches =
        !platform ||
        platform.toLowerCase() === "all" ||
        matchesText(service.platform, platform) ||
        matchesText(service.category, platform) ||
        serviceText(service).includes(platform.toLowerCase());

      if (!platformMatches) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "minimum_spend_discount") {
      const minSpend = toNumber(config.minSpend);

      if (minSpend <= 0 || originalCharge < minSpend) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "new_user_first_order_discount") {
      const hasPreviousOrder = await hasPreviousOrderOnce();

      if (hasPreviousOrder) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "reseller_only_promo") {
      const requiredLevel = String(config.requiredLevel || "").trim();

      if (!requiredLevel) continue;

      const levelMatches =
        matchesText(profilePlan, requiredLevel) ||
        profilePlan.toLowerCase().includes("reseller");

      if (!levelMatches) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }

    if (promoType === "promo_code") {
      const code = String(config.code || "")
        .trim()
        .toUpperCase();

      if (!code || !submittedPromoCode || code !== submittedPromoCode) continue;

      candidates.push(calculatePromoResult(originalCharge, discountPercent, promo));
      continue;
    }
  }

  if (candidates.length <= 0) {
    return noPromo;
  }

  candidates.sort((a, b) => {
    if (b.discountAmount !== a.discountAmount) {
      return b.discountAmount - a.discountAmount;
    }

    return b.discountPercent - a.discountPercent;
  });

  return candidates[0];
}

export async function POST(req: Request) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return jsonResponse(false, "Unauthorized request.", 401);
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(false, "Invalid session.", 401);
    }

    const body = await req.json();

    const serviceId = String(body.serviceId || "").trim();
    const link = cleanLink(body.link);
    const comments = cleanComments(body.comments);
    const requestedQty = cleanQuantity(body.quantity);
    const submittedPromoCode = cleanPromoCode(body.promoCode || body.promo_code);

    if (!serviceId || !link) {
      return jsonResponse(false, "Missing order details.", 400);
    }

    if (link.length > 1000) {
      return jsonResponse(false, "Link is too long.", 400);
    }

    const { data: service, error: serviceError } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (serviceError || !service) {
      return jsonResponse(false, "Service not found.", 404);
    }

    if (String(service.status || "active").toLowerCase() !== "active") {
      return jsonResponse(false, "This service is currently unavailable.", 400);
    }

    const customComments = isCustomCommentService(service);
    const commentQty = countCommentLines(comments);
    const qty = customComments ? commentQty : requestedQty;

    if (customComments && !comments) {
      return jsonResponse(false, "Please enter comments, one per line.", 400);
    }

    if (!customComments && qty <= 0) {
      return jsonResponse(false, "Missing or invalid quantity.", 400);
    }

    const minQuantity = Number(service.min_quantity || 0);
    const maxQuantity = Number(service.max_quantity || 0);

    if (qty < minQuantity || qty > maxQuantity) {
      return jsonResponse(
        false,
        `Quantity must be between ${minQuantity} and ${maxQuantity}.`,
        400,
      );
    }

    const pricePer1000 = Number(service.price_per_1000 || 0);
    const originalCharge = roundMoney((qty / 1000) * pricePer1000);

    if (!Number.isFinite(originalCharge) || originalCharge <= 0) {
      return jsonResponse(false, "Invalid service price.", 400);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, balance, plan")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(false, "User profile not found.", 404);
    }

    const promoResult = await getBestOrderPromo({
      userId: user.id,
      profilePlan: String(profile.plan || ""),
      service: service as Record<string, unknown>,
      qty,
      originalCharge,
      submittedPromoCode,
    });

    const charge = promoResult.finalCharge;
    const balance = Number(profile.balance || 0);

    if (balance < charge) {
      return jsonResponse(false, "Insufficient wallet balance.", 400, {
        original_charge: originalCharge,
        discount_amount: promoResult.discountAmount,
        final_charge: charge,
        promo_applied: promoResult.applied,
        promo_title: promoResult.promoTitle,
      });
    }

    let providerOrderId: string | null = null;
    let providerResponseData: ProviderAddResult | null = null;
    let providerStatus = "pending";
    let orderStatus = "pending";

    if (service.auto_order) {
      if (!service.provider_id || !service.provider_service_id) {
        await supabaseAdmin.from("notifications").insert({
          user_id: null,
          title: "Auto Order Blocked",
          message: `${service.name} has auto order enabled but provider mapping is missing.`,
          type: "provider_error",
          is_read: false,
        });

        return jsonResponse(false, USER_PROCESSING_ERROR, 400);
      }

      const { data: provider, error: providerError } = await supabaseAdmin
        .from("providers")
        .select("*")
        .eq("id", service.provider_id)
        .single();

      if (
        providerError ||
        !provider ||
        provider.status !== "active" ||
        provider.mode !== "auto"
      ) {
        await supabaseAdmin.from("notifications").insert({
          user_id: null,
          title: "Auto Order Blocked",
          message: `${service.name} could not be processed because the provider is inactive or not in auto mode.`,
          type: "provider_error",
          is_read: false,
        });

        return jsonResponse(false, USER_PROCESSING_ERROR, 400);
      }

      if (Number(provider.balance || 0) <= 0) {
        await supabaseAdmin.from("notifications").insert({
          user_id: null,
          title: "Provider Balance Empty",
          message: `${provider.name} has $0 balance. Auto order was blocked before charging the user.`,
          type: "provider_low_balance",
          is_read: false,
        });

        return jsonResponse(false, USER_PROCESSING_ERROR, 400);
      }

      const formData = new FormData();
      formData.append("key", provider.api_key);
      formData.append("action", "add");
      formData.append("service", String(service.provider_service_id));
      formData.append("link", link);

      if (customComments) {
        formData.append("quantity", String(qty));
        formData.append("comments", comments);
      } else {
        formData.append("quantity", String(qty));
      }

      const providerResponse = await fetch(provider.api_url, {
        method: "POST",
        body: formData,
      });

      let providerResult: ProviderAddResult = {};

      try {
        providerResult = (await providerResponse.json()) as ProviderAddResult;
      } catch {
        providerResult = {
          error: "Invalid provider response.",
        };
      }

      providerResponseData = providerResult;

      if (
        !providerResponse.ok ||
        providerResult.error ||
        !providerResult.order
      ) {
        await supabaseAdmin.from("notifications").insert({
          user_id: null,
          title: "Provider Auto Order Failed",
          message: `${provider.name}: ${
            providerResult.error || "Unknown provider error"
          }. User was not charged.`,
          type: "provider_error",
          is_read: false,
        });

        return jsonResponse(false, USER_PROCESSING_ERROR, 400);
      }

      providerOrderId = String(providerResult.order);
      providerStatus = "submitted";
      orderStatus = "processing";
    }

    const newBalance = roundMoney(balance - charge);

    const { data: updatedProfile, error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
      })
      .eq("id", user.id)
      .eq("balance", balance)
      .select("id, balance")
      .single();

    if (balanceError || !updatedProfile) {
      return jsonResponse(
        false,
        "Your balance changed while placing the order. Please try again.",
        409,
      );
    }

    const { data: createdOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        service_id: service.id,
        service_name: service.name,
        link,
        quantity: qty,
        price: charge,
        start_count: 0,
        current_count: 0,
        provider_order_id: providerOrderId,
        provider_name: service.provider_name,
        provider_response: providerResponseData,
        provider_status: providerStatus,
        synced_at: providerOrderId ? new Date().toISOString() : null,
        status: orderStatus,
      })
      .select()
      .single();

    if (orderError) {
      await supabaseAdmin
        .from("profiles")
        .update({
          balance,
        })
        .eq("id", user.id);

      return jsonResponse(false, orderError.message, 500);
    }

    const promoMessage = promoResult.applied
      ? ` Promo applied: ${promoResult.promoTitle} (-₱${promoResult.discountAmount.toFixed(
          2,
        )}). Original: ₱${originalCharge.toFixed(2)}. Final: ₱${charge.toFixed(2)}.`
      : "";

    await supabaseAdmin.from("notifications").insert([
      {
        user_id: user.id,
        title: "Order Created",
        message: `Your order for ${service.name} was placed successfully.${promoMessage}`,
        type: "order_created",
        is_read: false,
      },
      {
        user_id: null,
        title: "New Order",
        message: `New order placed: ${service.name} | Quantity: ${qty} | Charge: ₱${charge.toFixed(
          2,
        )}${promoResult.applied ? ` | Promo: ${promoResult.promoTitle}` : ""}`,
        type: "new_order",
        is_read: false,
      },
    ]);

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Order Placed Successfully",
        html: orderPlacedEmail({
          serviceName: service.name,
          quantity: qty,
          charge,
          status: orderStatus,
        }),
      });
    }

    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "New Order Received",
        html: adminAlertEmail({
          title: "New Order",
          message: "A new order has been placed on Ascend Service.",
          details: `
            <p><strong>User:</strong> ${profile.username || user.id}</p>
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Quantity:</strong> ${qty}</p>
            <p><strong>Original Charge:</strong> ₱${originalCharge.toFixed(2)}</p>
            ${
              promoResult.applied
                ? `
                  <p><strong>Promo:</strong> ${promoResult.promoTitle}</p>
                  <p><strong>Discount:</strong> ${promoResult.discountPercent}% / ₱${promoResult.discountAmount.toFixed(2)}</p>
                `
                : ""
            }
            <p><strong>Final Charge:</strong> ₱${charge.toFixed(2)}</p>
            <p><strong>Status:</strong> ${orderStatus}</p>
            ${
              providerOrderId
                ? `<p><strong>Provider Order ID:</strong> ${providerOrderId}</p>`
                : ""
            }
          `,
        }),
      });
    }

    return jsonResponse(
      true,
      orderStatus === "processing"
        ? "Order placed successfully. Your order is now processing."
        : "Order placed successfully.",
      200,
      {
        order: createdOrder,
        provider_order_id: providerOrderId,
        status: orderStatus,
        balance: newBalance,
        promo: {
          applied: promoResult.applied,
          promo_id: promoResult.promoId,
          promo_title: promoResult.promoTitle,
          promo_type: promoResult.promoType,
          discount_percent: promoResult.discountPercent,
          discount_amount: promoResult.discountAmount,
          original_charge: originalCharge,
          final_charge: charge,
        },
      },
    );
  } catch (error) {
    console.error("CREATE_ORDER_ROUTE_ERROR:", error);

    return jsonResponse(false, USER_PROCESSING_ERROR, 500);
  }
}

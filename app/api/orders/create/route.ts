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
}) {
  const text = `${service.name || ""} ${service.category || ""} ${
    service.description || ""
  }`
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ");

  return (
    text.includes("comments custom") ||
    text.includes("comment custom") ||
    text.includes("custom comments") ||
    text.includes("custom comment") ||
    text.includes("custom comment package") ||
    text.includes("custom comments package")
  );
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
    const charge = Number(((qty / 1000) * pricePer1000).toFixed(6));

    if (!Number.isFinite(charge) || charge <= 0) {
      return jsonResponse(false, "Invalid service price.", 400);
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, username, balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse(false, "User profile not found.", 404);
    }

    const balance = Number(profile.balance || 0);

    if (balance < charge) {
      return jsonResponse(false, "Insufficient wallet balance.", 400);
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

    const newBalance = Number((balance - charge).toFixed(6));

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

    await supabaseAdmin.from("notifications").insert([
      {
        user_id: user.id,
        title: "Order Created",
        message: `Your order for ${service.name} was placed successfully.`,
        type: "order_created",
        is_read: false,
      },
      {
        user_id: null,
        title: "New Order",
        message: `New order placed: ${service.name} | Quantity: ${qty} | Charge: ₱${charge.toFixed(
          2,
        )}`,
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
            <p><strong>Charge:</strong> ₱${charge.toFixed(2)}</p>
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
      },
    );
  } catch (error) {
    console.error("CREATE_ORDER_ROUTE_ERROR:", error);

    return jsonResponse(false, USER_PROCESSING_ERROR, 500);
  }
}

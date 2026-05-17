import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type ApiProfile = {
  id: string;
  balance: number | string | null;
  api_key: string | null;
  role?: string | null;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

async function getApiUser(apiKey: string | null) {
  if (!apiKey) {
    return {
      error: json(
        {
          success: false,
          error: "Missing API key.",
        },
        401,
      ),
      profile: null,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, balance, api_key, role")
    .eq("api_key", apiKey)
    .single();

  if (error || !data) {
    return {
      error: json(
        {
          success: false,
          error: "Invalid API key.",
        },
        401,
      ),
      profile: null,
    };
  }

  return {
    error: null,
    profile: data as ApiProfile,
  };
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));

    return {
      key: String(body.key || ""),
      action: String(body.action || "").toLowerCase(),
      service: body.service ? String(body.service) : "",
      link: body.link ? String(body.link) : "",
      quantity: body.quantity ? String(body.quantity) : "",
      order: body.order ? String(body.order) : "",
    };
  }

  const formData = await request.formData();

  return {
    key: String(formData.get("key") || ""),
    action: String(formData.get("action") || "").toLowerCase(),
    service: String(formData.get("service") || ""),
    link: String(formData.get("link") || ""),
    quantity: String(formData.get("quantity") || ""),
    order: String(formData.get("order") || ""),
  };
}

export async function GET() {
  return json(
    {
      success: false,
      error: "API only accepts POST requests.",
      endpoint: "/api/v2",
      actions: ["services", "balance", "status", "add"],
    },
    405,
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody(request);
    const { key, action } = body;

    if (!action) {
      return json(
        {
          success: false,
          error: "Missing action.",
        },
        400,
      );
    }

    const { error, profile } = await getApiUser(key);

    if (error || !profile) {
      return error;
    }

    if (action === "balance") {
      return json({
        success: true,
        balance: toNumber(profile.balance).toFixed(2),
        currency: "PHP",
      });
    }

    if (action === "services") {
      const { data: services, error: servicesError } = await supabaseAdmin
        .from("services")
        .select("*")
        .order("id", { ascending: true });

      if (servicesError) {
        console.error("API_SERVICES_ERROR:", servicesError.message);

        return json(
          {
            success: false,
            error: servicesError.message,
          },
          500,
        );
      }

      const activeServices = (services || []).filter((service: any) => {
        if ("is_active" in service) {
          return service.is_active === true;
        }

        if ("status" in service) {
          const status = String(service.status || "").toLowerCase();
          return status === "active" || status === "enabled";
        }

        return true;
      });

      const formattedServices = activeServices.map((service: any) => ({
        service:
          service.public_id ||
          service.service_id ||
          service.provider_service_id ||
          service.id,
        name: service.name || service.service_name || service.title || "Service",
        category:
          service.category ||
          service.category_name ||
          service.platform ||
          "General",
        rate: toNumber(
          service.price_per_1000 ||
            service.rate ||
            service.price ||
            service.final_price ||
            service.sell_price ||
            service.panel_price ||
            0,
        ),
        min: toNumber(
          service.min ||
            service.min_order ||
            service.minimum ||
            service.min_quantity ||
            0,
        ),
        max: toNumber(
          service.max ||
            service.max_order ||
            service.maximum ||
            service.max_quantity ||
            0,
        ),
        refill: Boolean(service.refill || service.refill_enabled),
        cancel: Boolean(service.cancel || service.cancel_enabled),
      }));

      return json(formattedServices);
    }

    if (action === "status") {
  const orderId = body.order;

  if (!orderId) {
    return json(
      {
        success: false,
        error: "Missing order parameter.",
      },
      400,
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("user_id", profile.id)
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    console.error("API_STATUS_ERROR:", orderError.message);

    return json(
      {
        success: false,
        error: orderError.message,
      },
      500,
    );
  }

  if (!order) {
    return json(
      {
        success: false,
        error: "Order not found.",
      },
      404,
    );
  }

  return json({
    success: true,
    order: order.id,
    status: order.status || "processing",
    charge: toNumber(order.price).toFixed(2),
    start_count: order.start_count || 0,
    current_count: order.current_count || 0,
    provider_order_id: order.provider_order_id || null,
  });
}

    if (action === "add") {
      const serviceParam = body.service;
      const link = body.link;
      const qty = Number(body.quantity || 0);

      if (!serviceParam || !link || !qty) {
        return json(
          {
            success: false,
            error:
              "Missing required parameters. Required: service, link, quantity.",
          },
          400,
        );
      }

      const { data: allServices, error: serviceLoadError } = await supabaseAdmin
        .from("services")
        .select("*");

      if (serviceLoadError) {
        console.error("API_ADD_SERVICE_LOAD_ERROR:", serviceLoadError.message);

        return json(
          {
            success: false,
            error: "Unable to load services.",
          },
          500,
        );
      }

      const service = (allServices || []).find((item: any) => {
        return (
          String(item.id) === String(serviceParam) ||
          String(item.public_id) === String(serviceParam) ||
          String(item.service_id) === String(serviceParam) ||
          String(item.provider_service_id) === String(serviceParam)
        );
      });

      if (!service) {
        return json(
          {
            success: false,
            error: "Service not found.",
          },
          404,
        );
      }

      const isServiceActive =
        "is_active" in service
          ? service.is_active === true
          : "status" in service
            ? ["active", "enabled"].includes(
                String(service.status || "").toLowerCase(),
              )
            : true;

      if (!isServiceActive) {
        return json(
          {
            success: false,
            error: "Service is not active.",
          },
          400,
        );
      }

      const minQuantity = toNumber(
        service.min_quantity ||
          service.min ||
          service.min_order ||
          service.minimum ||
          0,
      );

      const maxQuantity = toNumber(
        service.max_quantity ||
          service.max ||
          service.max_order ||
          service.maximum ||
          0,
      );

      if (minQuantity > 0 && qty < minQuantity) {
        return json(
          {
            success: false,
            error: `Quantity must be at least ${minQuantity}.`,
          },
          400,
        );
      }

      if (maxQuantity > 0 && qty > maxQuantity) {
        return json(
          {
            success: false,
            error: `Quantity must be no more than ${maxQuantity}.`,
          },
          400,
        );
      }

      const pricePer1000 = toNumber(
        service.price_per_1000 ||
          service.rate ||
          service.price ||
          service.final_price ||
          service.sell_price ||
          service.panel_price ||
          0,
      );

      const orderPrice = (qty / 1000) * pricePer1000;
      const currentBalance = toNumber(profile.balance);

      if (orderPrice <= 0) {
        return json(
          {
            success: false,
            error: "Invalid service price.",
          },
          400,
        );
      }

      if (currentBalance < orderPrice) {
        return json(
          {
            success: false,
            error: "Insufficient wallet balance.",
          },
          400,
        );
      }

      let providerOrderId: string | null = null;
      let providerResponseData: any = null;
      let providerStatus = "pending";
      let orderStatus = "pending";

      if (service.auto_order) {
        if (!service.provider_id || !service.provider_service_id) {
          await supabaseAdmin.from("notifications").insert({
            user_id: null,
            title: "API Auto Order Blocked",
            message: `${
              service.name || service.service_name || "Service"
            } has auto order enabled but provider mapping is missing.`,
            type: "provider_error",
            is_read: false,
          });

          return json(
            {
              success: false,
              error:
                "We can't process your order right now. Please contact support or try again later.",
            },
            400,
          );
        }

        const { data: provider } = await supabaseAdmin
          .from("providers")
          .select("*")
          .eq("id", service.provider_id)
          .single();

        if (!provider || provider.status !== "active" || provider.mode !== "auto") {
          await supabaseAdmin.from("notifications").insert({
            user_id: null,
            title: "API Auto Order Blocked",
            message: `${
              service.name || service.service_name || "Service"
            } could not be processed because the provider is inactive or not in auto mode.`,
            type: "provider_error",
            is_read: false,
          });

          return json(
            {
              success: false,
              error:
                "We can't process your order right now. Please contact support or try again later.",
            },
            400,
          );
        }

        if (toNumber(provider.balance) <= 0) {
          await supabaseAdmin.from("notifications").insert({
            user_id: null,
            title: "Provider Balance Empty",
            message: `${provider.name} has $0 balance. API auto order was blocked before charging the user.`,
            type: "provider_low_balance",
            is_read: false,
          });

          return json(
            {
              success: false,
              error:
                "We can't process your order right now. Please contact support or try again later.",
            },
            400,
          );
        }

        const formData = new FormData();
        formData.append("key", provider.api_key);
        formData.append("action", "add");
        formData.append("service", String(service.provider_service_id));
        formData.append("link", link);
        formData.append("quantity", String(qty));

        const providerResponse = await fetch(provider.api_url, {
          method: "POST",
          body: formData,
        });

        const providerResult = await providerResponse.json();
        providerResponseData = providerResult;

        console.log("API_PROVIDER_RESULT:", providerResult);

        if (!providerResponse.ok || providerResult.error || !providerResult.order) {
          await supabaseAdmin.from("notifications").insert({
            user_id: null,
            title: "Provider API Order Failed",
            message: `${provider.name}: ${
              providerResult.error || "Unknown provider error"
            }. User was not charged.`,
            type: "provider_error",
            is_read: false,
          });

return json(
  {
    success: false,
    error: providerResult.error || "Unknown provider error",
    provider_response: providerResult,
    provider_status: providerResponse.status,
    provider_service_id: service.provider_service_id,
    local_service_id: service.id,
  },
  400,
);
        }

        providerOrderId = String(providerResult.order);
        providerStatus = "submitted";
        orderStatus = "processing";
      }

      const newBalance = currentBalance - orderPrice;

      const { error: balanceError } = await supabaseAdmin
        .from("profiles")
        .update({
          balance: newBalance,
        })
        .eq("id", profile.id);

      if (balanceError) {
        console.error("API_ADD_BALANCE_ERROR:", balanceError.message);

        return json(
          {
            success: false,
            error: "Unable to update wallet balance.",
          },
          500,
        );
      }

      const { data: createdOrder, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: profile.id,
          service_id: service.id,
          service_name: service.name || service.service_name || service.title,
          link,
          quantity: qty,
          price: orderPrice,
          start_count: 0,
          current_count: 0,
          provider_order_id: providerOrderId,
          provider_name: service.provider_name,
          provider_response: providerResponseData,
          provider_status: providerStatus,
          synced_at: providerOrderId ? new Date().toISOString() : null,
          status: orderStatus,
          order_source: "api",
        })
        .select()
        .single();

      if (orderError) {
        await supabaseAdmin
          .from("profiles")
          .update({
            balance: currentBalance,
          })
          .eq("id", profile.id);

        console.error("API_ADD_ORDER_ERROR:", orderError.message);

        return json(
          {
            success: false,
            error: orderError.message,
          },
          500,
        );
      }

      await supabaseAdmin.from("notifications").insert([
        {
          user_id: profile.id,
          title: "API Order Created",
          message: `Your API order for ${
            service.name || service.service_name || "Service"
          } was placed successfully.`,
          type: "order_created",
          is_read: false,
        },
        {
          user_id: null,
          title: "New API Order",
          message: `New API order placed: ${
            service.name || service.service_name || "Service"
          } | Quantity: ${qty} | Charge: ₱${orderPrice.toFixed(2)}`,
          type: "new_order",
          is_read: false,
        },
      ]);

      return json({
        success: true,
        order: createdOrder.public_id || createdOrder.order_id || createdOrder.id,
        charge: orderPrice.toFixed(2),
        balance: newBalance.toFixed(2),
        status: orderStatus,
        provider_order_id: providerOrderId,
        message:
          orderStatus === "processing"
            ? "Order placed successfully. Your order is now processing."
            : "Order placed successfully.",
      });
    }

    return json(
      {
        success: false,
        error: "Invalid action.",
        allowed_actions: ["services", "balance", "status", "add"],
      },
      400,
    );
  } catch (error: any) {
    console.error("API_V2_ERROR:", error?.message || error);

    return json(
      {
        success: false,
        error: "Server error.",
      },
      500,
    );
  }
}
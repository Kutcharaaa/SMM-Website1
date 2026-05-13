import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { userId, serviceId, link, quantity } = await req.json();

    if (!userId || !serviceId || !link || !quantity) {
      return NextResponse.json({
        success: false,
        message: "Missing order details.",
      });
    }

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", serviceId)
      .single();

    if (!service) {
      return NextResponse.json({
        success: false,
        message: "Service not found.",
      });
    }

    const qty = Number(quantity);

    if (qty < service.min_quantity || qty > service.max_quantity) {
      return NextResponse.json({
        success: false,
        message: `Quantity must be between ${service.min_quantity} and ${service.max_quantity}.`,
      });
    }

    const charge =
      (qty / 1000) * Number(service.price_per_1000 || 0);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "User profile not found.",
      });
    }

    const balance = Number(profile.balance || 0);

    if (balance < charge) {
      return NextResponse.json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const newBalance = balance - charge;

    const { error: balanceError } = await supabaseAdmin
      .from("profiles")
      .update({
        balance: newBalance,
      })
      .eq("id", userId);

    if (balanceError) {
      return NextResponse.json({
        success: false,
        message: balanceError.message,
      });
    }

    let providerOrderId = null;
    let orderStatus = "pending";

    if (
      service.mode === "auto" &&
      service.provider_name &&
      service.provider_service_id
    ) {
      const { data: provider } = await supabaseAdmin
        .from("providers")
        .select("*")
        .eq("name", service.provider_name)
        .single();

      if (
        provider &&
        provider.status === "active" &&
        Number(provider.balance || 0) > 0
      ) {
        try {
          const formData = new FormData();

          formData.append("key", provider.api_key);
          formData.append("action", "add");
          formData.append(
            "service",
            String(service.provider_service_id)
          );
          formData.append("link", link);
          formData.append("quantity", String(qty));

          const providerResponse = await fetch(provider.api_url, {
            method: "POST",
            body: formData,
          });

          const providerResult = await providerResponse.json();

          if (
            providerResponse.ok &&
            providerResult.order
          ) {
            providerOrderId = String(providerResult.order);
            orderStatus = "processing";
          }
        } catch (error) {
          console.error("AUTO_ORDER_ERROR:", error);
        }
      }
    }

    const { data: createdOrder, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .insert({
          user_id: userId,
          service_id: service.id,
          service_name: service.name,
          link,
          quantity: qty,
          price: charge,
          start_count: 0,
          current_count: 0,
          provider_order_id: providerOrderId,
          provider_name: service.provider_name,
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
        .eq("id", userId);

      return NextResponse.json({
        success: false,
        message: orderError.message,
      });
    }

    await supabaseAdmin.from("notifications").insert([
      {
        user_id: userId,
        title: "Order Created",
        message: `Your order for ${service.name} was placed successfully.`,
        type: "order_created",
        is_read: false,
      },
      {
        user_id: null,
        title: "New Order",
        message: `A new order was placed for ${service.name}.`,
        type: "new_order",
        is_read: false,
      },
    ]);

    if (profile.email) {
      await sendEmail({
        to: profile.email,
        subject: "Order Placed Successfully",
        html: baseEmailTemplate({
          title: "Order Confirmed",
          message:
            "Your order was placed successfully and is now being processed.",
          details: `
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Quantity:</strong> ${qty}</p>
            <p><strong>Charge:</strong> ₱${charge.toFixed(2)}</p>
            <p><strong>Status:</strong> ${orderStatus}</p>
          `,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message:
        orderStatus === "processing"
          ? "Order placed successfully. Your order is now processing."
          : "Order placed successfully.",
      order: createdOrder,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to create order.",
    });
  }
}
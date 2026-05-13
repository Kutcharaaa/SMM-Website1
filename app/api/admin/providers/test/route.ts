import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { providerId } = await req.json();

    if (!providerId) {
      return NextResponse.json({
        success: false,
        message: "Provider ID is required.",
      });
    }

    const { data: provider, error } = await supabaseAdmin
      .from("providers")
      .select("*")
      .eq("id", providerId)
      .single();

    if (error || !provider) {
      return NextResponse.json({
        success: false,
        message: "Provider not found.",
      });
    }

    const formData = new FormData();
    formData.append("key", provider.api_key);
    formData.append("action", "balance");

    const response = await fetch(provider.api_url, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return NextResponse.json({
        success: false,
        message: result.error || "Provider API test failed.",
      });
    }

    const balance = Number(result.balance || 0);
    const threshold = Number(provider.low_balance_threshold || 0);
    const autoDisableEnabled = Boolean(provider.auto_disable_low_balance);

    let nextStatus = "active";
    let lowBalanceTriggered = false;

    if (autoDisableEnabled && threshold > 0 && balance <= threshold) {
      nextStatus = "inactive";
      lowBalanceTriggered = true;
    }

    await supabaseAdmin
      .from("providers")
      .update({
        balance,
        status: nextStatus,
      })
      .eq("id", provider.id);

    if (lowBalanceTriggered) {
      const now = new Date();
      const lastNotifiedAt = provider.last_low_balance_notification_at
        ? new Date(provider.last_low_balance_notification_at)
        : null;

      const shouldNotify =
        !lastNotifiedAt ||
        now.getTime() - lastNotifiedAt.getTime() >= 30 * 60 * 1000;

      if (shouldNotify) {
        await supabaseAdmin.from("notifications").insert({
          title: "Provider Low Balance",
          message: `${provider.name} was automatically disabled because its balance is $${balance.toFixed(
            2
          )}, which is below the threshold of $${threshold.toFixed(2)}.`,
          type: "provider_low_balance",
          is_read: false,
        });

        await supabaseAdmin
          .from("providers")
          .update({
            last_low_balance_notification_at: now.toISOString(),
          })
          .eq("id", provider.id);
      }

      return NextResponse.json({
        success: true,
        message: `${provider.name} connected, but balance is low. Provider was automatically disabled.`,
        balance,
        currency: result.currency || "USD",
        status: "inactive",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Provider connected successfully.",
      balance,
      currency: result.currency || "USD",
      status: "active",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Unable to connect to provider API.",
    });
  }
}
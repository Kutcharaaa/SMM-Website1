import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("authorization");

    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const { data: providers } = await supabaseAdmin
      .from("providers")
      .select("*");

    if (!providers || providers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No providers found.",
      });
    }

    let synced = 0;

    for (const provider of providers) {
      const formData = new FormData();
      formData.append("key", provider.api_key);
      formData.append("action", "balance");

      const response = await fetch(provider.api_url, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || result.error) continue;

      const balance = Number(result.balance || 0);
      const threshold = Number(provider.low_balance_threshold || 0);
      const autoDisable = Boolean(provider.auto_disable_low_balance);

      let nextStatus = provider.status;

      if (autoDisable && threshold > 0 && balance <= threshold) {
        nextStatus = "inactive";

        const now = new Date();
        const lastNotifiedAt = provider.last_low_balance_notification_at
          ? new Date(provider.last_low_balance_notification_at)
          : null;

        const shouldNotify =
          !lastNotifiedAt ||
          now.getTime() - lastNotifiedAt.getTime() >= 30 * 60 * 1000;

        if (shouldNotify) {
          await supabaseAdmin.from("notifications").insert({
            user_id: null,
            title: "Provider Low Balance",
            message: `${provider.name} was automatically disabled because balance is $${balance.toFixed(
              2
            )}.`,
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
      }

      await supabaseAdmin
        .from("providers")
        .update({
          balance,
          status: nextStatus,
        })
        .eq("id", provider.id);

      synced++;
    }

    return NextResponse.json({
      success: true,
      message: `${synced} provider balances synced.`,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to sync provider balances.",
    });
  }
}
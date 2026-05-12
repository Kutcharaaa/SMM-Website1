import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { providerId, services, markupPercent } = await req.json();

    if (!providerId) {
      return NextResponse.json({
        success: false,
        message: "Provider ID is required.",
      });
    }

    if (!services || services.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No services selected.",
      });
    }

    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("id, name")
      .eq("id", providerId)
      .single();

    if (!provider) {
      return NextResponse.json({
        success: false,
        message: "Provider not found.",
      });
    }

    const { data: usdRate, error: rateError } = await supabaseAdmin
      .from("exchange_rates")
      .select("market_rate")
      .eq("currency_code", "USD")
      .single();

    if (rateError || !usdRate) {
      return NextResponse.json({
        success: false,
        message: "USD market rate not found. Please sync currencies first.",
      });
    }

    const usdToPhpMarketRate = Number(usdRate.market_rate || 0);

    if (usdToPhpMarketRate <= 0) {
      return NextResponse.json({
        success: false,
        message: "Invalid USD market rate.",
      });
    }

    const markup = Number(markupPercent || 0);

    const rows = services.map((service: any) => {
      const providerUsdPrice = Number(service.price || 0);
      const phpCost = providerUsdPrice * usdToPhpMarketRate;
      const finalPhpPrice = phpCost + phpCost * (markup / 100);

      return {
        name: service.name,
        category: service.category || "Uncategorized",
        description: service.name,
        price_per_1000: Number(finalPhpPrice.toFixed(4)),
        min_quantity: Number(service.min || 0),
        max_quantity: Number(service.max || 0),
        provider_service_id: String(service.provider_service_id),
        provider_id: provider.id,
        provider_name: provider.name,
        auto_order: true,
        status: "active",
      };
    });

    const { error } = await supabaseAdmin.from("services").insert(rows);

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${rows.length} services imported successfully using USD market rate ₱${usdToPhpMarketRate} with ${markup}% markup.`,
      imported: rows.length,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to bulk import services.",
    });
  }
}
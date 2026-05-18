import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type ExchangeApiResponse = {
  result: string;
  rates: Record<string, number>;
};

async function syncExchangeRates() {
  const rateResponse = await fetch("https://open.er-api.com/v6/latest/USD", {
    cache: "no-store",
  });

  const rateData: ExchangeApiResponse = await rateResponse.json();

  if (rateData.result !== "success") {
    return NextResponse.json(
      { success: false, message: "Failed to fetch live exchange rates." },
      { status: 500 }
    );
  }

  const phpPerUsd = Number(rateData.rates.PHP || 0);

  if (!phpPerUsd) {
    return NextResponse.json(
      { success: false, message: "PHP rate not found from exchange API." },
      { status: 500 }
    );
  }

  const { data: marginSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "margin_percent")
    .single();

  const marginPercent = Number(marginSetting?.value || 0);

  const { data: currencies, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("is_enabled", true);

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  for (const currency of currencies || []) {
    const code = String(currency.currency_code || "").toUpperCase();

    let marketRate = 1;

    if (code === "PHP") {
      marketRate = 1;
    } else if (code === "USD" || code === "USDT") {
      marketRate = phpPerUsd;
    } else {
      const currencyPerUsd = Number(rateData.rates[code] || 0);

      marketRate = currencyPerUsd
        ? phpPerUsd / currencyPerUsd
        : Number(currency.market_rate || 1);
    }

    const panelRate =
      code === "PHP" ? 1 : marketRate - marketRate * (marginPercent / 100);

    await supabase
      .from("exchange_rates")
      .update({
        market_rate: marketRate,
        panel_rate: panelRate,
        rate_to_php: panelRate,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", currency.id);
  }

  return NextResponse.json({
    success: true,
    marginPercent,
    usdPhpMarketRate: phpPerUsd,
    message: "Live exchange rates synced successfully.",
  });
}

export async function GET() {
  return syncExchangeRates();
}

export async function POST() {
  return syncExchangeRates();
}
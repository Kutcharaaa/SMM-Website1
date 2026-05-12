import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type ExchangeApiResponse = {
  result: string;
  rates: Record<string, number>;
};

export async function GET() {
  const rateResponse = await fetch("https://open.er-api.com/v6/latest/PHP", {
    cache: "no-store",
  });

  const rateData: ExchangeApiResponse = await rateResponse.json();

  if (rateData.result !== "success") {
    return NextResponse.json(
      { error: "Failed to fetch live exchange rates." },
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const currency of currencies || []) {
    const code = currency.currency_code;

    let marketRate = 1;

    if (code === "PHP") {
      marketRate = 1;
    } else if (code === "USDT") {
      const usdRate = rateData.rates["USD"];
      marketRate = usdRate ? 1 / usdRate : Number(currency.market_rate || 1);
    } else {
      const apiRate = rateData.rates[code];
      marketRate = apiRate ? 1 / apiRate : Number(currency.market_rate || 1);
    }

    const panelRate =
      code === "PHP"
        ? 1
        : marketRate - marketRate * (marginPercent / 100);

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
    message: "Live exchange rates synced.",
  });
}
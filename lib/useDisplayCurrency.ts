"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

type ExchangeRate = {
  currency_code: string;
  currency_name?: string | null;
  rate_to_php?: number | string | null;
  market_rate?: number | string | null;
  panel_rate?: number | string | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
};

type DisplayCurrencyState = {
  code: string;
  name: string;
  symbol: string;
  panelRate: number;
  loading: boolean;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  THB: "฿",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  KRW: "₩",
  INR: "₹",
  IDR: "Rp",
  MYR: "RM",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
};

function toNumber(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function getCurrencySymbol(code: string) {
  return CURRENCY_SYMBOLS[code.toUpperCase()] || `${code.toUpperCase()} `;
}

export function useDisplayCurrency() {
  const [currency, setCurrency] = useState<DisplayCurrencyState>({
    code: "PHP",
    name: "Philippine Peso",
    symbol: "₱",
    panelRate: 1,
    loading: true,
  });

  async function loadCurrencyPreference() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCurrency((current) => ({
        ...current,
        loading: false,
      }));
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_currency")
      .eq("id", user.id)
      .single();

    const preferredCurrency = String(
      profile?.preferred_currency || "PHP",
    ).toUpperCase();

    if (preferredCurrency === "PHP") {
      setCurrency({
        code: "PHP",
        name: "Philippine Peso",
        symbol: "₱",
        panelRate: 1,
        loading: false,
      });
      return;
    }

    const { data: rateData, error } = await supabase
      .from("exchange_rates")
      .select("*")
      .eq("currency_code", preferredCurrency)
      .maybeSingle();

    if (error || !rateData) {
      setCurrency({
        code: "PHP",
        name: "Philippine Peso",
        symbol: "₱",
        panelRate: 1,
        loading: false,
      });
      return;
    }

    const rate = rateData as ExchangeRate;

    const panelRate =
      toNumber(rate.panel_rate) ||
      toNumber(rate.rate_to_php) ||
      toNumber(rate.market_rate) ||
      1;

    setCurrency({
      code: preferredCurrency,
      name: rate.currency_name || preferredCurrency,
      symbol: getCurrencySymbol(preferredCurrency),
      panelRate,
      loading: false,
    });
  }

  useEffect(() => {
    loadCurrencyPreference();

    function handleFocus() {
      loadCurrencyPreference();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const helpers = useMemo(() => {
    function convertFromPhp(phpAmount: number | string | null | undefined) {
      const amount = toNumber(phpAmount);

      if (currency.code === "PHP") {
        return amount;
      }

      return amount / currency.panelRate;
    }

    function formatAmount(phpAmount: number | string | null | undefined) {
      const convertedAmount = convertFromPhp(phpAmount);

      if (currency.code === "PHP") {
        return `₱${convertedAmount.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }

      return `${currency.symbol}${convertedAmount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    function formatPhpAmount(phpAmount: number | string | null | undefined) {
      const amount = toNumber(phpAmount);

      return `₱${amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return {
      convertFromPhp,
      formatAmount,
      formatPhpAmount,
    };
  }, [currency]);

  return {
    ...currency,
    ...helpers,
    reloadCurrency: loadCurrencyPreference,
  };
}
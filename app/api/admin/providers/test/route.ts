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

    await supabaseAdmin
      .from("providers")
      .update({
        balance,
        status: "active",
      })
      .eq("id", provider.id);

    return NextResponse.json({
      success: true,
      message: "Provider connected successfully.",
      balance,
      currency: result.currency || "USD",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Unable to connect to provider API.",
    });
  }
}
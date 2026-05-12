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
    formData.append("action", "services");

    const response = await fetch(provider.api_url, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return NextResponse.json({
        success: false,
        message: result.error || "Failed to fetch services.",
      });
    }

    const services = result.map((service: any) => ({
      provider_service_id: String(service.service),
      name: service.name || "Unnamed Service",
      category: service.category || "Uncategorized",
      price: Number(service.rate || 0),
      min: Number(service.min || 0),
      max: Number(service.max || 0),
      type: service.type || "",
      refill: service.refill || false,
      cancel: service.cancel || false,
    }));

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
      },
      services,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Unable to import services.",
    });
  }
}
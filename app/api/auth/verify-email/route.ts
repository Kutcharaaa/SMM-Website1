import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        "https://ascend-service.org/login?error=invalid_token"
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email_verification_token", token)
      .single();

    if (!profile) {
      return NextResponse.redirect(
        "https://ascend-service.org/login?error=invalid_verification"
      );
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        email_verification_token: null,
      })
      .eq("id", profile.id);

    return NextResponse.redirect(
      "https://ascend-service.org/login?verified=1"
    );
  } catch {
    return NextResponse.redirect(
      "https://ascend-service.org/login?error=verification_failed"
    );
  }
}
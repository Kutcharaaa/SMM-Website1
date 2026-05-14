import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({
        success: false,
        message: "Missing reset details.",
      });
    }

    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, password_reset_sent_at")
      .eq("password_reset_token", token)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }

    if (profile.password_reset_sent_at) {
      const sentAt = new Date(profile.password_reset_sent_at).getTime();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - sentAt > oneHour) {
        return NextResponse.json({
          success: false,
          message: "Reset link expired. Please request a new one.",
        });
      }
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      {
        password,
      }
    );

    if (authError) {
      return NextResponse.json({
        success: false,
        message: authError.message,
      });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_token: null,
        password_reset_sent_at: null,
      })
      .eq("id", profile.id);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully. You can now log in.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to reset password.",
    });
  }
}
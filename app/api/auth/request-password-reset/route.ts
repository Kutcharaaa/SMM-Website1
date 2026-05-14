import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required.",
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, username")
      .eq("email", email)
      .single();

    if (!profile) {
      return NextResponse.json({
        success: true,
        message:
          "If this email exists, a password reset link has been sent.",
      });
    }

    const token = crypto.randomUUID();

    await supabaseAdmin
      .from("profiles")
      .update({
        password_reset_token: token,
        password_reset_sent_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    const resetUrl = `https://ascend-service.org/reset-password?token=${token}`;

    await sendEmail({
      to: profile.email,
      subject: "Reset Your Ascend Service Password",
      html: baseEmailTemplate({
        title: "Reset Your Password",
        message:
          "We received a request to reset your password. Click the button below to create a new password.",
        details: `
          <p><strong>Account:</strong> ${profile.email}</p>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
        buttonText: "Reset Password",
        buttonUrl: resetUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Password reset link sent. Please check your email.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send password reset email.",
    });
  }
}
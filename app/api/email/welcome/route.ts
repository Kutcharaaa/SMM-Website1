import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required.",
      });
    }

    const token = crypto.randomUUID();

    await supabaseAdmin
      .from("profiles")
      .update({
        email_verification_token: token,
        email_verification_sent_at: new Date().toISOString(),
        email_verified: false,
      })
      .eq("email", email);

    const verifyUrl = `https://ascend-service.org/api/auth/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Welcome to Ascend Service - Verify Your Email",
      html: baseEmailTemplate({
        title: "Welcome to Ascend Service",
        message: `Welcome${
          username ? `, ${username}` : ""
        }! Please verify your email address to secure your account and complete your registration.`,
        details: `
          <p><strong>Account Email:</strong> ${email}</p>
          <p>Click the button below to verify your email address.</p>
        `,
        buttonText: "Verify Email",
        buttonUrl: verifyUrl,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Welcome verification email sent.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send welcome email.",
    });
  }
}
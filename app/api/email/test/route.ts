import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function GET() {
  try {
    const { data, error } = await resend.emails.send({
      from: "Ascend Service <onboarding@resend.dev>",
      to: ["kktiktok1001@gmail.com"],
      subject: "Ascend Service Email Test",
      html: `
        <h2>Ascend Service Email System</h2>
        <p>Your email notification system is working.</p>
      `,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully.",
      data,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send test email.",
    });
  }
}
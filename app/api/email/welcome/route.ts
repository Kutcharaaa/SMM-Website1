import { NextResponse } from "next/server";
import {
  sendEmail,
  welcomeEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required.",
      });
    }

    await sendEmail({
      to: email,
      subject: "Welcome to Ascend Service",
      html: welcomeEmail({
        username,
      }),
    });

    return NextResponse.json({
      success: true,
      message: "Welcome email sent.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send welcome email.",
    });
  }
}
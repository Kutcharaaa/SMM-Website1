import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  sendEmail,
  adminAlertEmail,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const {
      amount,
      currency,
      method,
      reference,
      proofUrl,
      userId,
    } = await req.json();

    const { data: user } = await supabaseAdmin
      .from("profiles")
      .select("username,email")
      .eq("id", userId)
      .single();

    const { data: admins } = await supabaseAdmin
      .from("profiles")
      .select("email,role")
      .in("role", ["head_admin", "super_admin"]);

    if (!admins || admins.length <= 0) {
      return NextResponse.json({
        success: false,
        message: "No admin emails found.",
      });
    }

    for (const admin of admins) {
      if (!admin.email) continue;

      await sendEmail({
        to: admin.email,
        subject: "New Deposit Request",
        html: adminAlertEmail({
          title: "New Deposit Request",
          message:
            "A user submitted a new deposit request that requires review.",
          details: `
            <p><strong>User:</strong> ${
              user?.username || "Unknown"
            }</p>

            <p><strong>Amount:</strong> ${currency} ${Number(
              amount
            ).toFixed(2)}</p>

            <p><strong>Method:</strong> ${method}</p>

            <p><strong>Reference:</strong> ${reference}</p>

            ${
              proofUrl
                ? `
              <div style="margin-top:20px;">
                <p style="font-weight:bold; margin-bottom:10px;">
                  Payment Proof
                </p>

                <img
                  src="${proofUrl}"
                  alt="Payment Proof"
                  style="
                    width:100%;
                    border-radius:16px;
                    border:1px solid #222;
                  "
                />
              </div>
            `
                : ""
            }
          `,
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin deposit emails sent.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send admin deposit emails.",
    });
  }
}
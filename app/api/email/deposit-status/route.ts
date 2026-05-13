import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendEmail, depositStatusEmail } from "@/lib/email";

function addProofToEmail(
  html: string,
  proofUrl?: string,
  label = "Payment Proof"
) {
  if (!proofUrl) return html;

  return html.replace(
    "</div></div>",
    `
      <div style="margin-top:20px;">
        <p style="font-weight:bold; margin-bottom:10px;">${label}</p>
        <img
          src="${proofUrl}"
          alt="Payment Proof"
          style="width:100%; max-height:480px; object-fit:contain; border-radius:16px; border:1px solid #222; background:#000;"
        />
      </div>
    </div></div>
    `
  );
}

export async function POST(req: Request) {
  try {
    const { depositId, status } = await req.json();

    if (!depositId || !status) {
      return NextResponse.json({
        success: false,
        message: "Missing deposit email details.",
      });
    }

    const { data: deposit } = await supabaseAdmin
      .from("deposits")
      .select("*")
      .eq("id", depositId)
      .single();

    if (!deposit) {
      return NextResponse.json({
        success: false,
        message: "Deposit not found.",
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", deposit.user_id)
      .single();

    if (!profile?.email) {
      return NextResponse.json({
        success: false,
        message: "User email not found.",
      });
    }

    const emailHtml = depositStatusEmail({
      status,
      amount: Number(deposit.amount || 0),
      method: deposit.method,
    });

    await sendEmail({
      to: profile.email,
      subject: status === "approved" ? "Deposit Approved" : "Deposit Rejected",
      html: addProofToEmail(
        emailHtml,
        deposit.proof_url,
        status === "approved" ? "Payment Proof" : "Submitted Payment Proof"
      ),
    });

    return NextResponse.json({
      success: true,
      message: "Deposit email sent.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to send deposit email.",
    });
  }
}
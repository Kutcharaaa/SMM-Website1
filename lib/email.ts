import { resend } from "@/lib/resend";

const FROM_EMAIL =
  "Ascend Service <noreply@mail.ascend-service.org>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!to) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });
  } catch (error) {
    console.error("EMAIL_SEND_ERROR:", error);
  }
}

export function baseEmailTemplate({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#ffffff; padding:30px;">
      <div style="max-width:600px; margin:auto; background:#0f0f0f; border:1px solid #222; border-radius:18px; padding:30px;">
        <h1 style="color:#3b82f6; margin-bottom:10px;">Ascend Service</h1>
        <h2 style="margin-bottom:16px;">${title}</h2>

        <p style="color:#d4d4d8; line-height:1.6;">
          ${message}
        </p>

        ${
          details
            ? `<div style="margin-top:20px; padding:18px; background:#000; border:1px solid #222; border-radius:14px; color:#d4d4d8;">
                ${details}
              </div>`
            : ""
        }

        <p style="margin-top:30px; color:#71717a; font-size:12px;">
          This is an automated email from Ascend Service.
        </p>
      </div>
    </div>
  `;
}
import { resend } from "@/lib/resend";

const FROM_EMAIL =
  "Ascend Service <noreply@mail.ascend-service.org>";

const LOGO_URL = "https://ascend-service.org/logo.png";

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
  buttonText,
  buttonUrl,
}: {
  title: string;
  message: string;
  details?: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background:#050505; color:#ffffff; padding:30px;">
      <div style="max-width:620px; margin:auto; background:#0f0f0f; border:1px solid #222; border-radius:22px; overflow:hidden;">
        
        <div style="padding:28px 30px; border-bottom:1px solid #222; background:#070707;">
          <img src="${LOGO_URL}" alt="Ascend Service" style="height:52px; width:auto; display:block;" />
        </div>

        <div style="padding:30px;">
          <h1 style="color:#3b82f6; margin:0 0 10px; font-size:28px;">
            Ascend Service
          </h1>

          <h2 style="margin:0 0 16px; font-size:22px; color:#ffffff;">
            ${title}
          </h2>

          <p style="color:#d4d4d8; line-height:1.7; font-size:15px; margin:0;">
            ${message}
          </p>

          ${
            details
              ? `<div style="margin-top:22px; padding:18px; background:#000; border:1px solid #222; border-radius:16px; color:#d4d4d8; line-height:1.7; font-size:14px;">
                  ${details}
                </div>`
              : ""
          }

          ${
            buttonText && buttonUrl
              ? `<div style="margin-top:26px;">
                  <a href="${buttonUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:13px 18px; border-radius:12px; font-weight:700; font-size:14px;">
                    ${buttonText}
                  </a>
                </div>`
              : ""
          }

          <p style="margin-top:32px; color:#71717a; font-size:12px; line-height:1.6;">
            This is an automated email from Ascend Service. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function orderPlacedEmail({
  serviceName,
  quantity,
  charge,
  status,
}: {
  serviceName: string;
  quantity: number;
  charge: number;
  status: string;
}) {
  return baseEmailTemplate({
    title: "Order Placed Successfully",
    message:
      "Your order has been received and is now being processed. You can monitor your order status from your dashboard.",
    details: `
      <p><strong>Service:</strong> ${serviceName}</p>
      <p><strong>Quantity:</strong> ${quantity}</p>
      <p><strong>Charge:</strong> ₱${charge.toFixed(2)}</p>
      <p><strong>Status:</strong> ${status}</p>
    `,
    buttonText: "View Dashboard",
    buttonUrl: "https://ascend-service.org/dashboard",
  });
}

export function depositStatusEmail({
  status,
  amount,
  method,
}: {
  status: "approved" | "rejected";
  amount: number;
  method?: string;
}) {
  return baseEmailTemplate({
    title:
      status === "approved"
        ? "Deposit Approved"
        : "Deposit Rejected",
    message:
      status === "approved"
        ? "Your deposit has been approved and added to your wallet balance."
        : "Your deposit was rejected. Please check your payment details or contact support if you believe this is a mistake.",
    details: `
      <p><strong>Amount:</strong> ₱${amount.toFixed(2)}</p>
      ${method ? `<p><strong>Method:</strong> ${method}</p>` : ""}
      <p><strong>Status:</strong> ${status}</p>
    `,
    buttonText: "Open Wallet",
    buttonUrl: "https://ascend-service.org/dashboard/add-funds",
  });
}

export function orderRefundedEmail({
  serviceName,
  amount,
}: {
  serviceName: string;
  amount: number;
}) {
  return baseEmailTemplate({
    title: "Order Refunded",
    message:
      "Your order was refunded and the amount has been returned to your wallet balance.",
    details: `
      <p><strong>Service:</strong> ${serviceName}</p>
      <p><strong>Refund Amount:</strong> ₱${amount.toFixed(2)}</p>
    `,
    buttonText: "View Orders",
    buttonUrl: "https://ascend-service.org/dashboard/orders",
  });
}

export function ticketEmail({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return baseEmailTemplate({
    title,
    message,
    buttonText: "View Tickets",
    buttonUrl: "https://ascend-service.org/dashboard/tickets",
  });
}

export function welcomeEmail({
  username,
}: {
  username?: string;
}) {
  return baseEmailTemplate({
    title: "Welcome to Ascend Service",
    message: `Welcome${
      username ? `, ${username}` : ""
    }! Your account has been created successfully. You can now add funds and start placing orders.`,
    buttonText: "Open Dashboard",
    buttonUrl: "https://ascend-service.org/dashboard",
  });
}

export function adminAlertEmail({
  title,
  message,
  details,
}: {
  title: string;
  message: string;
  details?: string;
}) {
  return baseEmailTemplate({
    title,
    message,
    details,
    buttonText: "Open Admin Panel",
    buttonUrl: "https://ascend-service.org/admin",
  });
}
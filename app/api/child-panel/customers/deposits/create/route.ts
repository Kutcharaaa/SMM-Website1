import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanAmount(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return 0;

  return Number(amount.toFixed(2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = cleanText(body.slug);
    const token = cleanText(body.token);
    const amount = cleanAmount(body.amount);
    const method = cleanText(body.method);
    const referenceNumber = cleanText(body.referenceNumber);
    const proofUrl = cleanText(body.proofUrl);

    if (!slug || !token) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing session details.",
        },
        { status: 400 },
      );
    }

    if (amount < 50) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum add funds amount is ₱50.00.",
        },
        { status: 400 },
      );
    }

    if (!method) {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a payment method.",
        },
        { status: 400 },
      );
    }

    if (!referenceNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your reference number.",
        },
        { status: 400 },
      );
    }

    if (!proofUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload your payment proof.",
        },
        { status: 400 },
      );
    }

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select("id, owner_user_id, panel_name, panel_slug, status")
      .eq("panel_slug", slug)
      .maybeSingle();

    if (panelError || !panel) {
      return NextResponse.json(
        {
          success: false,
          message: "Child panel not found.",
        },
        { status: 404 },
      );
    }

    if (String(panel.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "This child panel is not active.",
        },
        { status: 403 },
      );
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("child_panel_customer_sessions")
      .select("id, customer_id, child_panel_id, expires_at")
      .eq("token", token)
      .eq("child_panel_id", panel.id)
      .maybeSingle();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 },
      );
    }

    const expiresAt = new Date(session.expires_at);

    if (expiresAt.getTime() <= Date.now()) {
      await supabaseAdmin
        .from("child_panel_customer_sessions")
        .delete()
        .eq("id", session.id);

      return NextResponse.json(
        {
          success: false,
          message: "Session expired. Please login again.",
        },
        { status: 401 },
      );
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("child_panel_customers")
      .select("id, firstname, lastname, username, email, status")
      .eq("id", session.customer_id)
      .eq("child_panel_id", panel.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer account not found.",
        },
        { status: 404 },
      );
    }

    if (String(customer.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active.",
        },
        { status: 403 },
      );
    }

    const { data: deposit, error: depositError } = await supabaseAdmin
      .from("child_panel_deposits")
      .insert({
        child_panel_id: panel.id,
        owner_user_id: panel.owner_user_id,
        customer_id: customer.id,
        amount,
        method,
        reference_number: referenceNumber,
        proof_url: proofUrl,
        status: "pending",
      })
      .select("*")
      .single();

    if (depositError) {
      return NextResponse.json(
        {
          success: false,
          message: depositError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: panel.owner_user_id,
      title: "New Child Panel Deposit",
      message: `${customer.firstname || customer.username || customer.email} submitted ₱${amount.toFixed(
        2,
      )} add funds request on ${panel.panel_name}.`,
      type: "child_panel_deposit_pending",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Add funds request submitted successfully. Please wait for approval.",
      deposit,
    });
  } catch (error) {
    console.error("CHILD_PANEL_DEPOSIT_CREATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit add funds request.",
      },
      { status: 500 },
    );
  }
}
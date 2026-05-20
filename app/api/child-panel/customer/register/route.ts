import { NextRequest, NextResponse } from "next/server";
import { randomBytes, scryptSync } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = cleanText(body.slug);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    const firstname = cleanText(body.firstname);
    const lastname = cleanText(body.lastname);
    const username = slugifyUsername(body.username || "");

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Child panel not found.",
        },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!username || username.length < 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Username must be at least 3 characters and use letters, numbers, or underscore only.",
        },
        { status: 400 },
      );
    }

    if (!firstname || !lastname) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your first name and last name.",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
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
          message: "This child panel is not accepting registrations right now.",
        },
        { status: 403 },
      );
    }

    const { data: existingCustomer } = await supabaseAdmin
      .from("child_panel_customers")
      .select("id")
      .eq("child_panel_id", panel.id)
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or username is already registered on this panel.",
        },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);

    const { data: customer, error: insertError } = await supabaseAdmin
      .from("child_panel_customers")
      .insert({
        child_panel_id: panel.id,
        owner_user_id: panel.owner_user_id,
        email,
        username,
        firstname,
        lastname,
        password_hash: passwordHash,
        balance: 0,
        status: "active",
      })
      .select("id, email, username, firstname, lastname, created_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          success: false,
          message: insertError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: panel.owner_user_id,
      title: "New Child Panel Customer",
      message: `${firstname} ${lastname} registered on ${panel.panel_name}.`,
      type: "child_panel_customer_registered",
      is_read: false,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now login.",
      customer,
    });
  } catch (error) {
    console.error("CHILD_PANEL_CUSTOMER_REGISTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account.",
      },
      { status: 500 },
    );
  }
}
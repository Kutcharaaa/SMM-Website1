import { NextRequest, NextResponse } from "next/server";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function normalizeLogin(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash || !storedHash.includes(":")) return false;

  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) return false;

  const passwordHash = scryptSync(password, salt, 64).toString("hex");

  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(passwordHash, "hex"));
  } catch {
    return false;
  }
}

function createSessionToken() {
  return randomBytes(48).toString("hex");
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const slug = cleanText(body.slug);
    const login = normalizeLogin(body.login);
    const password = String(body.password || "");

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Child panel not found.",
        },
        { status: 400 },
      );
    }

    if (!login || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your email/username and password.",
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
          message: "This child panel is not active right now.",
        },
        { status: 403 },
      );
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("child_panel_customers")
      .select(
        "id, child_panel_id, owner_user_id, email, username, firstname, lastname, password_hash, balance, status",
      )
      .eq("child_panel_id", panel.id)
      .or(`email.eq.${login},username.eq.${login}`)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login details.",
        },
        { status: 401 },
      );
    }

    if (String(customer.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Your account is not active. Please contact support.",
        },
        { status: 403 },
      );
    }

    const passwordValid = verifyPassword(password, customer.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid login details.",
        },
        { status: 401 },
      );
    }

    const token = createSessionToken();
    const now = new Date();
    const expiresAt = addDays(now, 7);

    const { error: sessionError } = await supabaseAdmin
      .from("child_panel_customer_sessions")
      .insert({
        customer_id: customer.id,
        child_panel_id: panel.id,
        owner_user_id: panel.owner_user_id,
        token,
        expires_at: expiresAt.toISOString(),
        created_at: now.toISOString(),
      });

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          message: sessionError.message,
        },
        { status: 500 },
      );
    }

    await supabaseAdmin
      .from("child_panel_customers")
      .update({
        last_login_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", customer.id);

    const safeCustomer = {
      id: customer.id,
      email: customer.email,
      username: customer.username,
      firstname: customer.firstname,
      lastname: customer.lastname,
      balance: customer.balance,
      status: customer.status,
    };

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      token,
      expiresAt: expiresAt.toISOString(),
      panel: {
        id: panel.id,
        panel_name: panel.panel_name,
        panel_slug: panel.panel_slug,
      },
      customer: safeCustomer,
    });
  } catch (error) {
    console.error("CHILD_PANEL_CUSTOMER_LOGIN_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to login.",
      },
      { status: 500 },
    );
  }
}
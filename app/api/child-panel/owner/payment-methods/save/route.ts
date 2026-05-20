import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized. Please login again." }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ success: false, message: "Invalid session. Please login again." }, { status: 401 });

    const body = await request.json();
    const methodId = cleanText(body.methodId);
    const methodName = cleanText(body.methodName);
    const accountName = cleanText(body.accountName);
    const accountNumber = cleanText(body.accountNumber);
    const qrUrl = cleanText(body.qrUrl);
    const instructions = cleanText(body.instructions);
    const status = cleanText(body.status || "active").toLowerCase() === "inactive" ? "inactive" : "active";

    if (!methodName) return NextResponse.json({ success: false, message: "Please enter a payment method name." }, { status: 400 });

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select("id, owner_user_id, panel_name, panel_slug")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (panelError) return NextResponse.json({ success: false, message: panelError.message }, { status: 500 });
    if (!panel) return NextResponse.json({ success: false, message: "No child panel found." }, { status: 404 });

    const payload = {
      child_panel_id: panel.id,
      owner_user_id: user.id,
      method_name: methodName,
      account_name: accountName || null,
      account_number: accountNumber || null,
      qr_url: qrUrl || null,
      instructions: instructions || null,
      status,
      updated_at: new Date().toISOString(),
    };

    if (methodId) {
      const { data, error } = await supabaseAdmin
        .from("child_panel_payment_methods")
        .update(payload)
        .eq("id", methodId)
        .eq("owner_user_id", user.id)
        .select("*")
        .single();
      if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Payment method updated.", method: data });
    }

    const { data, error } = await supabaseAdmin
      .from("child_panel_payment_methods")
      .insert(payload)
      .select("*")
      .single();

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Payment method saved.", method: data });
  } catch (error) {
    console.error("OWNER_PAYMENT_METHODS_SAVE_ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to save payment method." }, { status: 500 });
  }
}

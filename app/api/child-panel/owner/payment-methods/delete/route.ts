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
    if (!methodId) return NextResponse.json({ success: false, message: "Missing method ID." }, { status: 400 });

    const { error } = await supabaseAdmin
      .from("child_panel_payment_methods")
      .delete()
      .eq("id", methodId)
      .eq("owner_user_id", user.id);

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Payment method deleted." });
  } catch (error) {
    console.error("OWNER_PAYMENT_METHODS_DELETE_ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to delete payment method." }, { status: 500 });
  }
}

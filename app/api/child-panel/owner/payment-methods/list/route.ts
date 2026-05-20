import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized. Please login again." }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ success: false, message: "Invalid session. Please login again." }, { status: 401 });

    const { data: panel, error: panelError } = await supabaseAdmin
      .from("child_panels")
      .select("id, owner_user_id, panel_name, panel_slug")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (panelError) return NextResponse.json({ success: false, message: panelError.message }, { status: 500 });
    if (!panel) return NextResponse.json({ success: true, methods: [], panel: null });

    const { data: methods, error } = await supabaseAdmin
      .from("child_panel_payment_methods")
      .select("*")
      .eq("child_panel_id", panel.id)
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ success: false, message: error.message }, { status: 500 });

    return NextResponse.json({ success: true, panel, methods: methods || [] });
  } catch (error) {
    console.error("OWNER_PAYMENT_METHODS_LIST_ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load payment methods." }, { status: 500 });
  }
}

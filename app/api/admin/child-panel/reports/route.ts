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
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(profile?.role || "").toLowerCase();
    if (!["admin", "head_admin", "super_admin"].includes(role)) {
      return NextResponse.json({ success: false, message: "Admin access required." }, { status: 403 });
    }

    const [panelsRes, ordersRes, depositsRes] = await Promise.all([
      supabaseAdmin.from("child_panels").select("id, owner_user_id, panel_name, panel_slug, status, markup_percent, created_at"),
      supabaseAdmin.from("child_panel_orders").select("id, child_panel_id, owner_user_id, customer_price, base_price, owner_profit, status, created_at").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin.from("child_panel_deposits").select("id, child_panel_id, owner_user_id, amount, status, created_at").order("created_at", { ascending: false }).limit(500),
    ]);

    if (panelsRes.error) return NextResponse.json({ success: false, message: panelsRes.error.message }, { status: 500 });
    if (ordersRes.error) return NextResponse.json({ success: false, message: ordersRes.error.message }, { status: 500 });
    if (depositsRes.error) return NextResponse.json({ success: false, message: depositsRes.error.message }, { status: 500 });

    const panels = panelsRes.data || [];
    const orders = ordersRes.data || [];
    const deposits = depositsRes.data || [];

    const reportRows = panels.map((panel: any) => {
      const panelOrders = orders.filter((o: any) => o.child_panel_id === panel.id);
      const panelDeposits = deposits.filter((d: any) => d.child_panel_id === panel.id);
      const revenue = panelOrders.reduce((sum: number, o: any) => sum + Number(o.customer_price || 0), 0);
      const baseCost = panelOrders.reduce((sum: number, o: any) => sum + Number(o.base_price || 0), 0);
      const profit = panelOrders.reduce((sum: number, o: any) => sum + Number(o.owner_profit || 0), 0);
      const approvedDeposits = panelDeposits
        .filter((d: any) => String(d.status || "").toLowerCase() === "approved")
        .reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0);

      return {
        ...panel,
        total_orders: panelOrders.length,
        completed_orders: panelOrders.filter((o: any) => String(o.status || "").toLowerCase() === "completed").length,
        active_orders: panelOrders.filter((o: any) => ["pending", "processing", "partial"].includes(String(o.status || "").toLowerCase())).length,
        customer_revenue: revenue,
        base_cost: baseCost,
        owner_profit: profit,
        approved_deposits: approvedDeposits,
      };
    }).sort((a: any, b: any) => Number(b.owner_profit || 0) - Number(a.owner_profit || 0));

    const summary = {
      total_panels: panels.length,
      active_panels: panels.filter((p: any) => String(p.status || "").toLowerCase() === "active").length,
      total_orders: orders.length,
      total_customer_revenue: orders.reduce((sum: number, o: any) => sum + Number(o.customer_price || 0), 0),
      total_base_cost: orders.reduce((sum: number, o: any) => sum + Number(o.base_price || 0), 0),
      total_owner_profit: orders.reduce((sum: number, o: any) => sum + Number(o.owner_profit || 0), 0),
      total_approved_deposits: deposits.filter((d: any) => String(d.status || "").toLowerCase() === "approved").reduce((sum: number, d: any) => sum + Number(d.amount || 0), 0),
    };

    return NextResponse.json({ success: true, summary, reports: reportRows, recent_orders: orders.slice(0, 20), recent_deposits: deposits.slice(0, 20) });
  } catch (error) {
    console.error("ADMIN_CHILD_PANEL_REPORTS_ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load child panel reports." }, { status: 500 });
  }
}

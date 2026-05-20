import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug")?.trim();

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing panel slug.",
        },
        { status: 400 },
      );
    }

    const { data: panel, error } = await supabaseAdmin
      .from("child_panels")
      .select(
        "id, panel_name, panel_slug, support_email, logo_url, primary_color, status",
      )
      .eq("panel_slug", slug)
      .maybeSingle();

    if (error || !panel) {
      return NextResponse.json(
        {
          success: false,
          message: "Panel not found.",
        },
        { status: 404 },
      );
    }

    if (String(panel.status || "").toLowerCase() !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Panel is not active.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      panel,
    });
  } catch (error) {
    console.error("CHILD_PANEL_PUBLIC_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load panel.",
      },
      { status: 500 },
    );
  }
}
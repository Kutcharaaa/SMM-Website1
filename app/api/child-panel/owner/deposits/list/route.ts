import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.startsWith("Bearer ")) return "";

  return authHeader.replace("Bearer ", "").trim();
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid session. Please login again.",
        },
        { status: 401 },
      );
    }

    const { data: deposits, error } = await supabaseAdmin
      .from("child_panel_deposits")
      .select(
        `
        id,
        child_panel_id,
        owner_user_id,
        customer_id,
        amount,
        method,
        reference_number,
        proof_url,
        status,
        reject_reason,
        approved_at,
        rejected_at,
        created_at,
        updated_at,
        child_panel_customers (
          id,
          email,
          username,
          firstname,
          lastname,
          balance,
          status
        )
      `,
      )
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      deposits: deposits || [],
    });
  } catch (error) {
    console.error("CHILD_PANEL_OWNER_DEPOSITS_LIST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load child panel deposits.",
      },
      { status: 500 },
    );
  }
}

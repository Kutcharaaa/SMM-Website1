import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const { count, error } = await supabaseAdmin
      .from("services")
      .delete({ count: "exact" })
      .not("id", "is", null);

    if (error) {
      return NextResponse.json({
        success: false,
        message: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${count || 0} services deleted successfully.`,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to delete all services.",
    });
  }
}
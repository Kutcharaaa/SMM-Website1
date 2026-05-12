import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length <= 0) {
      return NextResponse.json({
        success: false,
        message: "No services selected.",
      });
    }

    const chunkSize = 100;

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);

      const { error } = await supabaseAdmin
        .from("services")
        .delete()
        .in("id", chunk);

      if (error) {
        return NextResponse.json({
          success: false,
          message: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${ids.length} services deleted successfully.`,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to delete selected services.",
    });
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const batchSize = 1000;

    while (true) {
      const { data: services, error: fetchError } = await supabaseAdmin
        .from("services")
        .select("id")
        .limit(batchSize);

      if (fetchError) {
        return NextResponse.json({
          success: false,
          message: fetchError.message,
        });
      }

      if (!services || services.length === 0) {
        break;
      }

      const ids = services.map((service) => service.id);

      const { error: deleteError } = await supabaseAdmin
        .from("services")
        .delete()
        .in("id", ids);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          message: deleteError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "All services deleted successfully.",
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to delete all services.",
    });
  }
}
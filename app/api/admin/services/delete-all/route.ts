import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const fetchSize = 500;
    const deleteChunkSize = 50;
    let deletedTotal = 0;

    while (true) {
      const { data: services, error: fetchError } = await supabaseAdmin
        .from("services")
        .select("id")
        .limit(fetchSize);

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

      for (let i = 0; i < ids.length; i += deleteChunkSize) {
        const chunk = ids.slice(i, i + deleteChunkSize);

        const { error: deleteError } = await supabaseAdmin
          .from("services")
          .delete()
          .in("id", chunk);

        if (deleteError) {
          return NextResponse.json({
            success: false,
            message: deleteError.message,
          });
        }

        deletedTotal += chunk.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${deletedTotal} services deleted successfully.`,
    });
  } catch {
    return NextResponse.json({
      success: false,
      message: "Failed to delete all services.",
    });
  }
}
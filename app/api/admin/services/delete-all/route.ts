import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    let deletedCount = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error: fetchError } = await supabaseAdmin
        .from("services")
        .select("id")
        .range(0, batchSize - 1);

      if (fetchError) {
        return NextResponse.json(
          {
            success: false,
            message: fetchError.message,
          },
          { status: 500 }
        );
      }

      const ids = (data || []).map((service) => service.id);

      if (ids.length <= 0) {
        break;
      }

      const { error: deleteError } = await supabaseAdmin
        .from("services")
        .delete()
        .in("id", ids);

      if (deleteError) {
        return NextResponse.json(
          {
            success: false,
            message: deleteError.message,
          },
          { status: 500 }
        );
      }

      deletedCount += ids.length;

      if (ids.length < batchSize) {
        break;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount.toLocaleString()} services successfully.`,
      deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete all services.",
      },
      { status: 500 }
    );
  }
}
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  try {
    const { ref } = await request.json();

    const cleanRef = String(ref || "").trim();

    if (!cleanRef) {
      return NextResponse.json({
        found: false,
        referrer: null,
      });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          found: false,
          referrer: null,
          error: "Server referrer check is not configured.",
        },
        { status: 500 },
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let query = adminSupabase
      .from("profiles")
      .select("id, username, firstname, lastname")
      .limit(1);

    if (isUuid(cleanRef)) {
      query = query.eq("id", cleanRef);
    } else if (cleanRef.length === 8) {
      query = query.or(`username.ilike.${cleanRef},id.ilike.${cleanRef}%`);
    } else {
      query = query.ilike("username", cleanRef);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          found: false,
          referrer: null,
          error: error.message,
        },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({
        found: false,
        referrer: null,
      });
    }

    return NextResponse.json({
      found: true,
      referrer: data,
    });
  } catch {
    return NextResponse.json(
      {
        found: false,
        referrer: null,
        error: "Unable to resolve referrer.",
      },
      { status: 500 },
    );
  }
}
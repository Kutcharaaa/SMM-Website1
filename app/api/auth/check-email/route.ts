import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ exists: false });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { exists: false, error: "Server auth check is not configured." },
        { status: 500 },
      );
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await adminSupabase.auth.admin.listUsers();

    if (error) {
      return NextResponse.json(
        { exists: false, error: error.message },
        { status: 500 },
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const exists = data.users.some(
      (user) => user.email?.toLowerCase() === cleanEmail,
    );

    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json(
      { exists: false, error: "Unable to check email." },
      { status: 500 },
    );
  }
}
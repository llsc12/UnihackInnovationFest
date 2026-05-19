// POST /api/auth/change-password
// Body: { password: string }
// Updates the authenticated user's password via Supabase Auth.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSessionServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { password } = await req.json();
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const { error } = await supabase.auth.updateUser({ password: String(password) });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// DELETE /api/auth/delete-account
// Deletes the authenticated user's account (cascades to profiles via FK).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionServerClient, createServerClient } from "@/lib/supabase";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionClient = createSessionServerClient(cookieStore);
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use the service-role admin client to delete the auth user
    const adminClient = createServerClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

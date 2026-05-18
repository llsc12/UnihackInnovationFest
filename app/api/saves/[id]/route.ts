// POST   /api/saves/:id  — add listing to the user's saves (auth required)
// DELETE /api/saves/:id  — remove from saves (auth required)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { saveListing, unsaveListing } from "@/lib/data";

interface Ctx {
  params: Promise<{ id: string }>;
}

async function requireUser() {
  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await saveListing(user.id, id);
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (err) {
    console.error("POST /api/saves/[id] failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await unsaveListing(user.id, id);
    return NextResponse.json({ saved: false });
  } catch (err) {
    console.error("DELETE /api/saves/[id] failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

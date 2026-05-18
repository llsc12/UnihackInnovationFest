// POST   /api/saves/:id  — add listing to the user's saves (auth required)
// DELETE /api/saves/:id  — remove from saves (auth required)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { saveListing, unsaveListing } from "@/lib/data";

interface Ctx {
  params: Promise<{ id: string }>;
}

async function requireUser() {
  const cookieStore = await cookies();
  return getCurrentUser(cookieStore);
}

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await saveListing(user.id, id);
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (err) {
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
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

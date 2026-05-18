// PATCH /api/listings/:id — update listing fields (owner only)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getListingById, updateListing } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createSessionServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listing = await getListingById(id);
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (listing.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const patch = await req.json();
    await updateListing(id, patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

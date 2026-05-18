// GET /api/listings  — search listings
// POST /api/listings — create listing (auth required)

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createListing } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";
import { search } from "@/lib/search";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const yearStr = url.searchParams.get("year");
  const results = await search({
    q: url.searchParams.get("q") ?? undefined,
    make: url.searchParams.get("make") ?? undefined,
    model: url.searchParams.get("model") ?? undefined,
    partType: url.searchParams.get("partType") ?? undefined,
    year: yearStr ? Number(yearStr) : undefined,
  });
  return NextResponse.json(results);
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createSessionServerClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { input, generated } = await req.json();
    const listing = await createListing(input, generated, user.id);
    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

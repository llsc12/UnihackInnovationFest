// STREAM 4 — GET /api/listings  (search)
// Query: ?q=&make=&model=&year=&partType=    Response: SearchResult[]

import { NextResponse } from "next/server";
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

// STREAM 1 — POST /api/generate-listing
// Body: ListingInput   Response: GeneratedListing

import { NextResponse } from "next/server";
import { generateListing } from "@/lib/listing-generator";
import type { ListingInput } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as ListingInput;

    if (!input.partType || !input.make || !input.model) {
      return NextResponse.json(
        { error: "partType, make, and model are required" },
        { status: 400 }
      );
    }

    const generated = await generateListing(input);
    return NextResponse.json(generated);
  } catch (err) {
    console.error("generate-listing failed:", err);
    return NextResponse.json({ error: "Failed to generate listing" }, { status: 500 });
  }
}

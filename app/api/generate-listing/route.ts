// STREAM 1 — POST /api/generate-listing
// Body: ListingInput
// Response: a text/plain stream of the JSON-encoded GeneratedListing.
// The client should accumulate chunks and JSON.parse the final buffer.

import { NextResponse } from "next/server";
import { generateListingStream, type GenerationMode } from "@/lib/listing-generator";
import type { ListingInput } from "@/lib/types";

export async function POST(req: Request) {
  let input: ListingInput;
  try {
    input = (await req.json()) as ListingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!input.partType || !input.make || !input.model) {
    return NextResponse.json(
      { error: "partType, make, and model are required" },
      { status: 400 }
    );
  }

  const modeParam = new URL(req.url).searchParams.get("mode");
  const mode: GenerationMode =
    modeParam === "template" || modeParam === "ai" ? modeParam : "auto";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generateListingStream(input, { mode })) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        console.error("generate-listing stream failed:", err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

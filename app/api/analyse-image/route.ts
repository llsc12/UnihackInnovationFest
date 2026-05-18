// POST /api/analyse-image
// Body: { url: string }  — a Supabase Storage URL returned by /api/upload
// Response: { partType, condition, partNumber, notes }
// Fetches the image from its public URL and sends it to Claude Vision.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

const EXT_TO_MIME: Record<string, MediaType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function isAllowedImageUrl(url: string): boolean {
  // Accept Supabase Storage public URLs and legacy local /uploads/ paths
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseBase && url.startsWith(supabaseBase)) return true;
  if (url.startsWith("/uploads/")) return true;
  return false;
}

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url?: string };

  if (!url || !isAllowedImageUrl(url)) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  // Resolve relative /uploads/ paths to absolute for fetch
  const absoluteUrl = url.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}${url}`
    : url;

  const ext = absoluteUrl.split(".").pop()?.toLowerCase() ?? "";
  const mediaType: MediaType = EXT_TO_MIME[ext] ?? "image/jpeg";

  let imageData: string;
  try {
    const res = await fetch(absoluteUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    imageData = buffer.toString("base64");
  } catch (err) {
    return NextResponse.json({ error: `Could not fetch image: ${err}` }, { status: 404 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      partType: "Headlight",
      condition: "good",
      partNumber: null,
      notes: "Part appears to be in good condition (demo mode — add ANTHROPIC_API_KEY to enable real analysis).",
    });
  }

  const client = new Anthropic();
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageData },
          },
          {
            type: "text",
            text: `Analyse this car part image. Output ONLY valid minified JSON:
{ "partType": string, "condition": "new"|"like-new"|"good"|"fair"|"for-parts", "partNumber": string|null, "notes": string }

- partType: the type of car part (e.g. "Headlight", "Alternator", "Brake Caliper")
- condition: your best estimate based on visible wear/damage
- partNumber: any visible part number stamped or labelled on the part, or null
- notes: 1-2 honest sentences about visible condition or notable features
- No markdown, JSON only.`,
          },
        ],
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}

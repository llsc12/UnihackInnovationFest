// POST /api/analyse-image
// Body: { url: string }  — a /uploads/... URL returned by /api/upload
// Response: { partType, condition, partNumber, notes }
// Reads the file from disk and sends it to Claude Vision to extract part metadata.

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

const EXT_TO_MIME: Record<string, MediaType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function POST(req: Request) {
  const { url } = (await req.json()) as { url?: string };

  if (!url?.startsWith("/uploads/")) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  const filename = url.replace("/uploads/", "");
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const mediaType = EXT_TO_MIME[ext];

  if (!mediaType) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  let imageData: string;
  try {
    const buffer = await readFile(join(process.cwd(), "public", "uploads", filename));
    imageData = buffer.toString("base64");
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
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

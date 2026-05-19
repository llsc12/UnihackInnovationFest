// POST /api/analyse-image
// Body: { urls: string[] }  — image URLs returned by /api/upload (1-4 images)
// Response: { partType, condition, partNumber, notes, make, model, yearFrom, yearTo, partOrigin }
// All images are sent to Claude Haiku in a single message for richer context.
// Supabase Storage URLs are fetched over HTTP; local /uploads/ files are read from disk.

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import Anthropic from "@anthropic-ai/sdk";

type MediaType = "image/jpeg" | "image/png" | "image/webp";

const EXT_TO_MIME: Record<string, MediaType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function isAllowedImageUrl(url: string): boolean {
  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseBase && url.startsWith(supabaseBase)) return true;
  if (url.startsWith("/uploads/")) return true;
  return false;
}

function mediaTypeFromUrl(url: string): MediaType {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_MIME[ext] ?? "image/jpeg";
}

async function loadImageAsBase64(url: string): Promise<{ data: string; mediaType: MediaType }> {
  const mediaType = mediaTypeFromUrl(url);

  if (url.startsWith("/uploads/")) {
    // Read local fallback files directly from public/uploads/ — avoids HTTP round-trip
    const filename = url.replace("/uploads/", "");
    const buf = await readFile(join(process.cwd(), "public", "uploads", filename));
    return { data: buf.toString("base64"), mediaType };
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { data: buf.toString("base64"), mediaType };
}

export async function POST(req: Request) {
  const body = (await req.json()) as { urls?: string[] };
  const urls = (body.urls ?? []).filter((u) => isAllowedImageUrl(u)).slice(0, 4);

  if (!urls.length) {
    return NextResponse.json({ error: "At least one valid image URL is required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      partType: "Headlight",
      condition: "good",
      partNumber: null,
      notes: "Part appears to be in good condition (demo mode — add ANTHROPIC_API_KEY to enable real analysis).",
      make: null,
      model: null,
      yearFrom: null,
      yearTo: null,
      partOrigin: "unknown",
    });
  }

  let images: { data: string; mediaType: MediaType }[];
  try {
    images = await Promise.all(urls.map(loadImageAsBase64));
  } catch (err) {
    return NextResponse.json({ error: `Could not load image: ${err}` }, { status: 404 });
  }

  const client = new Anthropic();

  const imageBlocks: Anthropic.ImageBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.data },
  }));

  const res = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `Analyse these car part image(s). Output ONLY valid minified JSON with these exact keys:
{
  "partType": string,
  "condition": "new"|"like-new"|"good"|"fair"|"for-parts",
  "partNumber": string|null,
  "notes": string,
  "make": string|null,
  "model": string|null,
  "yearFrom": number|null,
  "yearTo": number|null,
  "partOrigin": "oem"|"aftermarket"|"unknown"
}

Rules:
- partType: type of car part (e.g. "Headlight", "Alternator", "Brake Caliper")
- condition: estimate based on visible wear/damage
- partNumber: any visible part number stamped or labelled on the part, or null
- notes: 1-2 honest sentences about visible condition or notable features
- make: vehicle manufacturer if identifiable from badges, labels, or packaging (e.g. "Volkswagen"), or null
- model: vehicle model if identifiable (e.g. "Golf"), or null
- yearFrom/yearTo: estimated year range the part fits if determinable, or null — use same value for both if single year known
- partOrigin: "oem" if branded as original equipment, "aftermarket" if clearly a third-party part, otherwise "unknown"
- No markdown, no explanation, JSON only.`,
          },
        ],
      },
    ],
  });

  const raw = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Strip markdown code fences if the model wraps the JSON (e.g. ```json ... ```)
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw }, { status: 500 });
  }
}

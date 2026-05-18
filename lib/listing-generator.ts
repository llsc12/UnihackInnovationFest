// STREAM 1 — Listing Generator.
// Generates a clean listing from raw seller input.
// Uses Claude if ANTHROPIC_API_KEY is set; otherwise falls back to deterministic templates.
//
// Two entry points:
//   generateListing(input)       -> Promise<GeneratedListing>   (one-shot, for tests / server-side use)
//   generateListingStream(input) -> AsyncIterable<string>       (streams JSON text chunks for the UI)

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import type { GeneratedListing, ListingInput } from "@/lib/types";
import { formatYearRange } from "@/lib/utils";

type MediaType = "image/jpeg" | "image/png" | "image/webp";
const EXT_TO_MIME: Record<string, MediaType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Builds a multimodal message content block: images (if available) + text prompt.
async function buildMessageContent(
  input: ListingInput
): Promise<Anthropic.MessageParam["content"]> {
  const text = buildPrompt(input);
  const urls = (input.images ?? []).filter((u) => u.startsWith("/uploads/")).slice(0, 4);

  if (!urls.length) return text;

  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  for (const url of urls) {
    const filename = url.replace("/uploads/", "");
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const mediaType = EXT_TO_MIME[ext];
    if (!mediaType) continue;
    try {
      const buffer = await readFile(join(process.cwd(), "public", "uploads", filename));
      imageBlocks.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
      });
    } catch { /* skip missing files */ }
  }

  if (!imageBlocks.length) return text;
  return [...imageBlocks, { type: "text", text }];
}

export async function generateListing(input: ListingInput): Promise<GeneratedListing> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await generateWithClaude(input);
    } catch (err) {
      console.error("Claude generation failed, falling back to template:", err);
    }
  }
  return generateWithTemplate(input);
}

// Streams the JSON of a GeneratedListing as text chunks.
// Falls back to a fake typewriter over the template if no API key OR if Claude fails
// before yielding any output. (If Claude fails mid-stream we propagate the error —
// can't cleanly switch to a template after partial output has already gone to the client.)
export async function* generateListingStream(input: ListingInput): AsyncIterable<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    let yieldedAny = false;
    try {
      for await (const chunk of generateWithClaudeStream(input)) {
        yieldedAny = true;
        yield chunk;
      }
      return;
    } catch (err) {
      console.error("Claude streaming failed:", err);
      if (yieldedAny) throw err;
    }
  }
  yield* generateWithTemplateStream(input);
}

// ---------- Template fallback (always works, no API key needed) ----------

export function generateWithTemplate(input: ListingInput): GeneratedListing {
  const years = formatYearRange(input.yearFrom, input.yearTo);
  const conditionPhrase = conditionToPhrase(input.condition);

  const title = `${input.make} ${input.model} ${input.partType} ${years}${
    input.partNumber ? ` - ${input.partNumber}` : ""
  }`;

  const description =
    `Used ${input.make} ${input.model} ${input.partType.toLowerCase()} in ${conditionPhrase} condition. ` +
    `Suitable for ${input.make} ${input.model} models between ${input.yearFrom} and ${input.yearTo}. ` +
    (input.notes ? `${input.notes} ` : "") +
    (input.partNumber ? `Please confirm part number ${input.partNumber} before purchase.` : "Please confirm fitment before purchase.");

  const conditionNotes = input.notes
    ? `${capitalise(conditionPhrase)} condition. ${input.notes}`
    : `${capitalise(conditionPhrase)} condition.`;

  const compatibilitySummary = `Fits ${input.make} ${input.model} (${years}).${
    input.partNumber ? ` Part no. ${input.partNumber}.` : ""
  }`;

  const keywords = [
    input.make,
    input.model,
    input.partType,
    ...(input.partNumber ? [input.partNumber] : []),
    String(input.yearFrom),
    String(input.yearTo),
  ];

  return { title, description, conditionNotes, compatibilitySummary, keywords };
}

// ---------- Claude path ----------

async function generateWithClaude(input: ListingInput): Promise<GeneratedListing> {
  const client = new Anthropic();
  const content = await buildMessageContent(input);
  const res = await client.messages.create({
    model: claudeModel(),
    max_tokens: 600,
    messages: [{ role: "user", content }],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return JSON.parse(text) as GeneratedListing;
}

async function* generateWithClaudeStream(input: ListingInput): AsyncIterable<string> {
  const client = new Anthropic();
  const content = await buildMessageContent(input);
  const stream = client.messages.stream({
    model: claudeModel(),
    max_tokens: 600,
    messages: [{ role: "user", content }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

// Fake typewriter so the no-API-key path still feels alive in the UI.
async function* generateWithTemplateStream(input: ListingInput): AsyncIterable<string> {
  const json = JSON.stringify(generateWithTemplate(input));
  for (let i = 0; i < json.length; i += 4) {
    yield json.slice(i, i + 4);
    await new Promise((r) => setTimeout(r, 12));
  }
}

function claudeModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
}

function buildPrompt(input: ListingInput): string {
  return `You are writing a listing for a used car part marketplace. Output ONLY valid minified JSON matching this TypeScript type:
{ "title": string, "description": string, "conditionNotes": string, "compatibilitySummary": string, "keywords": string[] }

Seller input:
${JSON.stringify(input, null, 2)}

Rules:
- Title: concise, includes make/model/part/years, max ~80 chars.
- Description: 2-4 sentences, honest, mentions condition and any notes.
- Keywords: 5-10 useful search terms, no duplicates.
- Do not invent a part number, only use the one provided.
- No markdown, no preamble, JSON only.`;
}

// ---------- helpers ----------

function conditionToPhrase(c: ListingInput["condition"]): string {
  switch (c) {
    case "new":
      return "new";
    case "like-new":
      return "like-new";
    case "good":
      return "good working";
    case "fair":
      return "fair, used";
    case "for-parts":
      return "for-parts (not working)";
  }
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

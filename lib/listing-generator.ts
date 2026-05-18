// STREAM 1 — Listing Generator.
// Generates a clean listing from raw seller input.
// Uses Claude if ANTHROPIC_API_KEY is set; otherwise falls back to deterministic templates.
//
// Two entry points:
//   generateListing(input)       -> Promise<GeneratedListing>   (one-shot, for tests / server-side use)
//   generateListingStream(input) -> AsyncIterable<string>       (streams section-delimited text for the UI; parsed by lib/listing-format.ts)

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import type { GeneratedListing, ListingInput } from "@/lib/types";
import { finalizeListing, parseListingSections } from "@/lib/listing-format";
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

// Non-streaming entry: drain the stream into a buffer and parse.
export async function generateListing(input: ListingInput): Promise<GeneratedListing> {
  let buffer = "";
  for await (const chunk of generateListingStream(input)) {
    buffer += chunk;
  }
  return finalizeListing(parseListingSections(buffer));
}

export type GenerationMode = "auto" | "template" | "ai";

// Streams the listing as section-delimited text chunks (see lib/listing-format.ts).
//
// Modes:
//   auto     - Use Claude if ANTHROPIC_API_KEY is set, else template. Falls back to
//              template if Claude fails before yielding any output.
//   template - Force the deterministic template path. Never calls Claude.
//   ai       - Force the Claude path. Throws if ANTHROPIC_API_KEY is missing or
//              if Claude fails (no silent fallback — demo wants the failure to show).
//
// If Claude fails mid-stream we always propagate, since partial output has already
// reached the client.
export async function* generateListingStream(
  input: ListingInput,
  options: { mode?: GenerationMode } = {}
): AsyncIterable<string> {
  const mode = options.mode ?? "auto";

  if (mode === "template") {
    yield* generateWithTemplateStream(input);
    return;
  }

  if (mode === "ai" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("AI mode requested but ANTHROPIC_API_KEY is not set");
  }

  if (mode === "ai" || (mode === "auto" && process.env.ANTHROPIC_API_KEY)) {
    let yieldedAny = false;
    try {
      for await (const chunk of generateWithClaudeStream(input)) {
        yieldedAny = true;
        yield chunk;
      }
      return;
    } catch (err) {
      console.error("Claude streaming failed:", err);
      if (mode === "ai") throw err;
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
// Emits the same section-delimited format as the Claude path so the client
// parser doesn't need to know which path produced the bytes.
async function* generateWithTemplateStream(input: ListingInput): AsyncIterable<string> {
  const t = generateWithTemplate(input);
  const text =
    `###TITLE\n${t.title}\n` +
    `###DESCRIPTION\n${t.description}\n` +
    `###CONDITION\n${t.conditionNotes}\n` +
    `###COMPATIBILITY\n${t.compatibilitySummary}\n` +
    `###KEYWORDS\n${t.keywords.join(", ")}\n`;

  // Stream a few characters at a time so the UI gets a typewriter feel.
  for (let i = 0; i < text.length; i += 3) {
    yield text.slice(i, i + 3);
    await new Promise((r) => setTimeout(r, 15));
  }
}

function claudeModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
}

function buildPrompt(input: ListingInput): string {
  return `You are writing a listing for a used car part marketplace.

Output the listing using this exact section-delimited format. Each section header sits on its own line and starts with three hash signs. Do not output anything before the first header or after the last section's content.

###TITLE
<one-line title, concise, includes make/model/part/years, max ~80 chars>
###DESCRIPTION
<2-4 sentences, honest, mention condition and any notes the seller provided>
###CONDITION
<one sentence summarising condition>
###COMPATIBILITY
<one sentence describing which vehicles/years/generations this fits>
###KEYWORDS
<5-10 useful search terms, comma-separated, no duplicates>

Seller input:
${JSON.stringify(input, null, 2)}

Rules:
- Do not invent a part number; only use the one provided (if any).
- No markdown, no preamble, no closing remarks.
- Start your response with ###TITLE on the first line.`;
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

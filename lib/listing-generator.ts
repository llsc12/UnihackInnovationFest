// STREAM 1 — Listing Generator.
// Generates a clean listing from raw seller input.
// Uses Claude if ANTHROPIC_API_KEY is set; otherwise falls back to deterministic templates.
//
// Two entry points:
//   generateListing(input)       -> Promise<GeneratedListing>   (one-shot, for tests / server-side use)
//   generateListingStream(input) -> AsyncIterable<string>       (streams section-delimited text for the UI; parsed by lib/listing-format.ts)

import Anthropic from "@anthropic-ai/sdk";
import type { GeneratedListing, ListingInput } from "@/lib/types";
import { finalizeListing, parseListingSections } from "@/lib/listing-format";
import { formatYearRange } from "@/lib/utils";

// Non-streaming entry: drain the stream into a buffer and parse.
export async function generateListing(input: ListingInput): Promise<GeneratedListing> {
  let buffer = "";
  for await (const chunk of generateListingStream(input)) {
    buffer += chunk;
  }
  return finalizeListing(parseListingSections(buffer));
}

// Streams the listing as section-delimited text chunks (see lib/listing-format.ts).
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

async function* generateWithClaudeStream(input: ListingInput): AsyncIterable<string> {
  const client = new Anthropic();
  const stream = client.messages.stream({
    model: claudeModel(),
    max_tokens: 600,
    messages: [{ role: "user", content: buildPrompt(input) }],
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

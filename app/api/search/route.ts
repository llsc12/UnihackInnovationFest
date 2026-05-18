// POST /api/search
// Body: { q: string }  — a natural-language query like "Ford Fiesta wing mirror 2016"
// Claude extracts structured fields, then runs the existing keyword search.
// Falls back to plain keyword search if no API key is set.
// Response: SearchResult[]

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { search } from "@/lib/search";
import type { SearchQuery } from "@/lib/types";

export async function POST(req: Request) {
  const { q } = (await req.json()) as { q?: string };

  if (!q?.trim()) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const structuredQuery = await extractQuery(q.trim());
  const results = search(structuredQuery);
  return NextResponse.json({ results, parsedQuery: structuredQuery });
}

async function extractQuery(q: string): Promise<SearchQuery> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { q };
  }

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `Extract structured search fields from this car parts query. Output ONLY valid JSON:
{ "make": string|null, "model": string|null, "year": number|null, "partType": string|null, "q": string }

- make: car manufacturer (e.g. "Ford", "Volkswagen") or null
- model: car model (e.g. "Fiesta", "Golf") or null
- year: specific year as number or null
- partType: type of part (e.g. "Headlight", "Wing mirror", "Alternator") or null
- q: the original query string (always include)

Query: "${q}"

JSON only, no markdown.`,
        },
      ],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = JSON.parse(text) as {
      make?: string | null;
      model?: string | null;
      year?: number | null;
      partType?: string | null;
      q?: string;
    };

    return {
      q: parsed.q ?? q,
      make: parsed.make ?? undefined,
      model: parsed.model ?? undefined,
      year: parsed.year ?? undefined,
      partType: parsed.partType ?? undefined,
    };
  } catch {
    return { q };
  }
}

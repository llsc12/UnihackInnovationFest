// Pure (no IO, no SDK) parser for the section-delimited listing format
// emitted by lib/listing-generator.ts. Shared between server and client so
// the streaming UI can parse partial output the same way the server does.
//
// Format:
//   ###TITLE
//   <line>
//   ###DESCRIPTION
//   <one or more lines>
//   ###CONDITION
//   <one or more lines>
//   ###COMPATIBILITY
//   <one or more lines>
//   ###KEYWORDS
//   comma, separated, words

import type { GeneratedListing } from "@/lib/types";

// During streaming, any field may be partial or missing.
// `activeField` is the section the last chunk was being written into — the UI uses
// this to put the typewriter cursor on the right box.
export interface PartialListing {
  title?: string;
  description?: string;
  conditionNotes?: string;
  compatibilitySummary?: string;
  keywordsRaw?: string;
  activeField?: keyof Omit<PartialListing, "activeField">;
}

const TAGS: Record<string, keyof Omit<PartialListing, "activeField">> = {
  TITLE: "title",
  DESCRIPTION: "description",
  CONDITION: "conditionNotes",
  COMPATIBILITY: "compatibilitySummary",
  KEYWORDS: "keywordsRaw",
};

export function parseListingSections(buffer: string): PartialListing {
  const result: PartialListing = {};
  // Split on lines that start with ###. The first split chunk (before any ###) is preamble — ignore.
  const parts = buffer.split(/(?:^|\n)###/);
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const newlineIdx = part.indexOf("\n");
    // No newline yet → tag itself is still being streamed; nothing to assign.
    if (newlineIdx === -1) continue;
    const tag = part.slice(0, newlineIdx).trim().toUpperCase();
    const value = part.slice(newlineIdx + 1).replace(/\s+$/, "");
    const key = TAGS[tag];
    if (!key) continue;
    result[key] = value;
    result.activeField = key;
  }
  return result;
}

export function finalizeListing(partial: PartialListing): GeneratedListing {
  return {
    title: partial.title?.trim() ?? "",
    description: partial.description?.trim() ?? "",
    conditionNotes: partial.conditionNotes?.trim() ?? "",
    compatibilitySummary: partial.compatibilitySummary?.trim() ?? "",
    keywords: (partial.keywordsRaw ?? "")
      .split(/[,\n]/)
      .map((k) => k.trim())
      .filter(Boolean),
  };
}

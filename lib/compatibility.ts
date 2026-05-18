// STREAM 2 — Compatibility Checker.
// Decides whether a buyer's vehicle fits a given listing.
//
// Algorithm (in order):
//   1. Make+model must appear in listing.fitsVehicles                  -> else "not-compatible"
//   2. Year inside the listing's yearFrom..yearTo envelope             -> tentatively "compatible"
//   3. Generation boundary check via compatibility-rules.json:
//        - If listing range and buyer year span different generations   -> downgrade to "maybe"
//   4. Year within ±1 of envelope (border year)                        -> "maybe"
//   5. Year well outside envelope                                       -> "not-compatible"
//   6. For "maybe" results (or no rule data): AI fallback via Claude
//      to give an informed, part-specific verdict.

import Anthropic from "@anthropic-ai/sdk";
import { getCompatibilityRules } from "@/lib/data";
import type {
  CompatibilityResult,
  Listing,
  Vehicle,
  VehicleRange,
} from "@/lib/types";

export async function checkCompatibility(
  listing: Listing,
  vehicle: Vehicle
): Promise<CompatibilityResult> {
  const reasons: string[] = [];

  const makeModelMatch = listing.fitsVehicles.find(
    (r) => eq(r.make, vehicle.make) && eq(r.model, vehicle.model)
  );

  if (!makeModelMatch) {
    return {
      verdict: "not-compatible",
      confidence: 0.95,
      reasons: [`Listing does not list ${vehicle.make} ${vehicle.model} as a compatible model.`],
    };
  }

  reasons.push(
    `${vehicle.make} ${vehicle.model} is listed as compatible (${makeModelMatch.yearFrom}–${makeModelMatch.yearTo}).`
  );

  if (!yearInside(vehicle.year, makeModelMatch)) {
    if (yearNear(vehicle.year, makeModelMatch, 1)) {
      const borderResult: CompatibilityResult = {
        verdict: "maybe",
        confidence: 0.5,
        reasons: [
          ...reasons,
          `Year ${vehicle.year} is just outside the listed range — verify fitment before buying.`,
        ],
      };
      return aiFallback(listing, vehicle, borderResult);
    }
    return {
      verdict: "not-compatible",
      confidence: 0.85,
      reasons: [
        ...reasons,
        `Year ${vehicle.year} is well outside ${makeModelMatch.yearFrom}–${makeModelMatch.yearTo}.`,
      ],
    };
  }

  // Year is inside the range — check for generation boundary crossings.
  const rules = await getCompatibilityRules();
  const generationResult = checkGenerationBoundary(vehicle, makeModelMatch, reasons, rules);
  if (generationResult.verdict === "maybe") {
    return aiFallback(listing, vehicle, generationResult);
  }
  return generationResult;
}

// Checks whether the listing's year range and the buyer's year sit in the same
// generation. Downgrades to "maybe" if they differ.
function checkGenerationBoundary(
  vehicle: Vehicle,
  range: VehicleRange,
  reasons: string[],
  rules: Record<string, import("@/lib/data").CompatibilityRule[]>
): CompatibilityResult {
  const key = `${vehicle.make}|${vehicle.model}`;
  const generations = rules[key];

  if (!generations?.length) {
    // No generation data — accept at face value.
    return {
      verdict: "compatible",
      confidence: 0.88,
      reasons: [...reasons, `Year ${vehicle.year} is within the listed range.`],
    };
  }

  const listingGen = generations.find(
    (g) => range.yearFrom >= g.yearFrom && range.yearTo <= g.yearTo
  );
  const vehicleGen = generations.find(
    (g) => vehicle.year >= g.yearFrom && vehicle.year <= g.yearTo
  );

  if (listingGen && vehicleGen && listingGen.generation !== vehicleGen.generation) {
    const note = listingGen.notes ? ` (${listingGen.notes})` : "";
    return {
      verdict: "maybe",
      confidence: 0.45,
      reasons: [
        ...reasons,
        `Listing is for ${listingGen.generation}${note}, but your ${vehicle.year} ${vehicle.make} ${vehicle.model} is ${vehicleGen.generation} — generations differ, verify part number before buying.`,
      ],
    };
  }

  if (listingGen) {
    const note = listingGen.notes ? ` Note: ${listingGen.notes}.` : "";
    return {
      verdict: "compatible",
      confidence: 0.92,
      reasons: [
        ...reasons,
        `Both listing and your vehicle are ${listingGen.generation} generation.${note}`,
      ],
    };
  }

  return {
    verdict: "compatible",
    confidence: 0.85,
    reasons: [...reasons, `Year ${vehicle.year} is within the listed range.`],
  };
}

// Calls Claude to give a more informed verdict for ambiguous "maybe" cases.
// Returns the rule-based result unchanged if no API key is set or Claude fails.
async function aiFallback(
  listing: Listing,
  vehicle: Vehicle,
  ruleResult: CompatibilityResult
): Promise<CompatibilityResult> {
  if (!process.env.ANTHROPIC_API_KEY) return ruleResult;

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are an automotive parts compatibility expert.

Part listing:
- Part type: ${listing.input.partType}
- Listed for: ${listing.input.make} ${listing.input.model} ${listing.input.yearFrom}–${listing.input.yearTo}${listing.input.partNumber ? `\n- Part number: ${listing.input.partNumber}` : ""}

Buyer's vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}

Initial assessment: ${ruleResult.verdict}
Reasons so far: ${ruleResult.reasons.join("; ")}

Give a definitive compatibility verdict. Output ONLY valid JSON:
{ "verdict": "compatible"|"maybe"|"not-compatible", "confidence": number, "reasons": string[] }

- confidence is 0.0–1.0
- reasons is an array of 1–3 concise human-readable strings
- Consider generation changes, facelifts, and platform differences
- JSON only, no markdown.`,
        },
      ],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = JSON.parse(text) as CompatibilityResult;
    if (parsed.verdict && Array.isArray(parsed.reasons)) return parsed;
  } catch {
    // Fall through to rule-based result
  }

  return ruleResult;
}

function eq(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function yearInside(year: number, r: VehicleRange) {
  return year >= r.yearFrom && year <= r.yearTo;
}

function yearNear(year: number, r: VehicleRange, slack: number) {
  return year >= r.yearFrom - slack && year <= r.yearTo + slack;
}

// STREAM 2 — Compatibility Checker.
// Decides whether a buyer's vehicle fits a given listing.
//
// Current algorithm (baseline — improve me):
//   1. Exact make+model match against listing.fitsVehicles  -> required
//   2. Year inside listing's yearFrom..yearTo                -> "compatible"
//   3. Year within +/-1 of envelope                          -> "maybe"
//   4. Make/model match but year way off                     -> "not-compatible"
//   5. No make/model match                                   -> "not-compatible"
//
// TODO(stream-2):
//   - Use lib/data.ts getCompatibilityRules() to detect generation boundaries
//     (e.g. Mk7 vs Mk8 Golf) and downgrade to "maybe" across a facelift year.
//   - Factor in part number when present.
//   - Return per-rule explanations, not just the final verdict.

import type {
  CompatibilityResult,
  Listing,
  Vehicle,
  VehicleRange,
} from "@/lib/types";

export function checkCompatibility(
  listing: Listing,
  vehicle: Vehicle
): CompatibilityResult {
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
    `${vehicle.make} ${vehicle.model} is listed as compatible (${makeModelMatch.yearFrom}-${makeModelMatch.yearTo}).`
  );

  if (yearInside(vehicle.year, makeModelMatch)) {
    return {
      verdict: "compatible",
      confidence: 0.92,
      reasons: [
        ...reasons,
        `Year ${vehicle.year} is inside the listed range ${makeModelMatch.yearFrom}-${makeModelMatch.yearTo}.`,
      ],
    };
  }

  if (yearNear(vehicle.year, makeModelMatch, 1)) {
    return {
      verdict: "maybe",
      confidence: 0.55,
      reasons: [
        ...reasons,
        `Year ${vehicle.year} is just outside the listed range — check generation/facelift notes before buying.`,
      ],
    };
  }

  return {
    verdict: "not-compatible",
    confidence: 0.85,
    reasons: [
      ...reasons,
      `Year ${vehicle.year} is well outside ${makeModelMatch.yearFrom}-${makeModelMatch.yearTo}.`,
    ],
  };
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

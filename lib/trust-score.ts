// STREAM 3 — Trust Score.
// Scores a listing 0-100 based on completeness, seller signals, and listing quality.
//
// Current algorithm (baseline — tune me):
//   Each signal has a weight. Sum of passed weights = score.
//   Weights add to 100.
//
// TODO(stream-3):
//   - Detect duplicate/stolen images (out of scope for hackathon? mock it).
//   - Flag suspiciously low prices vs comparable listings.
//   - Penalise vague descriptions (length / banned-phrase list).
//   - Return per-signal explanations for the UI.

import type { Listing, TrustScoreResult, TrustSignal } from "@/lib/types";

const SIGNALS: Array<{
  key: string;
  label: string;
  weight: number;
  test: (l: Listing) => boolean;
}> = [
  {
    key: "part_number",
    label: "Part number included",
    weight: 20,
    test: (l) => !!l.input.partNumber && l.input.partNumber.trim().length >= 4,
  },
  {
    key: "seller_verified",
    label: "Seller is verified",
    weight: 20,
    test: (l) => l.seller.verified === true,
  },
  {
    key: "multiple_images",
    label: "Two or more images",
    weight: 15,
    test: (l) => (l.input.images?.length ?? 0) >= 2,
  },
  {
    key: "return_policy",
    label: "Has a return policy",
    weight: 15,
    test: (l) => l.input.hasReturnPolicy === true,
  },
  {
    key: "condition_notes",
    label: "Detailed condition notes",
    weight: 10,
    test: (l) => (l.input.notes?.length ?? 0) >= 20,
  },
  {
    key: "compat_envelope",
    label: "Explicit compatible vehicles",
    weight: 10,
    test: (l) => l.fitsVehicles.length >= 1,
  },
  {
    key: "seller_reviews",
    label: "Seller has ≥ 50 reviews",
    weight: 5,
    test: (l) => (l.seller.reviewCount ?? 0) >= 50,
  },
  {
    key: "price_set",
    label: "Price is listed",
    weight: 5,
    test: (l) => typeof l.input.price === "number" && l.input.price > 0,
  },
];

export function computeTrustScore(listing: Listing): TrustScoreResult {
  const signals: TrustSignal[] = SIGNALS.map((s) => ({
    key: s.key,
    label: s.label,
    weight: s.weight,
    passed: s.test(listing),
  }));

  const score = signals.reduce((sum, s) => sum + (s.passed ? s.weight : 0), 0);
  const band = score >= 75 ? "high" : score >= 50 ? "medium" : "low";

  return { score, band, signals };
}

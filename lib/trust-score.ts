// STREAM 3 — Trust Score.
// Scores a listing 0-100 based on completeness, seller signals, and listing quality.
//
// Signals are either binary (pass/fail) or graduated (partial points).
// Weights sum to 100.

import type { Listing, TrustScoreResult, TrustSignal } from "@/lib/types";

type BinarySignal = {
  key: string;
  label: string;
  weight: number;
  kind: "binary";
  test: (l: Listing) => boolean;
};

type GraduatedSignal = {
  key: string;
  label: string;
  weight: number;
  kind: "graduated";
  score: (l: Listing) => number; // returns 0..weight
};

type Signal = BinarySignal | GraduatedSignal;

const SIGNALS: Signal[] = [
  {
    key: "part_number",
    label: "Part number included",
    weight: 12,
    kind: "binary",
    test: (l) => !!l.input.partNumber && l.input.partNumber.trim().length >= 4,
  },
  {
    key: "seller_verified",
    label: "Seller is verified",
    weight: 12,
    kind: "binary",
    test: (l) => l.seller.verified === true,
  },
  {
    key: "image_count",
    label: "Images provided",
    weight: 12,
    kind: "graduated",
    score: (l) => {
      const n = l.input.images?.length ?? 0;
      if (n >= 3) return 12;
      if (n === 2) return 8;
      if (n === 1) return 4;
      return 0;
    },
  },
  {
    key: "return_policy",
    label: "Has a return policy",
    weight: 8,
    kind: "binary",
    test: (l) => l.input.hasReturnPolicy === true,
  },
  {
    key: "return_policy_details",
    label: "Return policy details provided",
    weight: 6,
    kind: "binary",
    test: (l) => !!l.input.returnPolicyDetails && l.input.returnPolicyDetails.trim().length > 0,
  },
  {
    key: "condition_notes",
    label: "Detailed condition notes",
    weight: 10,
    kind: "graduated",
    score: (l) => {
      const len = l.input.notes?.trim().length ?? 0;
      if (len >= 60) return 10;
      if (len >= 20) return 5;
      return 0;
    },
  },
  {
    key: "compat_envelope",
    label: "Explicit compatible vehicles",
    weight: 10,
    kind: "binary",
    test: (l) => l.fitsVehicles.length >= 1,
  },
  {
    key: "postage_info",
    label: "Postage info provided",
    weight: 7,
    kind: "binary",
    test: (l) => !!l.input.postageInfo && l.input.postageInfo.trim().length > 0,
  },
  {
    key: "part_origin",
    label: "Part origin known (OEM/aftermarket)",
    weight: 6,
    kind: "binary",
    test: (l) => l.input.partOrigin !== undefined && l.input.partOrigin !== "unknown",
  },
  {
    key: "account_age",
    label: "Established seller account",
    weight: 7,
    kind: "graduated",
    score: (l) => {
      if (!l.seller.memberSince) return 0;
      const ageMs = Date.now() - new Date(l.seller.memberSince).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays >= 30) return 7;
      if (ageDays >= 7) return 4;
      return 0;
    },
  },
  {
    key: "seller_reviews",
    label: "Seller has reviews",
    weight: 5,
    kind: "graduated",
    score: (l) => {
      const n = l.seller.reviewCount ?? 0;
      if (n >= 50) return 5;
      if (n >= 10) return 3;
      if (n >= 1) return 1;
      return 0;
    },
  },
  {
    key: "price_set",
    label: "Price is listed",
    weight: 5,
    kind: "binary",
    test: (l) => typeof l.input.price === "number" && l.input.price > 0,
  },
];

export function computeTrustScore(listing: Listing): TrustScoreResult {
  const signals: TrustSignal[] = SIGNALS.map((s) => {
    const earned =
      s.kind === "binary"
        ? s.test(listing)
          ? s.weight
          : 0
        : s.score(listing);

    return {
      key: s.key,
      label: s.label,
      weight: s.weight,
      passed: earned >= s.weight,
      partial: earned > 0 && earned < s.weight,
    };
  });

  const score = Math.round(
    SIGNALS.reduce((sum, s, i) => {
      const earned =
        s.kind === "binary"
          ? signals[i].passed
            ? s.weight
            : 0
          : (s as GraduatedSignal).score(listing);
      return sum + earned;
    }, 0),
  );

  const band = score >= 75 ? "high" : score >= 50 ? "medium" : "low";
  return { score, band, signals };
}

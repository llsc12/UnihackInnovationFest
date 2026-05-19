// Price anomaly detection.
// Compares a listing's price against the distribution of prices for the same
// part type across all listings. Flags suspiciously low or high prices.

import { createServerClient } from "@/lib/supabase";
import type { Listing } from "@/lib/types";

export interface PriceStats {
  median: number;
  p25: number;
  p75: number;
  count: number;
}

export interface PriceAnomalyResult {
  flag: boolean;
  reason: string | null;
  stats: PriceStats | null;
}

// Thresholds relative to the IQR fence (Tukey method).
// Price is anomalous if it falls below p25 - 1.5*IQR  OR  above p75 + 3*IQR.
// The upper fence is looser (high prices are less likely to be scams).
const LOWER_FENCE_MULTIPLIER = 1.5;
const UPPER_FENCE_MULTIPLIER = 3.0;
const MIN_SAMPLE_SIZE = 3; // don't flag if fewer than 3 comparable listings

function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export async function getPriceStats(partType: string): Promise<PriceStats | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("price")
    .ilike("part_type", partType)
    .not("price", "is", null)
    .gt("price", 0);

  if (error || !data || data.length < MIN_SAMPLE_SIZE) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sorted = (data as any[]).map((r) => Number(r.price)).sort((a, b) => a - b);
  return {
    median: percentile(sorted, 50),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
    count: sorted.length,
  };
}

export async function detectPriceAnomaly(listing: Listing): Promise<PriceAnomalyResult> {
  const price = listing.input.price;
  if (!price || price <= 0) {
    return { flag: false, reason: null, stats: null };
  }

  const stats = await getPriceStats(listing.input.partType);
  if (!stats) {
    return { flag: false, reason: null, stats: null };
  }

  const iqr = stats.p75 - stats.p25;
  const lowerFence = stats.p25 - LOWER_FENCE_MULTIPLIER * iqr;
  const upperFence = stats.p75 + UPPER_FENCE_MULTIPLIER * iqr;

  if (price < lowerFence) {
    return {
      flag: true,
      reason: `Price (£${price}) is significantly below the typical range for ${listing.input.partType} (median £${Math.round(stats.median)}). Verify this listing carefully.`,
      stats,
    };
  }

  if (price > upperFence) {
    return {
      flag: true,
      reason: `Price (£${price}) is significantly above the typical range for ${listing.input.partType} (median £${Math.round(stats.median)}).`,
      stats,
    };
  }

  return { flag: false, reason: null, stats };
}

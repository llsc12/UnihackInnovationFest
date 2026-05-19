// STREAM 4 — Search & Discovery.
// Relevance scoring blended with trust score so high-quality listings
// surface above low-quality ones when relevance is equal.

import { getAllListings } from "@/lib/data";
import { computeTrustScore } from "@/lib/trust-score";
import type { Listing, SearchQuery, SearchResult } from "@/lib/types";

// Trust contributes up to TRUST_WEIGHT points on top of the relevance score.
// Keeps trust as a meaningful tiebreaker without letting it override a
// clearly more relevant result.
const TRUST_WEIGHT = 2.0;

export async function search(query: SearchQuery): Promise<SearchResult[]> {
  const listings = await getAllListings();
  const q = (query.q ?? "").trim().toLowerCase();

  const results: SearchResult[] = [];

  for (const listing of listings) {
    let score = 0;

    if (query.make && eq(listing.input.make, query.make)) score += 3;
    if (query.model && eq(listing.input.model, query.model)) score += 3;
    if (query.partType && matches(listing.input.partType, query.partType)) score += 2;

    if (query.year) {
      const fits = listing.fitsVehicles.some(
        (r) => query.year! >= r.yearFrom && query.year! <= r.yearTo
      );
      if (fits) score += 2;
    }

    if (q) {
      const haystack = listingHaystack(listing);
      const terms = q.split(/\s+/).filter(Boolean);
      for (const term of terms) {
        if (haystack.includes(term)) score += 1;
      }
      // Bonus for keyword overlap with AI-generated keywords
      for (const kw of listing.generated.keywords) {
        if (terms.some((t) => kw.toLowerCase().includes(t))) score += 0.5;
      }
    }

    // Hard filters — exclude non-matching listings entirely
    if (query.condition && listing.input.condition !== query.condition) continue;
    if (query.priceMin != null && (listing.input.price == null || listing.input.price < query.priceMin)) continue;
    if (query.priceMax != null && (listing.input.price == null || listing.input.price > query.priceMax)) continue;
    if (query.verifiedOnly && !listing.seller.verified) continue;

    if (score > 0 || (!q && !query.make && !query.model && !query.partType && !query.year)) {
      const trust = computeTrustScore(listing);
      const trustBonus = (trust.score / 100) * TRUST_WEIGHT;
      results.push({ listing, score: score + trustBonus });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

function listingHaystack(l: Listing): string {
  return [
    l.input.make,
    l.input.model,
    l.input.partType,
    l.input.partNumber ?? "",
    l.input.notes ?? "",
    l.generated.title,
    l.generated.description,
    ...l.generated.keywords,
  ]
    .join(" ")
    .toLowerCase();
}

function eq(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function matches(a: string, b: string) {
  return a.toLowerCase().includes(b.toLowerCase());
}

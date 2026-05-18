// STREAM 4 — Search & Discovery.
// Naive substring + field-match search over listings.
//
// TODO(stream-4):
//   - Score keyword overlap (input.keywords + generated.keywords).
//   - Support partial year matches ("2016" -> includes any listing covering 2016).
//   - Add filters: priceMin/priceMax, condition, sellerVerified.
//   - Order results by relevance + trust score blend.

import { getAllListings } from "@/lib/data";
import type { Listing, SearchQuery, SearchResult } from "@/lib/types";

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
      for (const term of q.split(/\s+/).filter(Boolean)) {
        if (haystack.includes(term)) score += 1;
      }
    }

    if (score > 0 || (!q && !query.make && !query.model && !query.partType && !query.year)) {
      results.push({ listing, score });
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

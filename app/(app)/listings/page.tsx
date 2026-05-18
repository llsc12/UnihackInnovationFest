// STREAM 4 — search results / browse page.
// AutoReviver-branded grid (see app/autoreviver.css `.browse-*` rules).
export const dynamic = "force-dynamic";

import { search } from "@/lib/search";
import { SearchBar } from "./search-bar";

interface PageProps {
  searchParams: Promise<{ q?: string; make?: string; model?: string; year?: string; partType?: string }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const results = await search({
    q: params.q,
    make: params.make,
    model: params.model,
    year: params.year ? Number(params.year) : undefined,
    partType: params.partType,
  });

  return (
    <div className="browse-page">
      <header className="browse-hero">
        <p className="eyebrow">✦ Used car parts marketplace</p>
        <h1>Browse parts</h1>
        <p className="browse-count">
          {results.length} listing{results.length === 1 ? "" : "s"}
          {params.q ? ` matching "${params.q}"` : ""}
        </p>
      </header>

      <form className="browse-search" action="/listings" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search e.g. 'Ford Fiesta wing mirror 2016'"
        />
        <button type="submit">Search</button>
      </form>

      {results.length === 0 ? (
        <p className="browse-empty">
          No parts match{params.q ? <> &ldquo;{params.q}&rdquo;</> : ""}. Try a different search.
        </p>
      ) : (
        <div className="browse-grid">
          {results.map((r) => (
            <ListingCard key={r.listing.id} listing={r.listing} />
          ))}
        </div>
      )}
    </div>
  );
}

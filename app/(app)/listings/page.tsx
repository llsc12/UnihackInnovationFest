// STREAM 4 — search results / browse page.
// AutoReviver-branded grid (see app/autoreviver.css `.browse-*` rules).
export const dynamic = "force-dynamic";

import { search } from "@/lib/search";
import { ListingCard } from "@/components/listing-card";
import type { Condition } from "@/lib/types";

const CONDITIONS: { value: Condition; label: string }[] = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "for-parts", label: "For parts" },
];

interface PageProps {
  searchParams: Promise<{
    q?: string;
    make?: string;
    model?: string;
    year?: string;
    partType?: string;
    condition?: string;
    priceMin?: string;
    priceMax?: string;
    verifiedOnly?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const results = await search({
    q: params.q,
    make: params.make,
    model: params.model,
    year: params.year ? Number(params.year) : undefined,
    partType: params.partType,
    condition: (params.condition as Condition) || undefined,
    priceMin: params.priceMin ? Number(params.priceMin) : undefined,
    priceMax: params.priceMax ? Number(params.priceMax) : undefined,
    verifiedOnly: params.verifiedOnly === "1",
  });

  const hasFilters = !!(params.condition || params.priceMin || params.priceMax || params.verifiedOnly);

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

      {/* Filter bar — submitted as GET params alongside the search query */}
      <form className="browse-filters" action="/listings" method="get">
        {params.q && <input type="hidden" name="q" value={params.q} />}

        <select name="condition" defaultValue={params.condition ?? ""} className="browse-filter-select">
          <option value="">All conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <div className="browse-filter-price">
          <span className="browse-filter-label">£</span>
          <input
            type="number"
            name="priceMin"
            defaultValue={params.priceMin ?? ""}
            placeholder="Min"
            min={0}
            className="browse-filter-input"
          />
          <span className="browse-filter-sep">–</span>
          <input
            type="number"
            name="priceMax"
            defaultValue={params.priceMax ?? ""}
            placeholder="Max"
            min={0}
            className="browse-filter-input"
          />
        </div>

        <label className="browse-filter-check">
          <input
            type="checkbox"
            name="verifiedOnly"
            value="1"
            defaultChecked={params.verifiedOnly === "1"}
          />
          Verified sellers only
        </label>

        <button type="submit" className="browse-filter-apply">Apply</button>

        {hasFilters && (
          <a href={params.q ? `/listings?q=${encodeURIComponent(params.q)}` : "/listings"} className="browse-filter-clear">
            Clear filters
          </a>
        )}
      </form>

      {results.length === 0 ? (
        <p className="browse-empty">
          No parts match{params.q ? ` "${params.q}"` : ""}. Try adjusting your search or filters.
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

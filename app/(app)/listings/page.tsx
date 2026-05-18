// STREAM 4 — search results / browse page.
// TODO(stream-4): wire up the filters in the URL (?q=&make=&model=&year=&partType=).

import { ListingCard } from "@/components/listing-card";
import { search } from "@/lib/search";

interface PageProps {
  searchParams: Promise<{ q?: string; make?: string; model?: string; year?: string; partType?: string }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const results = search({
    q: params.q,
    make: params.make,
    model: params.model,
    year: params.year ? Number(params.year) : undefined,
    partType: params.partType,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Browse parts</h1>
        <p className="text-muted-foreground">
          {results.length} listing{results.length === 1 ? "" : "s"}
          {params.q ? ` matching "${params.q}"` : ""}
        </p>
      </header>

      {/* TODO(stream-4): replace this with a real <SearchFilters /> client component */}
      <form className="flex flex-wrap gap-2" action="/listings" method="get">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search e.g. 'Ford Fiesta wing mirror 2016'"
          className="flex-1 min-w-[260px] rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <ListingCard key={r.listing.id} listing={r.listing} />
        ))}
      </div>
    </div>
  );
}

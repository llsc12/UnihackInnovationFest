// STREAM 4 — search results / browse page.
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
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Browse parts</h1>
        <p className="text-muted-foreground">
          Describe what you need in plain English — make, model, year, and part type.
        </p>
      </header>

      <SearchBar initialQuery={params.q ?? ""} initialResults={results} />
    </div>
  );
}

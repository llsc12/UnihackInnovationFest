"use client";

// Client-side search bar that POSTs to /api/search for natural-language queries.
// Falls back to a plain GET ?q= if JS is disabled (the form action still works).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing-card";
import type { SearchResult } from "@/lib/types";

interface SearchBarProps {
  initialQuery: string;
  initialResults: SearchResult[];
}

export function SearchBar({ initialQuery, initialResults }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [parsedMake, setParsedMake] = useState<string | null>(null);
  const [parsedModel, setParsedModel] = useState<string | null>(null);
  const [parsedYear, setParsedYear] = useState<number | null>(null);
  const [parsedPartType, setParsedPartType] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      router.push("/listings");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: query }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json() as {
          results: SearchResult[];
          parsedQuery: { make?: string; model?: string; year?: number; partType?: string };
        };
        setResults(data.results);
        setParsedMake(data.parsedQuery.make ?? null);
        setParsedModel(data.parsedQuery.model ?? null);
        setParsedYear(data.parsedQuery.year ?? null);
        setParsedPartType(data.parsedQuery.partType ?? null);
      } catch {
        // On error fall back to plain URL search
        router.push(`/listings?q=${encodeURIComponent(query)}`);
      }
    });
  }

  const hasParsed = parsedMake || parsedModel || parsedYear || parsedPartType;

  return (
    <div className="space-y-6">
      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'Ford Fiesta wing mirror 2016' or 'Golf headlight'"
          className="flex-1 min-w-[260px] rounded-md border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Searching…" : "Search"}
        </Button>
      </form>

      {hasParsed && (
        <p className="text-xs text-muted-foreground">
          Understood:{" "}
          {[
            parsedMake,
            parsedModel,
            parsedYear?.toString(),
            parsedPartType,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <p className="text-muted-foreground text-sm">
        {results.length} listing{results.length === 1 ? "" : "s"}
        {query ? ` matching "${query}"` : ""}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((r) => (
          <ListingCard key={r.listing.id} listing={r.listing} />
        ))}
      </div>
    </div>
  );
}

// STREAM 4 owns this page (home + entry to search/discovery).
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { getAllListings } from "@/lib/data";

export default async function HomePage() {
  const featured = (await getAllListings()).slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Smarter used car parts.
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          AutoReviver helps sellers write better listings and helps buyers check whether a
          part fits — before they pay.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/listings">Browse parts</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/sell">List a part</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>
    </div>
  );
}

// /saved — the user's saved listings. Auth-gated.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { getSavedListings } from "@/lib/data";
import { ListingCard } from "@/components/listing-card";

export default async function SavedPage() {
  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="browse-page">
        <header className="browse-hero">
          <p className="eyebrow">✦ Your collection</p>
          <h1>Saved parts</h1>
          <p className="browse-count">Sign in to save parts you&apos;re interested in.</p>
        </header>
        <p className="browse-empty">
          <Link href="/login" style={{ color: "var(--ar-red)", fontWeight: 800 }}>
            Log in →
          </Link>{" "}
          or{" "}
          <Link href="/login?mode=signup" style={{ color: "var(--ar-red)", fontWeight: 800 }}>
            create an account
          </Link>{" "}
          to start saving listings.
        </p>
      </div>
    );
  }

  const listings = await getSavedListings(user.id);

  return (
    <div className="browse-page">
      <header className="browse-hero">
        <p className="eyebrow">✦ Your collection</p>
        <h1>Saved parts</h1>
        <p className="browse-count">
          {listings.length} listing{listings.length === 1 ? "" : "s"} saved
        </p>
      </header>

      {listings.length === 0 ? (
        <p className="browse-empty">
          Nothing saved yet. <Link href="/listings" style={{ color: "var(--ar-red)", fontWeight: 800 }}>Browse parts →</Link>
        </p>
      ) : (
        <div className="browse-grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

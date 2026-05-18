// /discover — part-swipe demo page. Uses the marketing layout (dark header).
// Pulls real listings from Supabase via lib/data.ts so the deck reflects
// what's actually on the platform, and seeds the swiper with the user's
// existing saves so the Like state persists across visits.
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { createSessionServerClient } from "@/lib/supabase";
import { getAllListings, getSavedListingIds } from "@/lib/data";
import { PartSwiper } from "./part-swiper";

export default async function DiscoverPage() {
  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const [listings, initialSavedIds] = await Promise.all([
    getAllListings(),
    user ? getSavedListingIds(user.id) : Promise.resolve<string[]>([]),
  ]);

  return (
    <main className="swipe-page">
      <section className="swipe-hero">
        <p className="eyebrow">✦ AI-powered car part discovery</p>
        <h1>Swipe through trusted used car parts.</h1>
        <p>
          Browse verified parts one at a time, compare compatibility, check full
          stats, and like the parts you want to save.
        </p>
      </section>

      <PartSwiper
        listings={listings}
        initialSavedIds={initialSavedIds}
        loggedIn={user != null}
      />
    </main>
  );
}

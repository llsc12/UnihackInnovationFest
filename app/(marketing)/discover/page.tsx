// /discover — part-swipe demo page. Uses the marketing layout (dark header).
// Pulls real listings from lib/data.ts so the deck reflects what's actually on the platform.

import { PartSwiper } from "./part-swiper";
import { getAllListings } from "@/lib/data";

export default function DiscoverPage() {
  const listings = getAllListings();

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

      <PartSwiper listings={listings} />
    </main>
  );
}

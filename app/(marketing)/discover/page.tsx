// /discover — part-swipe demo page. Uses the marketing layout (dark header).

import { PartSwiper } from "./part-swiper";

export default function DiscoverPage() {
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

      <PartSwiper />
    </main>
  );
}

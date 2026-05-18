# Work streams

Five feature verticals. Each owner is end-to-end on their slice — page, API
route, lib module, and any data they need. Shared types live in
[`lib/types.ts`](../lib/types.ts) — coordinate before changing them.

| # | Stream | Owner | Pages | API | Library | Data |
|---|--------|-------|-------|-----|---------|------|
| 1 | Listing Generator | Lee | [`app/sell/`](../app/sell) | [`app/api/generate-listing/`](../app/api/generate-listing) | [`lib/listing-generator.ts`](../lib/listing-generator.ts) | — |
| 2 | Compatibility Checker | _TBD_ | [`app/listings/[id]/compatibility-checker.tsx`](../app/listings/[id]/compatibility-checker.tsx) | [`app/api/compatibility/`](../app/api/compatibility) | [`lib/compatibility.ts`](../lib/compatibility.ts) | [`data/compatibility-rules.json`](../data/compatibility-rules.json) |
| 3 | Trust Score + Detail Page | _TBD_ | [`app/listings/[id]/page.tsx`](../app/listings/[id]/page.tsx) | — | [`lib/trust-score.ts`](../lib/trust-score.ts) | — |
| 4 | Search / Discovery | _TBD_ | [`app/page.tsx`](../app/page.tsx), [`app/listings/page.tsx`](../app/listings/page.tsx) | [`app/api/listings/`](../app/api/listings) | [`lib/search.ts`](../lib/search.ts) | — |
| 5 | Data + Design System | _TBD_ | — (cross-cutting) | — | [`lib/data.ts`](../lib/data.ts), [`lib/utils.ts`](../lib/utils.ts) | [`data/listings.json`](../data/listings.json), [`data/vehicles.json`](../data/vehicles.json) |

Fill in your name next to your stream in this table.

---

## What each stream owns

### Stream 1 — Listing Generator
The "magic" feature. Seller fills a form, gets a clean listing back.
- Polish the seller form (validation, image upload, streaming response).
- Improve the Claude prompt in [`lib/listing-generator.ts`](../lib/listing-generator.ts).
- Tune the template fallback so it looks good even without an API key.
- Persist generated listings (talk to Stream 5).

### Stream 2 — Compatibility Checker
Buyer-facing trust feature.
- Replace text inputs in [`compatibility-checker.tsx`](../app/listings/[id]/compatibility-checker.tsx) with cascading dropdowns sourced from [`data/vehicles.json`](../data/vehicles.json).
- Improve the algorithm in [`lib/compatibility.ts`](../lib/compatibility.ts) — generation/facelift handling, part-number tie-breakers.
- Add a "common reasons it might not fit" panel.

### Stream 3 — Trust Score + Listing Detail
- Tune signal weights in [`lib/trust-score.ts`](../lib/trust-score.ts).
- Polish the listing detail page — image gallery, seller card, trust-signal explanations.
- Add "report this listing" affordance.

### Stream 4 — Search & Discovery
- Build a real filter bar (client component) on `/listings`.
- Improve relevance scoring in [`lib/search.ts`](../lib/search.ts) — keyword overlap, trust-score blend.
- Empty states, "no results" suggestions, sort options.
- The home page hero / featured section.

### Stream 5 — Data + Shared UI + Polish
The glue.
- Grow [`data/listings.json`](../data/listings.json) to ~15–20 varied entries for a good demo.
- Add the rest of the shadcn primitives we'll need (Select, Dialog, Toast) — drop them into [`components/ui/`](../components/ui).
- Loading states, error boundaries, dark mode toggle.
- Deployment: pick Vercel or Netlify, wire up env vars.
- Final demo polish + recording.

---

## How to start

```bash
npm install
cp .env.example .env.local   # optional; works without an API key
npm run dev
```

Open http://localhost:3000.

The app works fully without `ANTHROPIC_API_KEY` — listing generation falls back to deterministic templates. Add the key when you want to demo the AI path.

## Rules of engagement

- **Branch per stream**: `stream-1-listing-gen`, `stream-2-compat`, etc. PRs into `main`.
- **Don't change shared types** (`lib/types.ts`) without telling the channel.
- **Don't touch another stream's lib module** without asking.
- **Shared UI primitives** (`components/ui/*`) — Stream 5 owns these. Anyone can add a new one but coordinate to avoid duplicates.
- Run `npm run typecheck` before pushing.

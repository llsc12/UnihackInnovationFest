# Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  Browser (React Server + Client components, Tailwind, shadcn) │
└───────────────────────────────────────────────────────────────┘
                              │ fetch
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  Next.js App Router  (app/**)                                 │
│                                                               │
│  /                  Home + featured       (Stream 4)          │
│  /listings          Search results        (Stream 4)          │
│  /listings/[id]     Detail + checker      (Stream 3 + 2)      │
│  /sell              Listing generator UI  (Stream 1)          │
│                                                               │
│  /api/generate-listing   POST  →  GeneratedListing (Stream 1) │
│  /api/compatibility      POST  →  CompatibilityResult (S 2)   │
│  /api/listings           GET   →  SearchResult[]    (Stream 4)│
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  lib/   (pure-ish functions, no IO except listing-generator)  │
│                                                               │
│  listing-generator.ts  ── Anthropic SDK  ──▶  Claude          │
│                       └──  template fallback                  │
│  compatibility.ts                                             │
│  trust-score.ts                                               │
│  search.ts                                                    │
│  data.ts  (reads JSON for now — swap to DB later)             │
│  types.ts (the contract between all streams)                  │
└───────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────────┐
│  data/*.json   (synthetic data — Stream 5)                    │
└───────────────────────────────────────────────────────────────┘
```

## Why this shape

- **Next.js API routes, no separate backend**: 24h hackathon, one deployable unit, one repo.
- **JSON files as the "DB"**: zero setup, demoable in minutes. `lib/data.ts` is the only place that knows where data comes from — swap it for SQLite/Postgres later without touching call sites.
- **Pure library functions**: every algorithm (compat, trust, search) is a single function with typed input and output. Easy to test, easy to reason about, easy to demo in isolation.
- **AI as opt-in**: `ANTHROPIC_API_KEY` toggles Claude vs template. Every teammate can develop end-to-end without an API key.

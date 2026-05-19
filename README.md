# AutoReviver

AutoReviver is an AI-powered used car parts platform designed to help sellers create better listings and help buyers check whether a part is compatible with their vehicle before purchasing.

The project was created for a 24-hour hackathon challenge focused on improving the used car parts marketplace.

---

## Contents

- [Project Overview](#project-overview)
- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [Demo Flow](#demo-flow)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)
- [Synthetic Data Notice](#synthetic-data-notice)
- [Compatibility Logic](#compatibility-logic)
- [Trust Score Logic](#trust-score-logic)
- [Team Contributions](#team-contributions)
- [Future Improvements](#future-improvements)

---

## Project Overview

The used car parts market can be difficult for both buyers and sellers.

Sellers often have useful parts available but may struggle to create clear, searchable, trustworthy listings. Buyers often struggle to know whether a part will actually fit their vehicle.

AutoReviver aims to solve this by providing a simple web application that supports:

- Smart listing generation
- Vehicle compatibility checking
- Trust scoring
- Search and discovery
- Seller profiles and saved listings

The goal is to reduce wrong purchases, improve listing quality, and make second-hand car parts easier to reuse.

---

## Problem

Buying used car parts online is often confusing because listings can be incomplete, badly written, or missing important details.

Common issues include:

- Missing part numbers
- Unclear vehicle compatibility
- Poor descriptions
- Lack of seller trust signals
- No clear return policy
- Difficult search experience
- Risk of buying the wrong part

This causes wasted time, wasted money, and unnecessary frustration for buyers and sellers.

---

## Solution

AutoReviver provides an intelligent layer for the used car parts market.

Instead of simply listing parts, the platform helps structure the information properly.

A seller can enter basic details about a part, and AutoReviver generates a cleaner listing. A buyer can enter their car details (or scan a VIN) and check whether the selected part is compatible. Each listing also receives a trust score to show how reliable or complete it appears.

---

## Key Features

### Smart Listing Generator

The seller enters simple information such as part type, vehicle make/model/year range, condition, part number, and any seller notes. AutoReviver then generates a professional listing including:

- Title
- Description
- Condition notes
- Compatibility summary
- Suggested keywords

Generation is streamed token-by-token from Anthropic's Claude so the seller sees the listing build in real time. If `ANTHROPIC_API_KEY` is not set the system falls back to a deterministic template so the flow remains demo-able without an API key.

Example output:

```txt
Genuine Volkswagen Golf Mk7 Left Headlight 2013-2017

Used genuine VW Golf Mk7 left headlight assembly in good working condition.
Suitable for compatible Golf Mk7 models between 2013 and 2017.
Minor cosmetic scratches present but does not affect function.
Please confirm part number before purchase.
```

### AI Image Analysis

Sellers can upload up to four photos of a part. Each image is sent to Claude Vision (`/api/analyse-image`), which extracts:

- Part type
- Condition estimate
- Visible part number (if any)
- Short notes about visible wear or features

The extracted fields auto-populate the listing form so the seller can edit-then-publish rather than start from scratch.

### Image Upload and Duplicate Detection

Images are stored in Supabase Storage under `listing-images/{userId}/{uuid}.{ext}` and served via public URL. Each upload also generates a SHA-256 fingerprint; if the same fingerprint has been seen before, the system flags the upload as a potential duplicate of an existing listing.

### Compatibility Checker

The buyer enters their vehicle (make / model / year, with cascading dropdowns derived from the vehicle catalogue) or scans a 17-character VIN via the NHTSA vPIC API. AutoReviver then matches the buyer's vehicle against the listing's fitment data and returns one of three verdicts:

- Compatible
- Maybe compatible
- Not compatible

Each result includes a confidence score (0-1) and a human-readable explanation. Ambiguous cases (border years, generation boundary crossings) fall through to an AI-assisted second opinion for a more nuanced verdict.

### Trust Score

Each listing receives a trust score out of 100, computed from signals including part number presence, multiple images, return policy, completeness of condition notes, pricing sanity, and seller verification status. The score is displayed alongside each listing and is intended as a quick visual cue of listing quality.

### Search and Discovery

The browse page (`/listings`) supports natural-language queries via the search bar. Queries are sent to Claude (`/api/search`) which extracts structured fields (make, model, year, part type) and falls back to plain keyword matching when no API key is configured. The browse page also offers conventional filters:

- Price range (min / max)
- Condition
- Verified-seller-only toggle

The marketing `/discover` page presents listings as a swipeable card stack — quick browsing for users not searching for something specific.

### Seller Profiles

Each seller has a public profile at `/sellers/[id]` showing their display name, listings count, and active listings. Sellers can choose between a `public` privacy mode (real name visible) and a `private` mode (username only). The profile data is held in a separate `profiles` table linked to the Supabase auth user.

### Account Management

- Email + password sign-up and sign-in via Supabase Auth (`/login`)
- Profile editing (display name, username, privacy mode)
- Password change (`/api/auth/change-password`)
- Account deletion (`/api/auth/delete-account`) which cascades through profile, listings, and saved-listings rows

### Saved Listings

Logged-in users can save listings by clicking the save icon on a listing card. The `/saved` page lists every saved listing in reverse-chronological save order. Saves are scoped per-user; signing out clears the visual state but preserves the saved set for the next sign-in.

---

## Demo Flow

The most representative end-to-end demo is:

1. Sign in as a seeded demo seller (`northside@autoreviver.demo` / `demo1234`).
2. Visit `/sell` and upload one or two photos of a part.
3. Click "Analyse with AI" to populate part type, condition, and part number from the image.
4. Fill the remaining fields and click "Generate listing" to stream the AI-written content.
5. Submit. The listing appears at `/listings/[id]`.
6. Sign out, visit `/listings`, search "VW Golf headlight 2016" and open the new listing.
7. Use the compatibility checker on the detail page — select make / model / year — and observe the verdict plus confidence score.
8. Open the seller link to view the seller's profile and their other listings.

---

## Tech Stack

**Front end**

- Next.js 15 (App Router, Server + Client Components)
- React 19
- TypeScript
- Tailwind CSS with shadcn-style primitives
- Custom CSS layer (`app/autoreviver.css`) for the marketing visual identity

**Back end**

- Next.js Route Handlers (`/app/api/...`)
- Anthropic SDK for Claude (listing generation, vision analysis, compatibility second-opinion, NL search extraction)
- NHTSA vPIC API for VIN decoding (free, no key required)

**Data**

- Supabase Postgres (self-hosted via Docker Compose)
- Supabase GoTrue for authentication
- Supabase PostgREST for the data API (used internally)
- Supabase Storage for uploaded images
- Kong as the API gateway

**Tooling**

- Docker Compose for the full local stack (Postgres + Auth + REST + Storage + Studio + app)
- ESLint (Next.js config)
- TypeScript strict mode

---

## Installation

### Prerequisites

- Docker Desktop (Windows / macOS) or Docker Engine + Compose plugin
- Node.js 18+ (only required if you want to run Next.js outside Docker for faster dev iteration)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd UnihackInnovationFest
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
   For local Docker Compose, the defaults in `.env.example` work as-is. If you want AI features (listing generation, image analysis, NL search, compatibility second opinion), add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   Without the key the app falls back to template-based listing generation and keyword-only search.

3. Start the stack:
   ```bash
   docker compose up -d
   ```
   On first boot Postgres runs every SQL migration under `supabase/migrations/` in order. This includes three seeded demo users (see [How to Use](#how-to-use)).

4. Open `http://localhost:3000`.

### Running Next.js outside Docker (faster dev loop)

For active development, run Supabase in Docker and Next.js on the host so you get hot reload:

```bash
docker compose stop app           # leave db / auth / rest / storage running
npm install
npm run dev                       # Next on http://localhost:3000
```

The `.env.local` should set `NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000` (Kong from the host) and leave `SUPABASE_URL` blank.

---

## How to Use

### Seeded demo accounts

Migration `007_seed_users.sql` creates three demo sellers. The password for all of them is **`demo1234`**.

| Email | Display name | Username |
|---|---|---|
| `northside@autoreviver.demo` | Northside Auto Salvage | `northside_auto` |
| `mikes@autoreviver.demo` | Mike Thompson | `mikes_parts` |
| `eurospare@autoreviver.demo` | EuroSpare Direct | `eurospare` |

You can also create a new account from the sign-up form at `/login?mode=signup`.

### Key routes

| Route | Purpose |
|---|---|
| `/` | Marketing landing page with embedded compatibility demo |
| `/listings` | Browse all listings with search and filters |
| `/listings/[id]` | Listing detail, image gallery, compatibility checker |
| `/sell` | Create a new listing (auth required) |
| `/saved` | Listings you have saved (auth required) |
| `/sellers/[id]` | A seller's public profile and their listings |
| `/discover` | Swipeable card-stack browsing |
| `/login` | Sign in / sign up |

---

## Project Structure

```
app/
  (app)/                    Authenticated app surfaces
    listings/               Browse + detail + edit
    login/                  Sign-in / sign-up
    saved/                  Saved listings
    sell/                   Listing creation flow
    sellers/[id]/           Public seller profile
  (marketing)/              Public marketing pages
    page.tsx                Landing
    discover/               Card-stack browser
    compat-demo.tsx         Embedded hero compatibility demo
  api/                      Route handlers
    analyse-image/          Claude Vision image analysis
    auth/                   Password change, account deletion
    compatibility/          Compatibility verdict
    generate-listing/       Streaming AI listing generator
    listings/               CRUD for listings
    profile/                Profile CRUD
    saves/                  Save / unsave a listing
    search/                 Natural-language search
    upload/                 Image upload to Supabase Storage
    vin/                    NHTSA VIN decoder
components/                 Shared React components + shadcn UI
lib/                        Pure-ish library code
  auth.ts                   Server-side user lookup
  compatibility.ts          Compatibility algorithm + AI fallback
  data.ts                   Supabase data access layer
  listing-generator.ts      Claude integration
  rate-limit.ts             In-memory rate limiter
  search.ts                 Keyword + scored search
  supabase.ts               Supabase client factories
  trust-score.ts            Trust scoring algorithm
  types.ts                  Shared type definitions
supabase/
  migrations/               SQL migrations applied at first DB boot
  kong.yml                  Kong API gateway config
docker-compose.yml          Full local stack definition
```

---

## Synthetic Data Notice

The compatibility rules, vehicle catalogue, and three seeded listings are **synthetic demo data**, not real OEM data. They are sufficient to show the platform working end-to-end and to demonstrate the compatibility algorithm but are not suitable for production use.

A production deployment would replace `data/compatibility-rules.json` and the seeded listings with a real fitment database such as TecDoc, plus a real vehicle database via DVLA / OEM feeds.

---

## Compatibility Logic

The algorithm (in `lib/compatibility.ts`) runs the following checks in order:

1. **Make and model match** — the listing's `fitsVehicles` array must contain the buyer's make + model. If not, the verdict is `not-compatible` (confidence 0.95).
2. **Year inside envelope** — the buyer's year must be inside the listing's `yearFrom..yearTo` range. If outside by more than one year, verdict is `not-compatible` (0.85).
3. **Border year (±1)** — if the year is exactly one year outside the range, verdict is downgraded to `maybe` (0.5) and routed to the AI fallback.
4. **Generation boundary check** — if the listing range and buyer's year fall in different generations (per `compatibility_rules` table), verdict is downgraded to `maybe` and routed to the AI fallback.
5. **AI fallback** — for any `maybe` result, Claude is asked to give a part-specific verdict using the listing's title, description, and condition notes alongside the structured inputs. The AI's verdict and reasoning are then returned to the user.
6. **Clean hit** — if make / model / year all match cleanly and no generation boundary is crossed, verdict is `compatible` (0.88).

---

## Trust Score Logic

The trust score (out of 100) is computed in `lib/trust-score.ts` from a weighted sum of signals. Each signal contributes its weight only if the corresponding fact is true:

| Signal | Weight |
|---|---|
| Part number present | 15 |
| Seller is verified | 15 |
| Two or more images attached | 12 |
| Return policy specified | 10 |
| Condition notes are complete | 10 |
| Price falls in a reasonable range for the part | 8 |
| Missing or suspicious info | negative |

The final score is banded into `low` (under 40), `medium` (40-74), or `high` (75+), with both the number and band rendered as a badge on each listing.

Note: a few of the signal heuristics (price-sanity comparison, suspicious-info detection) are simplified for the hackathon scope and have TODOs in `lib/trust-score.ts` to be extended with real reference data.

---

## Team Contributions

This project was built over 24 hours at the Unihack Innovation Fest. The work was split into five streams:

- **Stream 1 — Listing Generator**: seller form, AI streaming, template fallback
- **Stream 2 — Compatibility**: algorithm, AI fallback, cascading vehicle dropdowns, VIN decoder
- **Stream 3 — Trust + Listing Detail**: trust score, image gallery, save button
- **Stream 4 — Search and Discovery**: NL search, browse filters, discover card stack
- **Stream 5 — Data, Auth, Profiles**: Supabase schema, migrations, seeded data, profiles, account management

See `docs/STREAMS.md` for the breakdown of who owns what.

---

## Future Improvements

The hackathon scope intentionally cut several features. With more time, AutoReviver could add:

- **Real fitment data integration** (TecDoc, DVLA vehicle lookup by registration plate)
- **Marketplace API ingestion** to import listings from eBay or Facebook Marketplace
- **Part-number OCR** from uploaded photos
- **Seller verification system** (ID check, payout account verification)
- **Scam detection** beyond image fingerprinting (price anomalies, listing-text patterns)
- **Buyer-seller messaging** with offer support
- **Saved garage** — store multiple vehicles per user and auto-check compatibility on browse
- **Scrapyard admin dashboard** for bulk listing import and inventory management
- **Payment and escrow** so transactions can complete on-platform
- **Reviews and reputation** for both buyers and sellers

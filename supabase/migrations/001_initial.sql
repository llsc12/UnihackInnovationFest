-- AutoReviver initial schema
-- Runs inside the supabase/postgres container on first boot.

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Types ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE condition AS ENUM ('new', 'like-new', 'good', 'fair', 'for-parts');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sellers (
  id            TEXT PRIMARY KEY,
  name          TEXT    NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  rating        NUMERIC(3,1),
  review_count  INTEGER,
  location      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id                    TEXT PRIMARY KEY,
  seller_id             TEXT REFERENCES sellers(id),
  -- input fields (flattened from ListingInput)
  part_type             TEXT    NOT NULL,
  make                  TEXT    NOT NULL,
  model                 TEXT    NOT NULL,
  year_from             INTEGER NOT NULL,
  year_to               INTEGER NOT NULL,
  condition             condition NOT NULL,
  part_number           TEXT,
  notes                 TEXT,
  price                 NUMERIC(10,2),
  images                TEXT[]  NOT NULL DEFAULT '{}',
  has_return_policy     BOOLEAN NOT NULL DEFAULT FALSE,
  -- generated fields (from GeneratedListing)
  title                 TEXT    NOT NULL,
  description           TEXT    NOT NULL,
  condition_notes       TEXT    NOT NULL,
  compatibility_summary TEXT    NOT NULL,
  keywords              TEXT[]  NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Explicit compatibility envelope per listing (fitsVehicles[])
CREATE TABLE IF NOT EXISTS listing_fits_vehicles (
  id          SERIAL PRIMARY KEY,
  listing_id  TEXT    NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  make        TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  year_from   INTEGER NOT NULL,
  year_to     INTEGER NOT NULL
);

-- Vehicle catalogue — used for dropdowns (Stream 2)
CREATE TABLE IF NOT EXISTS vehicles (
  make  TEXT    NOT NULL,
  model TEXT    NOT NULL,
  year  INTEGER NOT NULL,
  PRIMARY KEY (make, model, year)
);

-- Generation / facelift rules — used by compatibility checker (Stream 2)
CREATE TABLE IF NOT EXISTS compatibility_rules (
  id          SERIAL  PRIMARY KEY,
  make        TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  generation  TEXT    NOT NULL,
  year_from   INTEGER NOT NULL,
  year_to     INTEGER NOT NULL,
  notes       TEXT
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_listings_make_model   ON listings(make, model);
CREATE INDEX IF NOT EXISTS idx_listings_created_at   ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fits_make_model       ON listing_fits_vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_compat_make_model     ON compatibility_rules(make, model);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE sellers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_fits_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_rules   ENABLE ROW LEVEL SECURITY;

-- Public read (anon + authenticated)
CREATE POLICY "sellers_read_all"    ON sellers               FOR SELECT USING (true);
CREATE POLICY "listings_read_all"   ON listings              FOR SELECT USING (true);
CREATE POLICY "fits_read_all"       ON listing_fits_vehicles FOR SELECT USING (true);
CREATE POLICY "vehicles_read_all"   ON vehicles              FOR SELECT USING (true);
CREATE POLICY "compat_read_all"     ON compatibility_rules   FOR SELECT USING (true);

-- Insert / update allowed for any authenticated user (service role bypasses RLS anyway)
CREATE POLICY "listings_insert"     ON listings              FOR INSERT WITH CHECK (true);
CREATE POLICY "sellers_insert"      ON sellers               FOR INSERT WITH CHECK (true);
CREATE POLICY "fits_insert"         ON listing_fits_vehicles FOR INSERT WITH CHECK (true);

-- ── Grants ────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON sellers, listings, listing_fits_vehicles, vehicles, compatibility_rules
  TO anon, authenticated;
GRANT INSERT, UPDATE ON listings, sellers, listing_fits_vehicles TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE listing_fits_vehicles_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE compatibility_rules_id_seq   TO authenticated;

-- Per-user saved/liked listings.
-- RLS is enabled with no policies → only the service_role client can read/write
-- the table. The /api/saves/[id] route enforces authentication and ownership
-- before issuing the underlying query, same pattern 003_auth.sql established
-- for ownership checks on listings/sellers (no auth.uid() in SQL because
-- GoTrue owns that function and it isn't available when this init script runs).

CREATE TABLE IF NOT EXISTS saved_listings (
  user_id    UUID         NOT NULL,
  listing_id TEXT         NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_listings_user    ON saved_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_created ON saved_listings(user_id, created_at DESC);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies. anon/authenticated cannot reach this table directly.

-- Image hash registry for duplicate/stolen image detection.
-- A SHA-256 hash is computed from each uploaded image buffer at upload time.
-- If the same hash already exists, the upload endpoint warns the buyer.
-- listing_id is set when the listing is created; NULL in the window between
-- upload and listing submission.

CREATE TABLE IF NOT EXISTS image_hashes (
  hash        TEXT        PRIMARY KEY,
  listing_id  TEXT        REFERENCES listings(id) ON DELETE SET NULL,
  image_url   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_hashes_listing ON image_hashes(listing_id);

ALTER TABLE image_hashes ENABLE ROW LEVEL SECURITY;

-- Anyone can check hashes (needed for public duplicate detection).
CREATE POLICY "image_hashes_read"
  ON image_hashes FOR SELECT USING (true);

-- Only service_role inserts/updates (upload route uses createServerClient).
GRANT SELECT ON image_hashes TO anon, authenticated;
GRANT ALL    ON image_hashes TO service_role;

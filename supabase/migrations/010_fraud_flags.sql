-- Fraud flags column on listings.
-- fraud_flags is a string array of machine-readable flag codes, e.g. 'duplicate_image'.
-- Empty array = clean listing.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS fraud_flags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_listings_fraud_flags ON listings USING GIN (fraud_flags);

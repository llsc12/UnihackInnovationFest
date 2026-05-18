-- Add FK from listings.user_id → profiles.id so PostgREST can resolve the
-- relationship in select queries.
-- ON DELETE SET NULL: listings persist (anonymised) when an account is deleted.

ALTER TABLE listings
  ADD CONSTRAINT listings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

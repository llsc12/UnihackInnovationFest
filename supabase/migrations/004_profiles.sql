-- ── User profiles ─────────────────────────────────────────────────────────────
-- Linked 1-to-1 with auth.users. Cascades on account deletion.
-- date_of_birth is GDPR-sensitive — never expose to other clients.

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  privacy_mode  TEXT NOT NULL DEFAULT 'public'
                CHECK (privacy_mode IN ('public', 'private')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

GRANT SELECT          ON profiles TO anon, authenticated, service_role;
GRANT INSERT, UPDATE  ON profiles TO authenticated, service_role;

-- ── New listing columns ───────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS return_policy_details TEXT,
  ADD COLUMN IF NOT EXISTS postage_info          TEXT,
  ADD COLUMN IF NOT EXISTS part_origin           TEXT NOT NULL DEFAULT 'unknown'
    CHECK (part_origin IN ('oem', 'aftermarket', 'unknown'));

-- ── Supabase Storage bucket for listing images ────────────────────────────────
-- Stores images at listing-images/{user_id}/{uuid}.{ext}
-- Public bucket — all objects readable without auth.

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "listing_images_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "listing_images_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

CREATE POLICY "listing_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

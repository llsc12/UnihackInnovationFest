-- Add user_id to sellers and listings for auth-based ownership.
-- No FK to auth.users — that table is created by GoTrue after DB init.
-- auth.uid() is also GoTrue-owned, so RLS policies that reference it must be
-- applied after first boot (or via a Supabase migration tool). Ownership is
-- enforced at the API layer instead (see app/api/listings/route.ts).

ALTER TABLE sellers  ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS user_id UUID;

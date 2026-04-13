-- Migration v3: add tiktok_url column to plans
-- instagram_ref is kept as-is (column rename is not needed;
-- normalization now happens at the application layer on save/display)

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

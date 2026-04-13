-- =====================================================
-- Ours – Migration v2
-- Removes profiles table; embeds partner identities
-- into the couples table. Changes plans.proposed_by
-- from UUID FK → TEXT ('one' | 'two').
-- =====================================================

-- Step 1: Add partner columns to couples
ALTER TABLE couples
  ADD COLUMN IF NOT EXISTS partner_one_name  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS partner_two_name  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS partner_one_avatar TEXT NOT NULL DEFAULT 'blossom',
  ADD COLUMN IF NOT EXISTS partner_two_avatar TEXT NOT NULL DEFAULT 'sage';

-- Step 2: Drop FK constraint on plans.proposed_by (was UUID → profiles.id)
ALTER TABLE plans
  DROP CONSTRAINT IF EXISTS plans_proposed_by_fkey;

-- Step 3: Convert plans.proposed_by to TEXT
--   Existing rows will get NULL (old UUID data is incompatible with 'one'/'two').
--   New plans will store 'one' or 'two'.
ALTER TABLE plans
  ALTER COLUMN proposed_by TYPE TEXT USING NULL;

-- Step 4: Drop the profiles table (no longer needed)
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 5: Rebuild RLS on couples (nothing changes functionally)
-- Policies already exist from schema v1 – no action needed.

-- =====================================================
-- NOTES
-- =====================================================
-- * Existing couples will have empty partner_one_name / partner_two_name.
--   The app handles this gracefully: old sessions are invalidated (new
--   localStorage key 'ours-session-v2'), so users redo onboarding and
--   recreate their couple with the new flow.
--
-- * Existing plans lose their proposer display (proposed_by = NULL).
--   They remain fully functional; proposer just shows as blank.
--
-- * Storage bucket 'avatars' can be deleted from the Supabase dashboard
--   — it is no longer used.

-- =====================================================
-- Migration v9
--   1. completed_at — when a plan was actually marked done
--   2. hearted_by   — "I want this too" from the other partner
-- =====================================================

-- ── 1. completed_at ──────────────────────────────────
-- The Memories view groups finished plans by month. updated_at can't answer
-- "when did we do this", because editing a done plan bumps it.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Backfill: updated_at is the best estimate we have for existing rows.
UPDATE plans SET completed_at = updated_at
  WHERE status = 'done' AND completed_at IS NULL;

-- Maintained by the database rather than the client, so it stays correct no
-- matter which screen flipped the status.
CREATE OR REPLACE FUNCTION touch_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status <> 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS plans_touch_completed_at ON plans;
CREATE TRIGGER plans_touch_completed_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION touch_completed_at();

-- ── 2. hearted_by ────────────────────────────────────
-- Holds partner keys ('one' / 'two'). An array on the row rather than a
-- separate table: there are only ever two possible voters, so a join table
-- would be all overhead and another RLS policy to keep in sync.

ALTER TABLE plans ADD COLUMN IF NOT EXISTS hearted_by TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_hearted_by_valid;
ALTER TABLE plans ADD CONSTRAINT plans_hearted_by_valid
  CHECK (hearted_by <@ ARRAY['one', 'two']::TEXT[]);

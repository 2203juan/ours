-- Migration v4: simplify plan status to to_do | done
-- Drop the old CHECK constraint
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_status_check;

-- Migrate existing data
UPDATE plans SET status = 'done'  WHERE status = 'completed';
UPDATE plans SET status = 'to_do' WHERE status NOT IN ('to_do', 'done');

-- Update column default and add new CHECK constraint
ALTER TABLE plans ALTER COLUMN status SET DEFAULT 'to_do';
ALTER TABLE plans ADD CONSTRAINT plans_status_check
  CHECK (status IN ('to_do', 'done'));

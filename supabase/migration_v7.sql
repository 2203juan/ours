-- Migration v7: cascade-delete activities when their plan is deleted
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_plan_id_fkey;
ALTER TABLE activities
  ADD CONSTRAINT activities_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE;

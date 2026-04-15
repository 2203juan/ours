-- Migration v6: activity feed
CREATE TABLE IF NOT EXISTS activities (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'plan_created',
  actor_name TEXT        NOT NULL,
  plan_id    UUID        REFERENCES plans(id) ON DELETE SET NULL,
  plan_name  TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_couple_created
  ON activities(couple_id, created_at DESC);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couple members can read their activities"
  ON activities FOR SELECT USING (true);

CREATE POLICY "Couple members can insert activities"
  ON activities FOR INSERT WITH CHECK (true);

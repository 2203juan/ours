-- Migration v5: add menu_url and completion_note to plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS menu_url        TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS completion_note TEXT;

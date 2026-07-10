-- Migration v8: add maps_rating to plans (manual Google Maps rating, 0-5)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS maps_rating NUMERIC(2,1)
  CHECK (maps_rating IS NULL OR (maps_rating >= 0 AND maps_rating <= 5));

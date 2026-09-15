-- =====================================================
-- Migration v10 — plan coordinates
--
-- `maps_url` already stores the link, but a link can't be drawn on a map.
-- Most of them are short `maps.app.goo.gl` links, which only reveal the place
-- once you follow the redirect — something the browser can't do (CORS). So
-- coordinates are resolved once, by the `resolve-place` edge function, and
-- kept here: the map opens instantly and nothing is looked up per render.
-- =====================================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- Where the coordinates came from. 'manual' always wins: once someone has
-- dragged the pin to the right spot, no automatic guess may overwrite it.
--   maps_url → read out of the Google Maps link (exact)
--   geocode  → name/address lookup against OpenStreetMap (approximate)
--   manual   → placed by hand in the app
ALTER TABLE plans ADD COLUMN IF NOT EXISTS geo_source TEXT
  CHECK (geo_source IS NULL OR geo_source IN ('maps_url', 'geocode', 'manual'));

-- Stamps the last resolution attempt, successful or not. Without it, a place
-- that can't be geocoded would be retried every single time the map opens.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS geo_resolved_at TIMESTAMPTZ;

-- The map only ever asks for what it can draw.
CREATE INDEX IF NOT EXISTS plans_located_idx
  ON plans (couple_id) WHERE lat IS NOT NULL AND lng IS NOT NULL;

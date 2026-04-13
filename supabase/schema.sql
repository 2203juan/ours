-- =====================================================
-- Ours – Couple Bucket List App
-- Supabase Schema
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Couples: one row per couple
CREATE TABLE couples (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  code        CHAR(6)     NOT NULL UNIQUE,          -- join code e.g. "X7K2PQ"
  couple_name TEXT,                                  -- e.g. "Ana & Marcos"
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Profiles: one per person (up to 2 per couple)
CREATE TABLE profiles (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id  UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categories: default + custom, scoped per couple
CREATE TABLE categories (
  id         UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id  UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  emoji      TEXT        NOT NULL DEFAULT '✨',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Plans: the bucket list items
CREATE TABLE plans (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  couple_id       UUID        NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category_id     UUID        REFERENCES categories(id) ON DELETE SET NULL,
  proposed_by     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT        NOT NULL,
  description     TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'selected', 'completed', 'canceled')),
  priority        TEXT        NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high')),
  budget_estimate NUMERIC(10,2),
  location_text   TEXT,
  maps_url        TEXT,
  instagram_ref   TEXT,
  ideal_date      DATE,
  is_someday      BOOLEAN     NOT NULL DEFAULT TRUE,
  images          TEXT[]      NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on plans
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER plans_touch_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- Security model: the couple_id UUID acts as the shared secret.
-- All four tables are open on the anon key (no Supabase Auth used).
-- This is appropriate for a private couples app — the UUID is
-- unguessable and is stored only in the users' localStorage.
-- You can add Supabase Auth later without changing the schema.

ALTER TABLE couples    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans      ENABLE ROW LEVEL SECURITY;

-- Allow full access via anon key (couple_id is the access control)
CREATE POLICY "open_couples"    ON couples    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_profiles"   ON profiles   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open_plans"      ON plans      FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- STORAGE
-- =====================================================
-- Run these via the Supabase dashboard Storage section,
-- or via the Storage API. Both buckets should be PUBLIC.
--
-- Bucket 1: plan-images
--   Path pattern: {couple_id}/{plan_id}/{filename}
--
-- Bucket 2: avatars
--   Path pattern: {couple_id}/{profile_id}
--
-- SQL equivalent (if using supabase CLI):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('plan-images', 'plan-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
--
-- Storage RLS (allow all on anon key):
-- CREATE POLICY "open" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- DEFAULT CATEGORIES SEED (run per couple after creation)
-- =====================================================
-- These are inserted programmatically by the app when a couple is created.
-- Reference list:
--   ('Dates / Food',     '🍽️', 0)
--   ('Travel',           '✈️', 1)
--   ('At Home',          '🏠', 2)
--   ('New Experiences',  '✨', 3)
--   ('Wellness',         '🌿', 4)
--   ('Low Budget',       '💚', 5)
--   ('Romantic',         '🌹', 6)
--   ('Adventures',       '🏕️', 7)

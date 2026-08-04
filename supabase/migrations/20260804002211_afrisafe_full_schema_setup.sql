/*
# AfriSafe AI — full schema setup for new Supabase project

## Purpose
The backend (FastAPI on Render) expects these tables and columns to exist.
This migration creates the missing tables, adds missing columns to the
existing assessments table, fixes non-conforming RLS policies, and sets up
the auto-profile trigger for new sign-ups.

## 1. New Tables

### predictions
- id (uuid pk), user_id (uuid not null default auth.uid(), FK->auth.users cascade)
- prediction (text), confidence (numeric), risk (text)
- recommendation (text), advice (jsonb), symptoms (jsonb)
- ai_insights (text), created_at (timestamptz)

### profiles
- id (uuid pk default auth.uid(), FK->auth.users cascade)
- full_name (text), email (text), age (int), gender (text), state (text), phone (text)
- created_at, updated_at (timestamptz)

### activity_logs
- id (uuid pk), user_id (uuid not null default auth.uid(), FK->auth.users cascade)
- action (text not null), metadata (jsonb), created_at (timestamptz)

## 2. Modified Tables

### assessments — add missing columns
- data (jsonb) — the backend writes the raw answers JSON here
- result (text) — risk result string
- score (numeric) — numeric score
- Also add UPDATE policy (currently only SELECT/INSERT/DELETE exist)

### reminders — fix FOR ALL policy
- Drop the single "Users can manage their reminders" FOR ALL policy
- Create 4 separate policies (SELECT/INSERT/UPDATE/DELETE) scoped to authenticated

## 3. Security
- RLS enabled on all new tables (predictions, profiles, activity_logs)
- Owner-scoped CRUD (auth.uid() = user_id) on all tables
- 4 separate policies per table, scoped TO authenticated
- user_id columns default to auth.uid() so inserts omitting it still pass WITH CHECK

## 4. Auto-profile trigger
- handle_new_user() inserts a profiles row on auth.users insert (SECURITY DEFINER)
- ON CONFLICT DO NOTHING makes it idempotent
- EXECUTE revoked from PUBLIC, anon, authenticated (trigger only, not REST-callable)

## 5. Notes
- Existing assessments boolean columns (fever, headache, etc.) are preserved
- Safe to re-run (IF NOT EXISTS + drop-before-create policies)
*/

-- ── predictions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  prediction text NOT NULL,
  confidence numeric NOT NULL DEFAULT 0,
  risk text NOT NULL DEFAULT 'Low',
  recommendation text,
  advice jsonb DEFAULT '[]'::jsonb,
  symptoms jsonb DEFAULT '{}'::jsonb,
  ai_insights text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_own_predictions" ON predictions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_predictions" ON predictions;
CREATE POLICY "insert_own_predictions" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_predictions" ON predictions;
CREATE POLICY "update_own_predictions" ON predictions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_predictions" ON predictions;
CREATE POLICY "delete_own_predictions" ON predictions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- ── profiles ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  age integer,
  gender text,
  state text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ── activity_logs ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activity_logs" ON activity_logs;
CREATE POLICY "select_own_activity_logs" ON activity_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activity_logs" ON activity_logs;
CREATE POLICY "insert_own_activity_logs" ON activity_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_activity_logs" ON activity_logs;
CREATE POLICY "update_own_activity_logs" ON activity_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_activity_logs" ON activity_logs;
CREATE POLICY "delete_own_activity_logs" ON activity_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ── assessments: add missing columns ──────────────────────────
ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS score numeric DEFAULT 0;

-- Add UPDATE policy to assessments (currently missing)
DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── reminders: replace FOR ALL with 4 separate policies ────────
DROP POLICY IF EXISTS "Users can manage their reminders" ON reminders;

DROP POLICY IF EXISTS "select_own_reminders" ON reminders;
CREATE POLICY "select_own_reminders" ON reminders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reminders" ON reminders;
CREATE POLICY "insert_own_reminders" ON reminders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reminders" ON reminders;
CREATE POLICY "update_own_reminders" ON reminders FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reminders" ON reminders;
CREATE POLICY "delete_own_reminders" ON reminders FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ── auto-profile trigger ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'fullName')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Revoke EXECUTE so the function can't be called via REST API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

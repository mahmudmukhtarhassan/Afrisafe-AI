/*
# Create assessments + activity_logs tables, auto-profile trigger

## 1. Purpose
Completes the AfriSafe AI data model so the backend and frontend can persist
assessments, log user activity, and automatically provision a `profiles` row
whenever a new auth user registers.

## 2. New Tables

### assessments
- id (uuid pk), user_id (uuid not null default auth.uid(), FK->auth.users cascade)
- symptoms (jsonb default '{}'), prediction (text), probability (numeric default 0)
- risk_level (text default 'Low'), recommendation (text)
- model_version (text default 'logistic-v1'), created_at (timestamptz default now())

### activity_logs
- id (uuid pk), user_id (uuid not null default auth.uid(), FK->auth.users cascade)
- action (text not null), metadata (jsonb default '{}'), created_at (timestamptz)

## 3. Security
- RLS enabled on both; owner-scoped CRUD (auth.uid() = user_id).
- user_id defaults to auth.uid() so inserts omitting it still pass WITH CHECK.

## 4. Auto-profile trigger
- handle_new_user() inserts a profiles row on auth.users insert (SECURITY DEFINER).
- ON CONFLICT DO NOTHING makes it idempotent.

## 5. Notes
- DROP POLICY does not accept FOR clause; dropped by name only.
- Safe to re-run (IF NOT EXISTS + drop-before-create policies).
*/

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms jsonb NOT NULL DEFAULT '{}'::jsonb,
  prediction text,
  probability numeric NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Low',
  recommendation text,
  model_version text NOT NULL DEFAULT 'logistic-v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assessments" ON assessments;
CREATE POLICY "select_own_assessments" ON assessments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_assessments" ON assessments;
CREATE POLICY "insert_own_assessments" ON assessments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_assessments" ON assessments;
CREATE POLICY "update_own_assessments" ON assessments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
CREATE POLICY "delete_own_assessments" ON assessments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS assessments_user_id_created_at_idx
  ON assessments (user_id, created_at DESC);

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

CREATE INDEX IF NOT EXISTS activity_logs_user_id_created_at_idx
  ON activity_logs (user_id, created_at DESC);

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
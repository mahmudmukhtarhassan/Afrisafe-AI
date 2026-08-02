/*
# Create predictions table for AfriSafe AI

1. New Tables
- `predictions`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users)
  - `prediction` (text - "Malaria" or "No Malaria")
  - `confidence` (numeric - confidence percentage)
  - `risk` (text - "High", "Medium", or "Low")
  - `recommendation` (text - clinical recommendation)
  - `advice` (jsonb - array of advice strings)
  - `symptoms` (jsonb - raw symptom payload from the assessment form)
  - `ai_insights` (text - AI-generated insight summary)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on `predictions`.
- Owner-scoped CRUD: each authenticated user can only access their own prediction records.
- 4 separate policies (SELECT, INSERT, UPDATE, DELETE) scoped to `authenticated`.
- `user_id` defaults to `auth.uid()` so inserts that omit it still satisfy the WITH CHECK.

3. Important Notes
- The FastAPI backend uses the service role key (bypasses RLS) for writes, but RLS
  protects the table if accessed directly from the frontend via the anon key.
- This table mirrors the in-memory predictions array in the Express dev server.
*/

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

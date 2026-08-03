-- Add columns that the backend assessment.py writes to the assessments table.
-- The table currently has: symptoms, prediction, probability, risk_level, recommendation, model_version
-- The backend code writes: data (jsonb), result (text), score (numeric)
-- Add the missing columns so both the old and new code paths work.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS result text,
  ADD COLUMN IF NOT EXISTS score numeric DEFAULT 0;

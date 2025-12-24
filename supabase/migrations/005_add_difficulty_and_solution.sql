-- Migration: Add difficulty column and solution field to exercises
-- Fixes: "Could not find the 'difficulty' column" error

-- Add difficulty column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'exercises' AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE exercises ADD COLUMN difficulty TEXT DEFAULT 'medium';
    END IF;
END $$;

-- Add constraint to ensure valid difficulty values
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_difficulty_check;
ALTER TABLE exercises ADD CONSTRAINT exercises_difficulty_check
    CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add solution column for storing detailed solution/correction
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS solution TEXT;

-- Update any NULL difficulty values to 'medium'
UPDATE exercises SET difficulty = 'medium' WHERE difficulty IS NULL;

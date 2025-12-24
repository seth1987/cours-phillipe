-- Migration: Support multiple answers per exercise + image upload
-- This migration adapts the schema for:
-- 1. Multiple expected answers (JSONB instead of single DECIMAL)
-- 2. Image/schema storage for exercises

-- Add image_url column to exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add expected_answers column to exercises (template for answer configuration)
-- Format: [{"name": "sigma", "formula": "F/S", "unit": "MPa", "tolerance": 5}]
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS expected_answers JSONB DEFAULT '[]';

-- Modify exercise_instances to support multiple answers
-- Change expected_answer from DECIMAL to JSONB
-- Format: [{"name": "sigma", "value": 125.5, "unit": "MPa", "tolerance": 5}]
ALTER TABLE exercise_instances
  ALTER COLUMN expected_answer TYPE JSONB USING
    jsonb_build_array(jsonb_build_object('name', 'resultat', 'value', expected_answer, 'unit', '', 'tolerance', 5));

-- Change final_answer to JSONB for storing multiple student answers
ALTER TABLE exercise_instances
  ALTER COLUMN final_answer TYPE JSONB USING
    CASE WHEN final_answer IS NOT NULL
      THEN jsonb_build_array(jsonb_build_object('name', 'resultat', 'value', final_answer))
      ELSE NULL
    END;

-- Update attempts table to store multiple answers
ALTER TABLE attempts
  ALTER COLUMN given_answer TYPE JSONB USING
    jsonb_build_array(jsonb_build_object('name', 'resultat', 'value', given_answer));

-- Add answers_detail to store per-answer results
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS answers_detail JSONB DEFAULT '[]';

-- Create storage bucket for exercise images (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);

-- Storage policies for exercise images
-- Allow authenticated users to upload images
-- CREATE POLICY "Profs can upload images" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'exercise-images' AND
--     auth.role() = 'authenticated'
--   );

-- Allow public read access to images
-- CREATE POLICY "Public read access" ON storage.objects
--   FOR SELECT USING (bucket_id = 'exercise-images');

-- Allow profs to delete their own images
-- CREATE POLICY "Profs can delete own images" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'exercise-images' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

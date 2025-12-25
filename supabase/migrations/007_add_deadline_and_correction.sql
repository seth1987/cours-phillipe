-- Migration: Add deadline and show_correction columns for exercises
-- Features: Auto-archive after deadline, show correction after archive

-- Add deadline column (optional date/time when exercise auto-archives)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Add show_correction_after_archive column (show solution to students after archive)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS show_correction_after_archive BOOLEAN DEFAULT false;

-- Create index for deadline queries (for auto-archive job)
CREATE INDEX IF NOT EXISTS idx_exercises_deadline
ON exercises(deadline)
WHERE deadline IS NOT NULL AND statut = 'publie';

-- Function to auto-archive exercises past deadline
CREATE OR REPLACE FUNCTION auto_archive_expired_exercises()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE exercises
  SET statut = 'archive'
  WHERE statut = 'publie'
    AND deadline IS NOT NULL
    AND deadline < NOW();

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (for manual trigger or cron)
GRANT EXECUTE ON FUNCTION auto_archive_expired_exercises() TO authenticated;

COMMENT ON COLUMN exercises.deadline IS 'Date limite optionnelle - archivage automatique apres cette date';
COMMENT ON COLUMN exercises.show_correction_after_archive IS 'Afficher la correction aux etudiants apres archivage';

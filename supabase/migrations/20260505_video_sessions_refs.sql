-- Add reference image columns and includes_person to video_sessions
ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS includes_person BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS character_ref_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS environment_ref_url TEXT DEFAULT NULL;

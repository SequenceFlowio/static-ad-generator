-- Add visual_bible JSONB column to video_sessions
-- Stores the consistent visual DNA (character, environment, lighting) used across all scene frames

ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS visual_bible JSONB DEFAULT NULL;

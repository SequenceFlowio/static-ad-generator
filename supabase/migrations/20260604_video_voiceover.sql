ALTER TABLE video_sessions ADD COLUMN IF NOT EXISTS voiceover_enabled boolean NOT NULL DEFAULT false;

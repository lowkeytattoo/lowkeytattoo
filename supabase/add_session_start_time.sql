-- Migration: add start_time column to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS start_time TEXT;

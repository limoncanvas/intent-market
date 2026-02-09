-- Migration: Add Arcium privacy fields to intents table
-- Run this in your Supabase SQL editor before deploying

ALTER TABLE intents
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS encrypted_data TEXT;

-- Index for efficient public listing queries
CREATE INDEX IF NOT EXISTS idx_intents_is_private ON intents (is_private);

COMMENT ON COLUMN intents.is_private IS 'When true, intent is hidden from public directory';
COMMENT ON COLUMN intents.encrypted_data IS 'Arcium-encrypted payload (JSON) containing the original intent text';

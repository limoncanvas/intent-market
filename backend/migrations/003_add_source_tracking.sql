-- Migration: Add source tracking fields to intents table
-- This allows tracking where intents originate from (moltbook, manual, etc.)

-- Add source platform column
ALTER TABLE intents
ADD COLUMN IF NOT EXISTS source_platform TEXT;

-- Add source URL column with unique constraint
ALTER TABLE intents
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create unique index on source_url to prevent duplicate imports
CREATE UNIQUE INDEX IF NOT EXISTS idx_intents_source_url
ON intents(source_url)
WHERE source_url IS NOT NULL;

-- Add index for querying by source platform
CREATE INDEX IF NOT EXISTS idx_intents_source_platform
ON intents(source_platform)
WHERE source_platform IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN intents.source_platform IS 'Platform where the intent originated (moltbook, manual, etc.)';
COMMENT ON COLUMN intents.source_url IS 'Original URL of the source post/content';

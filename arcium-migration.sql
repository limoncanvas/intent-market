-- Arcium Confidential Computing Migration
-- Adds encrypted data support for private intents
-- Run this in Supabase SQL Editor after the initial setup

-- Add encryption fields to intents table
ALTER TABLE intents ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE intents ADD COLUMN IF NOT EXISTS encrypted_data TEXT;
ALTER TABLE intents ADD COLUMN IF NOT EXISTS encryption_nonce TEXT;
ALTER TABLE intents ADD COLUMN IF NOT EXISTS encryption_method VARCHAR(50);

-- Add index for private intents
CREATE INDEX IF NOT EXISTS idx_intents_private ON intents(is_private);

-- Add encrypted matching support
ALTER TABLE matches ADD COLUMN IF NOT EXISTS encrypted_proof TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS proof_verified BOOLEAN DEFAULT FALSE;

-- Comment the columns for documentation
COMMENT ON COLUMN intents.is_private IS 'Whether this intent uses Arcium encryption';
COMMENT ON COLUMN intents.encrypted_data IS 'Arcium-encrypted intent data (title, description, requirements, budget)';
COMMENT ON COLUMN intents.encryption_nonce IS 'Nonce used for Arcium encryption';
COMMENT ON COLUMN intents.encryption_method IS 'Encryption method (arcium-mpc, etc)';
COMMENT ON COLUMN matches.encrypted_proof IS 'Zero-knowledge proof that match meets threshold without revealing data';
COMMENT ON COLUMN matches.proof_verified IS 'Whether the ZK proof has been verified';

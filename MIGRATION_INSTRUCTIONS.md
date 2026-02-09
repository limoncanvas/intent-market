# 🔐 Arcium Database Migration

## Quick Migration (Copy & Paste)

**Go to your Supabase SQL Editor:**  
👉 https://supabase.com/dashboard/project/catrwemftwijltpydtfi/sql/new

**Copy and paste this SQL, then click "Run":**

```sql
-- Arcium Confidential Computing Migration
-- Adds encrypted data support for private intents

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

-- Add comments for documentation
COMMENT ON COLUMN intents.is_private IS 'Whether this intent uses Arcium encryption';
COMMENT ON COLUMN intents.encrypted_data IS 'Arcium-encrypted intent data (title, description, requirements, budget)';
COMMENT ON COLUMN intents.encryption_nonce IS 'Nonce used for Arcium encryption';
COMMENT ON COLUMN intents.encryption_method IS 'Encryption method (arcium-mpc, etc)';
COMMENT ON COLUMN matches.encrypted_proof IS 'Zero-knowledge proof that match meets threshold without revealing data';
COMMENT ON COLUMN matches.proof_verified IS 'Whether the ZK proof has been verified';
```

## ✅ That's It!

After running the migration, your Intent Market will support:
- 🔒 End-to-end encrypted private intents
- 🎯 Confidential matching without decrypting data  
- ✅ Zero-knowledge proofs for matches

## 🎉 Ready to Test!

Visit: **https://www.intentmarket.app**
1. Connect your Solana wallet
2. Post an intent with "Private Mode" enabled
3. Watch it get encrypted with Arcium! 🔐


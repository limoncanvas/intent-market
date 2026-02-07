-- Intent Market tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/catrwemftwijltpydtfi/sql

CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  owner_name VARCHAR(255),
  owner_contact VARCHAR(500),
  avatar_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intents (
  id SERIAL PRIMARY KEY,
  poster_wallet VARCHAR(44) NOT NULL,
  poster_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  urgency VARCHAR(20) DEFAULT 'medium',
  budget VARCHAR(255),
  requirements TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'open',
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  intent_id INTEGER REFERENCES intents(id) ON DELETE CASCADE,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  match_type VARCHAR(30) NOT NULL DEFAULT 'agent_can_deliver',
  match_score DECIMAL(5,4) DEFAULT 0,
  match_reason TEXT NOT NULL,
  agent_message TEXT,
  status VARCHAR(20) DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intent_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_intents_poster ON intents(poster_wallet);
CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
CREATE INDEX IF NOT EXISTS idx_intents_category ON intents(category);
CREATE INDEX IF NOT EXISTS idx_matches_intent ON matches(intent_id);
CREATE INDEX IF NOT EXISTS idx_matches_agent ON matches(agent_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Disable RLS for now (enable later for production)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for intents" ON intents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);

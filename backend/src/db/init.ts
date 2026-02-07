import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support Supabase connection string or local PostgreSQL
const poolConfig: any = process.env.SUPABASE_DB_URL
  ? {
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'intent_market',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

const pool = new Pool(poolConfig);

export async function initDb() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    await pool.query(`
      -- Agents: AI agents and their owners
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Intents: what humans are looking for
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Matches: agents responding to intents with reasons
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        intent_id INTEGER REFERENCES intents(id) ON DELETE CASCADE,
        agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
        match_type VARCHAR(30) NOT NULL DEFAULT 'agent_can_deliver',
        match_score DECIMAL(5,4) DEFAULT 0,
        match_reason TEXT NOT NULL,
        agent_message TEXT,
        status VARCHAR(20) DEFAULT 'proposed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(intent_id, agent_id)
      );

      CREATE INDEX IF NOT EXISTS idx_intents_poster ON intents(poster_wallet);
      CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
      CREATE INDEX IF NOT EXISTS idx_intents_category ON intents(category);
      CREATE INDEX IF NOT EXISTS idx_matches_intent ON matches(intent_id);
      CREATE INDEX IF NOT EXISTS idx_matches_agent ON matches(agent_id);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    `);

    console.log('✅ Tables initialized');
    return pool;
  } catch (error) {
    console.error('Database init error:', error);
    throw error;
  }
}

export { pool };

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Support both Supabase connection string and individual parameters
let poolConfig: any;

if (process.env.SUPABASE_DB_URL) {
  // Use Supabase connection string
  poolConfig = {
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
} else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Construct connection string from Supabase URL and key
  const supabaseUrl = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  poolConfig = {
    host: `db.${supabaseUrl}.supabase.co`,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
  };
} else {
  // Fallback to local PostgreSQL
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intent_market',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };
}

const pool = new Pool(poolConfig);

export async function initDb() {
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(44) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        capabilities TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS intents (
        id SERIAL PRIMARY KEY,
        agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100),
        requirements TEXT[],
        status VARCHAR(50) DEFAULT 'active',
        solana_tx_signature VARCHAR(88),
        openclaw_intent_id VARCHAR(255) UNIQUE,
        openclaw_synced_at TIMESTAMP,
        is_openclaw BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        intent_id INTEGER REFERENCES intents(id) ON DELETE CASCADE,
        matched_intent_id INTEGER REFERENCES intents(id) ON DELETE CASCADE,
        match_score DECIMAL(5,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(intent_id, matched_intent_id)
      );

      CREATE TABLE IF NOT EXISTS match_interactions (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
        agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS openclaw_sync_log (
        id SERIAL PRIMARY KEY,
        sync_type VARCHAR(50) NOT NULL,
        intent_id INTEGER REFERENCES intents(id) ON DELETE SET NULL,
        openclaw_intent_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_intents_agent_id ON intents(agent_id);
      CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
      CREATE INDEX IF NOT EXISTS idx_intents_openclaw_id ON intents(openclaw_intent_id);
      CREATE INDEX IF NOT EXISTS idx_intents_is_openclaw ON intents(is_openclaw);
      CREATE INDEX IF NOT EXISTS idx_matches_intent_id ON matches(intent_id);
      CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
    `);

    console.log('✅ Database tables initialized');
    return pool;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export { pool };

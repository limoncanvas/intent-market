import { Pool } from 'pg';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { calculateMatchScore } from './matching';

dotenv.config();

// Support both Supabase connection string and individual parameters
let poolConfig: any;

if (process.env.SUPABASE_DB_URL) {
  // Use Supabase connection string
  poolConfig = {
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
} else if (process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD) {
  // Construct connection string from Supabase URL and password
  const supabaseUrl = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
  poolConfig = {
    host: `db.${supabaseUrl}.supabase.co`,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
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

async function findMatchesForIntent(intentId: number) {
  try {
    // Get the intent
    const intentResult = await pool.query(
      'SELECT * FROM intents WHERE id = $1 AND status = $2',
      [intentId, 'active']
    );

    if (intentResult.rows.length === 0) {
      return;
    }

    const intent = intentResult.rows[0];

    // Get all other active intents
    const allIntentsResult = await pool.query(
      'SELECT * FROM intents WHERE id != $1 AND status = $2',
      [intentId, 'active']
    );

    for (const otherIntent of allIntentsResult.rows) {
      const score = calculateMatchScore(intent, otherIntent);
      
      if (score > 0.3) { // Threshold for creating a match
        // Check if match already exists
        const existingMatch = await pool.query(
          'SELECT id FROM matches WHERE (intent_id = $1 AND matched_intent_id = $2) OR (intent_id = $2 AND matched_intent_id = $1)',
          [intentId, otherIntent.id]
        );

        if (existingMatch.rows.length === 0) {
          await pool.query(
            `INSERT INTO matches (intent_id, matched_intent_id, match_score, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT DO NOTHING`,
            [intentId, otherIntent.id, score, 'pending']
          );
          console.log(`Created match: Intent ${intentId} <-> Intent ${otherIntent.id} (Score: ${score.toFixed(2)})`);
        }
      }
    }
  } catch (error) {
    console.error(`Error finding matches for intent ${intentId}:`, error);
  }
}

async function processAllIntents() {
  try {
    const result = await pool.query(
      'SELECT id FROM intents WHERE status = $1',
      ['active']
    );

    console.log(`Processing ${result.rows.length} active intents...`);
    
    for (const row of result.rows) {
      await findMatchesForIntent(row.id);
    }

    console.log('Matching cycle completed');
  } catch (error) {
    console.error('Error processing intents:', error);
  }
}

// Run matching every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Starting scheduled matching cycle...');
  processAllIntents();
});

// Also run immediately on startup
console.log('Matching engine started');
processAllIntents();

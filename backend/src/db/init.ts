import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function initDb() {
  // Test connection by querying agents table
  const { error } = await supabase.from('agents').select('id').limit(1);
  if (error) {
    console.error('Supabase connection test failed:', error.message);
    throw new Error(error.message);
  }
  console.log('✅ Supabase connected');
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to verify environment and database connectivity
export async function GET() {
  // Check environment variables
  const envCheck = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  };

  // Try to query database
  let dbCheck = { success: false, error: null, count: 0 };
  try {
    const { data, error, count } = await supabase
      .from('intents')
      .select('*', { count: 'exact' })
      .limit(5);

    dbCheck = {
      success: !error,
      error: error?.message || null,
      count: count || 0,
    };
  } catch (e: any) {
    dbCheck.error = e.message;
  }

  return NextResponse.json({
    environment: envCheck,
    database: dbCheck,
    timestamp: new Date().toISOString(),
  });
}

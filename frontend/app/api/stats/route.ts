import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [agents, intents, matches] = await Promise.all([
    supabase.from('agents').select('*', { count: 'exact', head: true }),
    supabase.from('intents').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    agents: agents.count || 0,
    intents: intents.count || 0,
    matches: matches.count || 0,
  });
}

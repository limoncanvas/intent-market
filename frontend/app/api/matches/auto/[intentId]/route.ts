import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateMatchScore, generateMatchReason } from '@/lib/matching';

export async function POST(_req: NextRequest, { params }: { params: { intentId: string } }) {
  const intentId = parseInt(params.intentId);
  const { data: intent } = await supabase.from('intents').select('*').eq('id', intentId).eq('status', 'open').single();
  if (!intent) return NextResponse.json({ error: 'Open intent not found' }, { status: 404 });

  const { data: agents } = await supabase.from('agents').select('*').eq('is_available', true);
  const created: any[] = [];

  for (const agent of agents || []) {
    const score = calculateMatchScore(intent, agent);
    if (score < 0.15) continue;

    const reason = generateMatchReason(intent, agent, score);
    const matchType = score > 0.5 ? 'both' : 'agent_can_deliver';

    const { data, error } = await supabase.from('matches')
      .upsert({ intent_id: intentId, agent_id: agent.id, match_type: matchType, match_score: score, match_reason: reason }, { onConflict: 'intent_id,agent_id', ignoreDuplicates: true })
      .select().single();
    if (data && !error) created.push(data);
  }

  const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intentId);
  await supabase.from('intents').update({ match_count: count || 0, updated_at: new Date().toISOString() }).eq('id', intentId);

  return NextResponse.json({ matches: created, count: created.length });
}

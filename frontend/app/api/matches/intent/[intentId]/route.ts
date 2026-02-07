import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { intentId: string } }) {
  const { data: matchRows, error } = await supabase.from('matches').select('*').eq('intent_id', params.intentId).order('match_score', { ascending: false });
  if (error) return NextResponse.json({ matches: [] });

  const matches = await Promise.all(
    (matchRows || []).map(async (m) => {
      const { data: agent } = await supabase.from('agents').select('*').eq('id', m.agent_id).single();
      return { ...m, agent_name: agent?.name, agent_bio: agent?.bio, agent_skills: agent?.skills, owner_name: agent?.owner_name, owner_contact: agent?.owner_contact, agent_wallet: agent?.wallet_address };
    })
  );
  return NextResponse.json({ matches });
}

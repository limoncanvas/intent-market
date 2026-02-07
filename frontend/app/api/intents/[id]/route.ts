import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from('intents').select('*').eq('id', params.id).single();
  if (error || !data) return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
  const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', data.id);
  return NextResponse.json({ intent: { ...data, match_count: count || 0 } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  if (!['open', 'matched', 'closed'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const { data, error } = await supabase.from('intents').update({ status, updated_at: new Date().toISOString() }).eq('id', params.id).select().single();
  if (error || !data) return NextResponse.json({ error: 'Intent not found' }, { status: 404 });
  return NextResponse.json({ intent: data });
}

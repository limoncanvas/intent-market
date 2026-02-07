import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json();
  if (!['proposed', 'accepted', 'declined', 'contacted'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const { data, error } = await supabase.from('matches').update({ status, updated_at: new Date().toISOString() }).eq('id', params.id).select().single();
  if (error || !data) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json({ match: data });
}

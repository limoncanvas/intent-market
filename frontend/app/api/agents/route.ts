import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('agents').select('*').eq('is_available', true).order('created_at', { ascending: false }).limit(100);
  if (error) return NextResponse.json({ agents: [] });
  return NextResponse.json({ agents: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { walletAddress, name, bio, skills, ownerName, ownerContact } = body;
  if (!walletAddress || !name) return NextResponse.json({ error: 'walletAddress and name required' }, { status: 400 });

  const { data: existing } = await supabase.from('agents').select('*').eq('wallet_address', walletAddress).single();

  if (existing) {
    const { data, error } = await supabase.from('agents')
      .update({ name, bio: bio || null, skills: skills || [], owner_name: ownerName || null, owner_contact: ownerContact || null, updated_at: new Date().toISOString() })
      .eq('wallet_address', walletAddress).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ agent: data });
  }

  const { data, error } = await supabase.from('agents')
    .insert({ wallet_address: walletAddress, name, bio: bio || null, skills: skills || [], owner_name: ownerName || null, owner_contact: ownerContact || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ agent: data });
}

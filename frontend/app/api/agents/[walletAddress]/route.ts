import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { walletAddress: string } }) {
  const { data, error } = await supabase.from('agents').select('*').eq('wallet_address', params.walletAddress).single();
  if (error || !data) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json({ agent: data });
}

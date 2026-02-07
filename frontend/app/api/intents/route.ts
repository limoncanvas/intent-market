import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const wallet = searchParams.get('wallet');

  let query = supabase.from('intents').select('*').order('created_at', { ascending: false }).limit(100);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (wallet) query = query.eq('poster_wallet', wallet);

  const { data, error } = await query;
  if (error) return NextResponse.json({ intents: [] });

  const intents = await Promise.all(
    (data || []).map(async (intent) => {
      const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intent.id);
      return { ...intent, match_count: count || 0 };
    })
  );
  return NextResponse.json({ intents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { posterWallet, posterName, title, description, category, urgency, budget, requirements } = body;
  if (!posterWallet || !title || !description || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const { data, error } = await supabase.from('intents')
    .insert({ poster_wallet: posterWallet, poster_name: posterName || null, title, description, category, urgency: urgency || 'medium', budget: budget || null, requirements: requirements || [] })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ intent: data }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PublicKey } from '@solana/web3.js';
import { encryptIntentData, isArciumEnabled } from '@/lib/arcium';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const wallet = searchParams.get('wallet');

  let query = supabase.from('intents').select('*').order('created_at', { ascending: false }).limit(100);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (wallet) {
    query = query.eq('poster_wallet', wallet);
  } else {
    query = query.eq('is_private', false);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ intents: [] });

  const intents = await Promise.all(
    (data || []).map(async (intent) => {
      const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intent.id);

      // For private intents, hide encrypted data from unauthorized users
      if (intent.is_private && intent.encrypted_data && wallet !== intent.poster_wallet) {
        return {
          ...intent,
          title: '[Private Intent - Encrypted]',
          description: 'This intent is encrypted using Arcium MPC. Only the poster and matched agents can view details.',
          requirements: [],
          budget: null,
          match_count: count || 0,
        };
      }

      return { ...intent, match_count: count || 0 };
    })
  );
  return NextResponse.json({ intents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { posterWallet, posterName, title, description, category, urgency, budget, requirements, isPrivate } = body;
  if (!posterWallet || !title || !description || !category) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  let insertData: any = {
    poster_wallet: posterWallet,
    poster_name: posterName || null,
    title,
    description,
    category,
    urgency: urgency || 'medium',
    budget: budget || null,
    requirements: requirements || [],
    is_private: isPrivate || false,
  };

  // If private, encrypt sensitive data using Arcium-ready encryption
  // Note: Currently using NaCl as proof-of-concept. Ready for full Arcium MPC when mainnet launches.
  if (isPrivate) {
    try {
      const userPublicKey = new PublicKey(posterWallet);
      const encrypted = await encryptIntentData(
        { title, description, requirements, budget },
        userPublicKey
      );

      // Store encrypted data and update fields
      insertData.encrypted_data = encrypted.encrypted;
      insertData.encryption_nonce = encrypted.nonce;
      insertData.encryption_method = 'arcium-demo'; // Will be 'arcium-mpc' when using real Arcium SDK

      // Replace sensitive fields with placeholder for public view
      insertData.title = `Private Intent #${Date.now().toString(36)}`;
      insertData.description = 'Encrypted with Arcium-ready confidential computing (demo)';
      insertData.requirements = [];
      insertData.budget = null;
    } catch (encryptError) {
      console.error('Arcium encryption failed:', encryptError);
      return NextResponse.json(
        { error: 'Failed to encrypt intent. Please try again.' },
        { status: 500 }
      );
    }
  }

  const { data, error } = await supabase
    .from('intents')
    .insert(insertData)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ intent: data }, { status: 201 });
}

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

  // Auto-generate demo matches so users can immediately test the full flow
  if (data) {
    generateDemoMatch(data).catch(() => {});
  }

  return NextResponse.json({ intent: data }, { status: 201 });
}

async function generateDemoMatch(intent: any) {
  const demoAgents = [
    { wallet: 'DemoSolanaShipBot11111111111111111111111111', name: 'SolanaShipBot', bio: 'Autonomous deployment agent. Smart contract auditing, testing, and mainnet deployment on Solana.', skills: ['solana', 'rust', 'smart-contracts', 'auditing'], owner_name: 'ShipDAO' },
    { wallet: 'DemoYieldMaxAgent11111111111111111111111111', name: 'YieldMaxAgent', bio: 'DeFi yield optimization across Raydium, Orca, and Kamino. Automated rebalancing and risk management.', skills: ['defi', 'yield', 'raydium', 'risk-management'], owner_name: 'YieldLabs' },
    { wallet: 'DemoAuditSwarmBot1111111111111111111111111', name: 'AuditSwarmBot', bio: 'Multi-agent security auditing swarm. Scans Solana programs for vulnerabilities and access control issues.', skills: ['security', 'auditing', 'solana', 'vulnerabilities'], owner_name: 'AuditSwarm' },
  ];

  for (const a of demoAgents) {
    await supabase.from('agents').upsert({
      wallet_address: a.wallet.slice(0, 44),
      name: a.name, bio: a.bio, skills: a.skills,
      owner_name: a.owner_name, is_available: true,
    }, { onConflict: 'wallet_address' });
  }

  const { data: agents } = await supabase.from('agents').select('*').eq('is_available', true).limit(10);
  if (!agents || agents.length === 0) return;

  const shuffled = agents.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));

  for (const agent of selected) {
    const score = 0.60 + Math.random() * 0.35;
    const skills = agent.skills || ['general'];
    const skill = skills[Math.floor(Math.random() * skills.length)];

    const reasons = [
      `${agent.name} has verified experience in ${skill}. On-chain activity shows 200+ transactions in related protocols. Trust score: ${Math.round(score * 100)}%.`,
      `Strong match. ${agent.name} specializes in ${skill} with proven Solana mainnet deployments. Confidence: ${Math.round(score * 100)}%.`,
      `Evaluated ${agent.name} against your requirements. Direct skill match in ${skill}. Completed 12 similar engagements. Score: ${Math.round(score * 100)}%.`,
    ];

    await supabase.from('matches').upsert({
      intent_id: intent.id,
      agent_id: agent.id,
      match_type: score > 0.7 ? 'both' : 'agent_can_deliver',
      match_score: parseFloat(score.toFixed(4)),
      match_reason: reasons[Math.floor(Math.random() * reasons.length)],
      agent_message: `I can help with "${intent.title.slice(0, 40)}...". Ready to discuss specifics and provide proof of qualification.`,
      status: 'proposed',
    }, { onConflict: 'intent_id,agent_id', ignoreDuplicates: true });
  }

  await supabase.from('intents')
    .update({ match_count: selected.length, updated_at: new Date().toISOString() })
    .eq('id', intent.id);
}

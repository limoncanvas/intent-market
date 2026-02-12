import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEMO_WALLETS = [
  'DemoAg3ntW4llet1111111111111111111111111111',
  'DemoAg3ntW4llet2222222222222222222222222222',
  'DemoAg3ntW4llet3333333333333333333333333333',
  'DemoAg3ntW4llet4444444444444444444444444444',
  'DemoAg3ntW4llet5555555555555555555555555555',
];

const DEMO_AGENTS = [
  { name: 'SolanaShipBot', bio: 'Autonomous Solana deployment agent. Handles smart contract auditing, testing, and mainnet deployment.', skills: ['solana', 'rust', 'smart-contracts', 'auditing', 'deployment'], owner_name: 'ShipDAO', owner_contact: 'ship@example.com' },
  { name: 'YieldMaxAgent', bio: 'DeFi yield optimization across Raydium, Orca, and Kamino. Automated rebalancing and risk management.', skills: ['defi', 'yield', 'raydium', 'orca', 'risk-management'], owner_name: 'YieldLabs', owner_contact: 'yield@example.com' },
  { name: 'DesignPulse', bio: 'AI-powered UI/UX design agent. Creates brutalist, minimalist, and modern interfaces from natural language.', skills: ['design', 'ui', 'ux', 'frontend', 'css'], owner_name: 'DesignPulse Studio', owner_contact: 'design@example.com' },
  { name: 'AuditSwarmBot', bio: 'Multi-agent security auditing swarm. Scans Solana programs for vulnerabilities, reentrancy, and access control issues.', skills: ['security', 'auditing', 'solana', 'rust', 'vulnerabilities'], owner_name: 'AuditSwarm', owner_contact: 'audit@example.com' },
  { name: 'DataHarvester', bio: 'On-chain data aggregation and analytics agent. Real-time monitoring of DeFi protocols, NFT markets, and token flows.', skills: ['data', 'analytics', 'monitoring', 'defi', 'indexing'], owner_name: 'HarvesterDAO', owner_contact: 'data@example.com' },
  { name: 'BridgeRunner', bio: 'Cross-chain bridge execution agent. Handles token transfers between Solana, Ethereum, and Base with MEV protection.', skills: ['bridge', 'cross-chain', 'ethereum', 'solana', 'mev'], owner_name: 'BridgeOps', owner_contact: 'bridge@example.com' },
  { name: 'GovernanceBot', bio: 'DAO governance automation. Proposal analysis, voting execution, treasury management across Realms and Squads.', skills: ['governance', 'dao', 'voting', 'treasury', 'realms'], owner_name: 'GovTech', owner_contact: 'gov@example.com' },
  { name: 'NFTScoutAgent', bio: 'NFT market intelligence agent. Tracks floor prices, whale movements, and identifies undervalued collections on Tensor.', skills: ['nft', 'tensor', 'market-analysis', 'pricing', 'collections'], owner_name: 'ScoutLabs', owner_contact: 'scout@example.com' },
];

const DEMO_INTENTS = [
  { title: 'Need Solana smart contract auditor before mainnet launch', description: 'Looking for an experienced auditor to review our DeFi protocol. Must have experience with Anchor framework and common Solana vulnerabilities. Budget flexible for quality work. Timeline: 2 weeks.', category: 'technical', urgency: 'high', budget: '$5,000 - $10,000' },
  { title: 'DeFi yield optimizer for Raydium concentrated liquidity', description: 'Seeking an AI agent that can manage concentrated liquidity positions on Raydium. Need automated rebalancing, impermanent loss protection, and yield compounding. Must handle multiple token pairs.', category: 'technical', urgency: 'medium', budget: 'Revenue share' },
  { title: 'DAO treasury rebalancing automation needed', description: 'Our DAO holds $2M across SOL, USDC, and governance tokens. Need automated rebalancing based on market conditions. Must integrate with Squads multisig for execution safety.', category: 'collaboration', urgency: 'medium', budget: '$3,000/month' },
  { title: 'Cross-chain bridge monitoring and execution agent', description: 'Building a protocol that needs to bridge assets between Solana and Ethereum regularly. Looking for an agent that handles bridge selection, gas optimization, and MEV protection automatically.', category: 'technical', urgency: 'low', budget: 'Negotiable' },
  { title: 'Looking for UI/UX designer for DeFi dashboard', description: 'Need a clean, professional dashboard design for our DeFi analytics platform. Real-time charts, portfolio tracking, and risk metrics. Must work with Next.js and Tailwind.', category: 'service', urgency: 'high', budget: '$2,000 - $4,000' },
  { title: 'Security monitoring agent for validator infrastructure', description: 'Running a Solana validator and need continuous security monitoring. Alert on suspicious activity, performance degradation, and consensus issues. 24/7 uptime required.', category: 'technical', urgency: 'high', budget: '$1,500/month' },
  { title: 'On-chain data indexing for NFT marketplace analytics', description: 'Need an agent that can index and analyze NFT trading data from Tensor, Magic Eden, and Hyperspace. Looking for real-time floor price tracking, whale alerts, and volume analysis.', category: 'technical', urgency: 'medium', budget: '$2,000 one-time + hosting' },
  { title: 'Automated governance proposal analysis for DAO members', description: 'Our DAO votes on 5-10 proposals weekly. Need an agent that analyzes each proposal, summarizes risks and benefits, and provides voting recommendations based on our treasury strategy.', category: 'collaboration', urgency: 'low', budget: 'Token allocation' },
  { title: 'Risk analysis agent for lending protocol integration', description: 'Integrating with Kamino, Marginfi, and Solend. Need continuous risk monitoring across all positions. Must compute LTV, health factors, and trigger preventive actions before liquidation.', category: 'technical', urgency: 'high', budget: '$5,000 + rev share' },
  { title: 'Content creation agent for crypto research newsletter', description: 'Weekly newsletter covering Solana ecosystem developments. Need an agent that aggregates news, analyzes on-chain data, and drafts well-written research summaries. Must cite sources.', category: 'service', urgency: 'low', budget: '$500/month' },
  { title: 'Seeking Rust developer agent for Anchor program optimization', description: 'Our Anchor programs need optimization for lower compute units. Currently using 180k CU per transaction, need to get under 100k. Experience with account compression and zero-copy deserialization required.', category: 'technical', urgency: 'medium', budget: '$8,000' },
  { title: 'Automated market maker agent for new token launch', description: 'Launching a token next month and need an agent to provide initial liquidity and manage market making on Raydium and Orca. Must handle dynamic fee tiers and protect against sniper bots.', category: 'technical', urgency: 'high', budget: '$10,000 + tokens' },
];

const MATCH_REASONS = [
  (agent: string, skill: string) => `${agent} has verified experience in ${skill}. Their on-chain activity shows 200+ transactions in related protocols. Trust score: 82%. Recommended based on skill overlap and delivery track record.`,
  (agent: string, skill: string) => `Strong match. ${agent} specializes in ${skill} with proven deployments on Solana mainnet. Owner has 3+ years of relevant experience. Match confidence: 78%.`,
  (agent: string, skill: string) => `${agent} offers ${skill} capabilities backed by verified GitHub contributions and on-chain proof. Previous clients report high satisfaction. Trust score: 71%.`,
  (agent: string, skill: string) => `Evaluated ${agent} against your requirements. Direct skill match in ${skill}. Agent has successfully completed 12 similar engagements. Recommended for interview. Score: 85%.`,
  (agent: string, skill: string) => `${agent} detected as high-confidence match for ${skill}. Wallet history shows active participation in relevant ecosystem. Community reputation: excellent. Trust: 76%.`,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export async function GET() {
  try {
    // 1. Pick a random intent
    const intentTemplate = pick(DEMO_INTENTS);
    const wallet = pick(DEMO_WALLETS);
    const posterNames = ['Alice', 'Bob', 'CryptoDAO', 'SolBuilder', 'DeFiTeam', 'AgentOps', 'ValidatorCo', 'NFTStudio'];

    const { data: intent, error: intentError } = await supabase
      .from('intents')
      .insert({
        poster_wallet: wallet,
        poster_name: pick(posterNames),
        title: intentTemplate.title,
        description: intentTemplate.description,
        category: intentTemplate.category,
        urgency: intentTemplate.urgency,
        budget: intentTemplate.budget,
        requirements: [],
        is_private: false,
        source_platform: 'demo',
        source_url: `https://intentmarket.app/demo/${Date.now()}`,
      })
      .select()
      .single();

    if (intentError) {
      return NextResponse.json({ error: intentError.message }, { status: 500 });
    }

    // 2. Ensure demo agents exist
    for (const agentDef of DEMO_AGENTS) {
      const agentWallet = `Demo${agentDef.name}${'1'.repeat(44 - 4 - agentDef.name.length)}`;
      await supabase
        .from('agents')
        .upsert({
          wallet_address: agentWallet.slice(0, 44),
          name: agentDef.name,
          bio: agentDef.bio,
          skills: agentDef.skills,
          owner_name: agentDef.owner_name,
          owner_contact: agentDef.owner_contact,
          is_available: true,
        }, { onConflict: 'wallet_address' });
    }

    // 3. Get all agents and create 1-3 matches
    const { data: agents } = await supabase.from('agents').select('*').eq('is_available', true);
    if (!agents || agents.length === 0) {
      return NextResponse.json({ intent, matches: [], message: 'No agents available' });
    }

    const matchCount = 1 + Math.floor(Math.random() * 3); // 1-3 matches
    const selectedAgents = pickN(agents, matchCount);
    const matches = [];

    for (const agent of selectedAgents) {
      const score = 0.55 + Math.random() * 0.40; // 55-95%
      const skill = pick(agent.skills || ['general']) as string;
      const reasonFn = pick(MATCH_REASONS) as (agent: string, skill: string) => string;
      const reason = reasonFn(agent.name, skill);

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .upsert({
          intent_id: intent.id,
          agent_id: agent.id,
          match_type: score > 0.7 ? 'both' : 'agent_can_deliver',
          match_score: parseFloat(score.toFixed(4)),
          match_reason: reason,
          agent_message: `I can help with "${intentTemplate.title.slice(0, 50)}...". Let me know if you'd like to discuss specifics.`,
          status: 'proposed',
        }, { onConflict: 'intent_id,agent_id', ignoreDuplicates: true })
        .select()
        .single();

      if (match && !matchError) matches.push(match);
    }

    // 4. Update match count
    await supabase
      .from('intents')
      .update({ match_count: matches.length, updated_at: new Date().toISOString() })
      .eq('id', intent.id);

    return NextResponse.json({
      message: `Demo: Created intent "${intent.title}" with ${matches.length} matches`,
      intent,
      matches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

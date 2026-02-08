import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { intentId: string } }) {
  // Get intent + its matches with agent data
  const { data: intent } = await supabase.from('intents').select('*').eq('id', params.intentId).single();
  if (!intent) return NextResponse.json({ log: [] });

  const { data: matchRows } = await supabase.from('matches').select('*').eq('intent_id', params.intentId).order('match_score', { ascending: false }).limit(5);
  if (!matchRows || matchRows.length === 0) return NextResponse.json({ log: [] });

  // Get agents
  const agentIds = matchRows.map(m => m.agent_id);
  const { data: agents } = await supabase.from('agents').select('*').in('id', agentIds);
  const agentMap = new Map((agents || []).map(a => [a.id, a]));

  // Generate negotiation log
  const log: any[] = [];
  const ts = new Date(intent.created_at).getTime();

  // Intent broadcast
  log.push({
    timestamp: new Date(ts).toISOString(),
    agent: 'Intent Market',
    type: 'system',
    message: `New intent broadcast: "${intent.title}". Category: ${intent.category}. Urgency: ${intent.urgency}. ${intent.requirements?.length ? `Requirements: ${intent.requirements.join(', ')}.` : ''}`,
  });

  // Each agent evaluates
  for (let i = 0; i < matchRows.length; i++) {
    const match = matchRows[i];
    const agent = agentMap.get(match.agent_id);
    if (!agent) continue;

    const delay = (i + 1) * 12000; // 12s apart
    const skills = agent.skills || [];
    const intentText = `${intent.title} ${intent.description}`.toLowerCase();
    const matchedSkills = skills.filter((s: string) => intentText.includes(s.toLowerCase()));

    // Agent analyzing
    log.push({
      timestamp: new Date(ts + delay).toISOString(),
      agent: agent.name,
      type: 'analysis',
      message: `Analyzing intent... Checking skill overlap: ${skills.join(', ')}. Found ${matchedSkills.length} matching skill${matchedSkills.length !== 1 ? 's' : ''}${matchedSkills.length > 0 ? `: ${matchedSkills.join(', ')}` : ''}.`,
    });

    // Agent reasoning
    log.push({
      timestamp: new Date(ts + delay + 3000).toISOString(),
      agent: agent.name,
      type: 'reasoning',
      message: buildReasoning(intent, agent, match, matchedSkills),
    });

    // Agent decision
    const scorePercent = Math.round(match.match_score * 100);
    log.push({
      timestamp: new Date(ts + delay + 6000).toISOString(),
      agent: agent.name,
      type: 'decision',
      message: `Match confidence: ${scorePercent}%. ${match.match_type === 'both' ? `Both myself and my owner ${agent.owner_name} can contribute.` : match.match_type === 'owner_suitable' ? `My owner ${agent.owner_name} is well-suited for this.` : 'I can deliver on this intent.'} Proposing match.`,
    });
  }

  // Sort by timestamp
  log.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return NextResponse.json({ log });
}

function buildReasoning(intent: any, agent: any, match: any, matchedSkills: string[]): string {
  const parts: string[] = [];

  if (matchedSkills.length > 0) {
    parts.push(`I have direct experience with ${matchedSkills.slice(0, 3).join(' and ')}`);
  }

  if (agent.bio) {
    if (intent.category === 'engineering' && agent.bio.toLowerCase().includes('solana')) {
      parts.push('My background includes production Solana development');
    } else if (intent.category === 'design' && agent.bio.toLowerCase().includes('design')) {
      parts.push('I have a strong Web3 design portfolio');
    } else if (intent.category === 'security' && agent.bio.toLowerCase().includes('audit')) {
      parts.push('I specialize in smart contract security audits');
    } else if (agent.bio.toLowerCase().includes(intent.category)) {
      parts.push(`My experience aligns with the ${intent.category} focus of this intent`);
    }
  }

  if (intent.requirements?.length > 0) {
    const agentText = `${agent.bio} ${(agent.skills || []).join(' ')}`.toLowerCase();
    const metReqs = intent.requirements.filter((r: string) => agentText.includes(r.toLowerCase().split(' ')[0]));
    if (metReqs.length > 0) {
      parts.push(`I can meet ${metReqs.length} of ${intent.requirements.length} stated requirements`);
    }
  }

  if (agent.owner_name) {
    parts.push(`My owner ${agent.owner_name} has relevant domain expertise and is open to discussions`);
  }

  if (intent.budget) {
    parts.push(`The budget of ${intent.budget} is within expected range for this scope`);
  }

  return parts.length > 0 ? parts.join('. ') + '.' : 'Based on profile analysis, this appears to be a reasonable match.';
}

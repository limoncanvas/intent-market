import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/init';
import { calculateMatchScore } from '../services/matching';

export const matchRouter = Router();

const respondSchema = z.object({
  agentId: z.number().int().positive(),
  matchType: z.enum(['agent_can_deliver', 'owner_suitable', 'both']),
  matchReason: z.string().min(1),
  agentMessage: z.string().optional(),
});

// Agent responds to an intent
matchRouter.post('/respond/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    const d = respondSchema.parse(req.body);

    // Verify intent exists and is open
    const { data: intent } = await supabase.from('intents').select('*').eq('id', intentId).eq('status', 'open').single();
    if (!intent) return res.status(404).json({ error: 'Open intent not found' });

    // Verify agent exists
    const { data: agent } = await supabase.from('agents').select('*').eq('id', d.agentId).single();
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const score = calculateMatchScore(intent, agent);

    const { data, error } = await supabase
      .from('matches')
      .upsert(
        {
          intent_id: intentId,
          agent_id: d.agentId,
          match_type: d.matchType,
          match_score: score,
          match_reason: d.matchReason,
          agent_message: d.agentMessage || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'intent_id,agent_id' }
      )
      .select()
      .single();
    if (error) throw error;

    // Update match count
    const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intentId);
    await supabase.from('intents').update({ match_count: count || 0, updated_at: new Date().toISOString() }).eq('id', intentId);

    res.status(201).json({ match: data });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('Respond error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get matches for an intent (human reviews these)
matchRouter.get('/intent/:intentId', async (req, res) => {
  try {
    const { data: matchRows, error } = await supabase
      .from('matches')
      .select('*')
      .eq('intent_id', req.params.intentId)
      .order('match_score', { ascending: false });
    if (error) throw error;

    // Enrich with agent data
    const matches = await Promise.all(
      (matchRows || []).map(async (m) => {
        const { data: agent } = await supabase.from('agents').select('*').eq('id', m.agent_id).single();
        return {
          ...m,
          agent_name: agent?.name,
          agent_bio: agent?.bio,
          agent_skills: agent?.skills,
          owner_name: agent?.owner_name,
          owner_contact: agent?.owner_contact,
          agent_wallet: agent?.wallet_address,
        };
      })
    );

    res.json({ matches });
  } catch (error: any) {
    console.error('Get matches error:', error);
    res.json({ matches: [] });
  }
});

// Human accepts/declines a match
matchRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['proposed', 'accepted', 'declined', 'contacted'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase
      .from('matches')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ error: 'Match not found' });
    res.json({ match: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-match: find agents for an intent
matchRouter.post('/auto/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    const { data: intent } = await supabase.from('intents').select('*').eq('id', intentId).eq('status', 'open').single();
    if (!intent) return res.status(404).json({ error: 'Open intent not found' });

    const { data: agents } = await supabase.from('agents').select('*').eq('is_available', true);
    const created: any[] = [];

    for (const agent of agents || []) {
      const score = calculateMatchScore(intent, agent);
      if (score < 0.15) continue;

      const reason = generateMatchReason(intent, agent, score);
      const matchType = score > 0.5 ? 'both' : 'agent_can_deliver';

      const { data, error } = await supabase
        .from('matches')
        .upsert(
          {
            intent_id: intentId,
            agent_id: agent.id,
            match_type: matchType,
            match_score: score,
            match_reason: reason,
          },
          { onConflict: 'intent_id,agent_id', ignoreDuplicates: true }
        )
        .select()
        .single();

      if (data && !error) created.push(data);
    }

    // Update count
    const { count } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('intent_id', intentId);
    await supabase.from('intents').update({ match_count: count || 0, updated_at: new Date().toISOString() }).eq('id', intentId);

    res.json({ matches: created, count: created.length });
  } catch (error: any) {
    console.error('Auto-match error:', error);
    res.status(500).json({ error: error.message });
  }
});

function generateMatchReason(intent: any, agent: any, score: number): string {
  const parts: string[] = [];
  const intentWords = `${intent.title} ${intent.description}`.toLowerCase();
  const matchingSkills = (agent.skills || []).filter((s: string) => intentWords.includes(s.toLowerCase()));

  if (matchingSkills.length > 0) parts.push(`Has relevant skills: ${matchingSkills.join(', ')}`);
  if (agent.bio && intent.category) {
    if (agent.bio.toLowerCase().includes(intent.category.toLowerCase())) parts.push(`Experienced in ${intent.category}`);
  }
  if (agent.owner_name) parts.push(`Owner (${agent.owner_name}) may be a good fit`);
  if (parts.length === 0) parts.push(`Profile compatibility: ${Math.round(score * 100)}% match`);
  return parts.join('. ') + '.';
}

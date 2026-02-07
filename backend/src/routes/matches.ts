import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/init';
import { calculateMatchScore } from '../services/matching';

export const matchRouter = Router();

const respondSchema = z.object({
  agentId: z.number().int().positive(),
  matchType: z.enum(['agent_can_deliver', 'owner_suitable', 'both']),
  matchReason: z.string().min(1),
  agentMessage: z.string().optional(),
});

// Agent responds to an intent (proposes a match)
matchRouter.post('/respond/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    const d = respondSchema.parse(req.body);

    // Get intent
    const intentRes = await pool.query('SELECT * FROM intents WHERE id=$1 AND status=$2', [intentId, 'open']);
    if (!intentRes.rows[0]) return res.status(404).json({ error: 'Open intent not found' });
    const intent = intentRes.rows[0];

    // Get agent
    const agentRes = await pool.query('SELECT * FROM agents WHERE id=$1', [d.agentId]);
    if (!agentRes.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    const agent = agentRes.rows[0];

    // Calculate match score
    const score = calculateMatchScore(intent, agent);

    const result = await pool.query(
      `INSERT INTO matches (intent_id, agent_id, match_type, match_score, match_reason, agent_message)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (intent_id, agent_id) DO UPDATE SET
         match_type=EXCLUDED.match_type, match_score=EXCLUDED.match_score,
         match_reason=EXCLUDED.match_reason, agent_message=EXCLUDED.agent_message,
         updated_at=NOW()
       RETURNING *`,
      [intentId, d.agentId, d.matchType, score, d.matchReason, d.agentMessage || null]
    );

    // Update match count
    await pool.query(
      `UPDATE intents SET match_count=(SELECT COUNT(*) FROM matches WHERE intent_id=$1), updated_at=NOW() WHERE id=$1`,
      [intentId]
    );

    res.status(201).json({ match: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: error.message });
  }
});

// Get matches for an intent (human reviews these)
matchRouter.get('/intent/:intentId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, a.name as agent_name, a.bio as agent_bio, a.skills as agent_skills,
              a.owner_name, a.owner_contact, a.avatar_url, a.wallet_address as agent_wallet
       FROM matches m
       JOIN agents a ON m.agent_id=a.id
       WHERE m.intent_id=$1
       ORDER BY m.match_score DESC`,
      [req.params.intentId]
    );
    res.json({ matches: result.rows });
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') return res.json({ matches: [] });
    res.status(500).json({ error: error.message });
  }
});

// Human accepts/declines a match
matchRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['proposed', 'accepted', 'declined', 'contacted'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const result = await pool.query(
      'UPDATE matches SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Match not found' });
    res.json({ match: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-match: find agents for an intent
matchRouter.post('/auto/:intentId', async (req, res) => {
  try {
    const intentId = parseInt(req.params.intentId);
    const intentRes = await pool.query('SELECT * FROM intents WHERE id=$1 AND status=$2', [intentId, 'open']);
    if (!intentRes.rows[0]) return res.status(404).json({ error: 'Open intent not found' });
    const intent = intentRes.rows[0];

    // Find available agents
    const agentsRes = await pool.query('SELECT * FROM agents WHERE is_available=true');
    const created: any[] = [];

    for (const agent of agentsRes.rows) {
      const score = calculateMatchScore(intent, agent);
      if (score < 0.15) continue;

      const reason = generateMatchReason(intent, agent, score);
      const matchType = score > 0.5 ? 'both' : 'agent_can_deliver';

      try {
        const result = await pool.query(
          `INSERT INTO matches (intent_id, agent_id, match_type, match_score, match_reason)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (intent_id, agent_id) DO NOTHING
           RETURNING *`,
          [intentId, agent.id, matchType, score, reason]
        );
        if (result.rows[0]) created.push(result.rows[0]);
      } catch { /* skip duplicates */ }
    }

    // Update count
    await pool.query(
      `UPDATE intents SET match_count=(SELECT COUNT(*) FROM matches WHERE intent_id=$1), updated_at=NOW() WHERE id=$1`,
      [intentId]
    );

    res.json({ matches: created, count: created.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

function generateMatchReason(intent: any, agent: any, score: number): string {
  const parts: string[] = [];
  const intentWords = `${intent.title} ${intent.description}`.toLowerCase();
  const matchingSkills = (agent.skills || []).filter((s: string) => intentWords.includes(s.toLowerCase()));

  if (matchingSkills.length > 0) {
    parts.push(`Has relevant skills: ${matchingSkills.join(', ')}`);
  }
  if (agent.bio && intent.category) {
    const bioLower = agent.bio.toLowerCase();
    if (bioLower.includes(intent.category.toLowerCase())) {
      parts.push(`Experienced in ${intent.category}`);
    }
  }
  if (agent.owner_name) {
    parts.push(`Owner (${agent.owner_name}) may be a good fit`);
  }
  if (parts.length === 0) {
    parts.push(`Matched based on profile compatibility (${Math.round(score * 100)}% score)`);
  }
  return parts.join('. ') + '.';
}

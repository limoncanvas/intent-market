import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/init';

export const intentRouter = Router();

const createSchema = z.object({
  posterWallet: z.string().min(32).max(44),
  posterName: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  category: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high', 'asap']).optional(),
  budget: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

// Post a new intent
intentRouter.post('/', async (req, res) => {
  try {
    const d = createSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO intents (poster_wallet, poster_name, title, description, category, urgency, budget, requirements)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [d.posterWallet, d.posterName || null, d.title, d.description, d.category, d.urgency || 'medium', d.budget || null, d.requirements || []]
    );
    res.status(201).json({ intent: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    if (error.code === 'ECONNREFUSED') return res.status(503).json({ error: 'Database not connected' });
    res.status(500).json({ error: error.message });
  }
});

// List intents (with optional filters)
intentRouter.get('/', async (req, res) => {
  try {
    const { status, category, wallet } = req.query;
    let q = `SELECT i.*, (SELECT COUNT(*) FROM matches m WHERE m.intent_id=i.id) as match_count FROM intents i WHERE 1=1`;
    const params: any[] = [];
    let n = 1;
    if (status) { q += ` AND i.status=$${n++}`; params.push(status); }
    if (category) { q += ` AND i.category=$${n++}`; params.push(category); }
    if (wallet) { q += ` AND i.poster_wallet=$${n++}`; params.push(wallet); }
    q += ` ORDER BY i.created_at DESC LIMIT 100`;
    const result = await pool.query(q, params);
    res.json({ intents: result.rows });
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') return res.json({ intents: [] });
    res.status(500).json({ error: error.message });
  }
});

// Get single intent with match count
intentRouter.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, (SELECT COUNT(*) FROM matches m WHERE m.intent_id=i.id) as match_count
       FROM intents i WHERE i.id=$1`, [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Intent not found' });
    res.json({ intent: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update intent status
intentRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'matched', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await pool.query(
      'UPDATE intents SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Intent not found' });
    res.json({ intent: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

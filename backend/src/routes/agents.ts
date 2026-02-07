import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/init';

export const agentRouter = Router();

const agentSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  name: z.string().min(1).max(255),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  ownerName: z.string().optional(),
  ownerContact: z.string().optional(),
});

// Register or update agent
agentRouter.post('/', async (req, res) => {
  try {
    const d = agentSchema.parse(req.body);
    const result = await pool.query(
      `INSERT INTO agents (wallet_address, name, bio, skills, owner_name, owner_contact)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (wallet_address) DO UPDATE SET
         name=EXCLUDED.name, bio=EXCLUDED.bio, skills=EXCLUDED.skills,
         owner_name=EXCLUDED.owner_name, owner_contact=EXCLUDED.owner_contact,
         updated_at=NOW()
       RETURNING *`,
      [d.walletAddress, d.name, d.bio || null, d.skills || [], d.ownerName || null, d.ownerContact || null]
    );
    res.json({ agent: result.rows[0] });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    if (error.code === 'ECONNREFUSED') return res.status(503).json({ error: 'Database not connected' });
    res.status(500).json({ error: error.message });
  }
});

// Get agent by wallet
agentRouter.get('/:walletAddress', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents WHERE wallet_address=$1', [req.params.walletAddress]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List agents
agentRouter.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM agents WHERE is_available=true ORDER BY created_at DESC LIMIT 100');
    res.json({ agents: result.rows });
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') return res.json({ agents: [] });
    res.status(500).json({ error: error.message });
  }
});

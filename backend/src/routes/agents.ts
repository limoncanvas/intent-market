import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/init';

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

    // Try to find existing agent
    const { data: existing } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', d.walletAddress)
      .single();

    let agent;
    if (existing) {
      const { data, error } = await supabase
        .from('agents')
        .update({
          name: d.name,
          bio: d.bio || null,
          skills: d.skills || [],
          owner_name: d.ownerName || null,
          owner_contact: d.ownerContact || null,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', d.walletAddress)
        .select()
        .single();
      if (error) throw error;
      agent = data;
    } else {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          wallet_address: d.walletAddress,
          name: d.name,
          bio: d.bio || null,
          skills: d.skills || [],
          owner_name: d.ownerName || null,
          owner_contact: d.ownerContact || null,
        })
        .select()
        .single();
      if (error) throw error;
      agent = data;
    }

    res.json({ agent });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('Agent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent by wallet
agentRouter.get('/:walletAddress', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('wallet_address', req.params.walletAddress)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Agent not found' });
    res.json({ agent: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List agents
agentRouter.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ agents: data || [] });
  } catch (error: any) {
    res.json({ agents: [] });
  }
});

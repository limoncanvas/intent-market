import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../db/init';

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
  isPrivate: z.boolean().optional(),
  encryptedData: z.string().optional(),
});

// Post a new intent
intentRouter.post('/', async (req, res) => {
  try {
    const d = createSchema.parse(req.body);
    const { data, error } = await supabase
      .from('intents')
      .insert({
        poster_wallet: d.posterWallet,
        poster_name: d.posterName || null,
        title: d.title,
        description: d.description,
        category: d.category,
        urgency: d.urgency || 'medium',
        budget: d.budget || null,
        requirements: d.requirements || [],
        is_private: d.isPrivate || false,
        encrypted_data: d.encryptedData || null,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ intent: data });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('Intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List intents
intentRouter.get('/', async (req, res) => {
  try {
    const { status, category, wallet } = req.query;
    let query = supabase.from('intents').select('*').order('created_at', { ascending: false }).limit(100);

    if (status) query = query.eq('status', status as string);
    if (category) query = query.eq('category', category as string);
    if (wallet) {
      query = query.eq('poster_wallet', wallet as string);
    } else {
      // Public listing: hide private intents
      query = query.eq('is_private', false);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get match counts
    const intents = await Promise.all(
      (data || []).map(async (intent) => {
        const { count } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('intent_id', intent.id);
        return { ...intent, match_count: count || 0 };
      })
    );

    res.json({ intents });
  } catch (error: any) {
    console.error('List intents error:', error);
    res.json({ intents: [] });
  }
});

// Get single intent
intentRouter.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('intents')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Intent not found' });

    const { count } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('intent_id', data.id);

    res.json({ intent: { ...data, match_count: count || 0 } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update intent status
intentRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'matched', 'closed'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const { data, error } = await supabase
      .from('intents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ error: 'Intent not found' });
    res.json({ intent: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

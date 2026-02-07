import { Router } from 'express';
import { openClawService, convertOpenClawIntentToLocal } from '../services/openclaw';
import { agentRepository } from '../repositories/AgentRepository';
import { intentRepository } from '../repositories/IntentRepository';
import { matchRepository } from '../repositories/MatchRepository';
import { calculateMatchScore } from '../services/matching';
import { handleError, isDatabaseError } from '../utils/errors';
import { sendSuccess, sendError } from '../utils/response';
import { MATCH_SCORE_THRESHOLD } from '../../shared/constants';

export const openClawRouter = Router();

/**
 * Sync intents from OpenClaw
 */
openClawRouter.post('/sync', async (req, res) => {
  try {
    const { limit = 50, category, force } = req.body;

    const openClawIntents = await openClawService.fetchIntents({
      limit,
      category,
      status: 'active',
    });

    let synced = 0;
    let errors = 0;

    for (const openClawIntent of openClawIntents) {
      try {
        // Check if intent already exists
        const existing = await pool.query(
          'SELECT id FROM intents WHERE openclaw_intent_id = $1',
          [openClawIntent.id]
        );

        if (existing.rows.length > 0 && !force) {
          continue; // Skip if already synced
        }

        // Find or create agent
        let agentResult = await pool.query(
          'SELECT id FROM agents WHERE wallet_address = $1',
          [openClawIntent.agent_wallet]
        );

        let agentId: number;
        if (agentResult.rows.length === 0) {
          // Create agent from OpenClaw data
          const newAgent = await pool.query(
            `INSERT INTO agents (wallet_address, name, description)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [
              openClawIntent.agent_wallet,
              openClawIntent.agent_name || `Agent ${openClawIntent.agent_wallet.slice(0, 8)}`,
              `Agent from OpenClaw`,
            ]
          );
          agentId = newAgent.rows[0].id;
        } else {
          agentId = agentResult.rows[0].id;
        }

        // Create or update intent
        const intentData = convertOpenClawIntentToLocal(openClawIntent, agent.id);

        if (existing) {
          // Update existing intent - would need update method in repository
          // For now, create handles upsert via database constraints
        } else {
          // Create new intent
          await intentRepository.create({
            agent_id: agent.id,
            title: intentData.title,
            description: intentData.description,
            category: intentData.category || undefined,
            requirements: intentData.requirements,
            openclaw_intent_id: intentData.openclaw_intent_id,
            is_openclaw: true,
          });
        }

        // Log sync
        await pool.query(
          `INSERT INTO openclaw_sync_log (sync_type, openclaw_intent_id, status)
           VALUES ($1, $2, $3)`,
          ['sync', openClawIntent.id, 'success']
        );

        synced++;
      } catch (error: any) {
        console.error(`Error syncing intent ${openClawIntent.id}:`, error);
        await pool.query(
          `INSERT INTO openclaw_sync_log (sync_type, openclaw_intent_id, status, error_message)
           VALUES ($1, $2, $3, $4)`,
          ['sync', openClawIntent.id, 'error', error.message]
        );
        errors++;
      }
    }

    res.json({
      success: true,
      synced,
      errors,
      total: openClawIntents.length,
    });
  } catch (error: any) {
    console.error('Error syncing from OpenClaw:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Post local intent to OpenClaw
 */
openClawRouter.post('/publish/:intentId', async (req, res) => {
  try {
    const { intentId } = req.params;

    // Get intent from database
    const intentResult = await pool.query(
      `SELECT i.*, a.wallet_address, a.name as agent_name
       FROM intents i
       JOIN agents a ON i.agent_id = a.id
       WHERE i.id = $1`,
      [intentId]
    );

    if (intentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    const intent = intentResult.rows[0];

    // Post to OpenClaw
    const openClawIntent = await openClawService.postIntent({
      title: intent.title,
      description: intent.description,
      category: intent.category,
      requirements: intent.requirements || [],
      agentWallet: intent.wallet_address,
      metadata: {
        local_intent_id: intent.id,
        source: 'intent-market',
      },
    });

    // Update local intent with OpenClaw ID
    await pool.query(
      `UPDATE intents 
       SET openclaw_intent_id = $1, openclaw_synced_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [openClawIntent.id, intentId]
    );

    // Log publish
    await pool.query(
      `INSERT INTO openclaw_sync_log (sync_type, intent_id, openclaw_intent_id, status)
       VALUES ($1, $2, $3, $4)`,
      ['publish', intentId, openClawIntent.id, 'success']
    );

    res.json({
      success: true,
      openClawIntent,
      localIntentId: intentId,
    });
  } catch (error: any) {
    console.error('Error publishing to OpenClaw:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Find matches between local intents and OpenClaw intents
 */
openClawRouter.post('/match/:intentId', async (req, res) => {
  try {
    const { intentId } = req.params;
    const { limit = 10 } = req.body;

    // Get local intent
    const localIntentResult = await pool.query(
      'SELECT * FROM intents WHERE id = $1 AND status = $2',
      [intentId, 'active']
    );

    if (localIntentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Active intent not found' });
    }

    const localIntent = localIntentResult.rows[0];

    // Search OpenClaw for similar intents
    const searchQuery = `${localIntent.title} ${localIntent.description}`.slice(0, 100);
    const openClawIntents = await openClawService.searchIntents(searchQuery, {
      category: localIntent.category || undefined,
      limit: limit * 2, // Get more to filter
    });

    // Calculate match scores
    const matches = openClawIntents
      .map((ocIntent) => {
        const score = calculateMatchScore(localIntent, {
          id: parseInt(ocIntent.id),
          title: ocIntent.title,
          description: ocIntent.description,
          category: ocIntent.category,
          requirements: ocIntent.requirements,
        });
        return {
          ...ocIntent,
          match_score: score,
        };
      })
      .filter((m) => m.match_score > 0.3) // Threshold
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    res.json({
      matches,
      count: matches.length,
      localIntent: {
        id: localIntent.id,
        title: localIntent.title,
      },
    });
  } catch (error: any) {
    console.error('Error finding OpenClaw matches:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook handler for OpenClaw events
 */
openClawRouter.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;

    // Verify webhook signature if OpenClaw provides it
    // const signature = req.headers['x-openclaw-signature'];
    // verifySignature(signature, JSON.stringify(req.body));

    switch (event) {
      case 'intent.created':
      case 'intent.updated':
        // Sync the intent
        const openClawIntent = await openClawService.getIntent(data.intent_id);
        if (openClawIntent) {
          // Similar logic to sync endpoint
          const existing = await pool.query(
            'SELECT id FROM intents WHERE openclaw_intent_id = $1',
            [openClawIntent.id]
          );

          if (existing.rows.length === 0) {
            // Create new intent (similar to sync logic)
            // ... (implement similar to sync endpoint)
          }
        }
        break;

      case 'intent.fulfilled':
      case 'intent.cancelled':
        // Update local intent status
        await pool.query(
          `UPDATE intents SET status = $1, updated_at = NOW()
           WHERE openclaw_intent_id = $2`,
          [event === 'intent.fulfilled' ? 'fulfilled' : 'cancelled', data.intent_id]
        );
        break;

      case 'match.created':
        // Handle match from OpenClaw
        // Could create a match record or notify agents
        break;
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error handling OpenClaw webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get sync status
 */
openClawRouter.get('/sync/status', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'success') as successful,
        COUNT(*) FILTER (WHERE status = 'error') as failed,
        MAX(created_at) as last_sync
       FROM openclaw_sync_log
       WHERE sync_type = 'sync'`
    );

    const openClawIntentsCount = await pool.query(
      'SELECT COUNT(*) as count FROM intents WHERE is_openclaw = true'
    );

    res.json({
      syncStats: result.rows[0],
      openClawIntentsCount: parseInt(openClawIntentsCount.rows[0].count),
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ error: error.message });
  }
});

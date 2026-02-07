import { pool } from '../db/init';
import { openClawService } from './openclaw';
import { calculateMatchScore } from './matching';

/**
 * Background service to periodically sync intents from OpenClaw
 */
export class OpenClawSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start periodic syncing
   */
  start(intervalMinutes: number = 5) {
    if (this.syncInterval) {
      return; // Already running
    }

    console.log(`🔄 Starting OpenClaw sync service (every ${intervalMinutes} minutes)`);
    
    // Run immediately
    this.sync();

    // Then run periodically
    this.syncInterval = setInterval(() => {
      this.sync();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop periodic syncing
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️  Stopped OpenClaw sync service');
    }
  }

  /**
   * Perform a sync operation
   */
  async sync() {
    if (this.isRunning) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔄 Starting OpenClaw sync...');

    try {
      // Fetch active intents from OpenClaw
      const openClawIntents = await openClawService.fetchIntents({
        limit: 100,
        status: 'active',
      });

      let synced = 0;
      let updated = 0;
      let errors = 0;

      for (const openClawIntent of openClawIntents) {
        try {
          // Check if intent already exists
          const existing = await pool.query(
            'SELECT id FROM intents WHERE openclaw_intent_id = $1',
            [openClawIntent.id]
          );

          // Find or create agent
          let agentResult = await pool.query(
            'SELECT id FROM agents WHERE wallet_address = $1',
            [openClawIntent.agent_wallet]
          );

          let agentId: number;
          if (agentResult.rows.length === 0) {
            const newAgent = await pool.query(
              `INSERT INTO agents (wallet_address, name, description)
               VALUES ($1, $2, $3)
               RETURNING id`,
              [
                openClawIntent.agent_wallet,
                openClawIntent.agent_name || `Agent ${openClawIntent.agent_wallet.slice(0, 8)}`,
                'Agent from OpenClaw',
              ]
            );
            agentId = newAgent.rows[0].id;
          } else {
            agentId = agentResult.rows[0].id;
          }

          if (existing.rows.length > 0) {
            // Update existing intent
            await pool.query(
              `UPDATE intents 
               SET title = $1, description = $2, category = $3, 
                   requirements = $4, status = $5, openclaw_synced_at = NOW(), updated_at = NOW()
               WHERE openclaw_intent_id = $6`,
              [
                openClawIntent.title,
                openClawIntent.description,
                openClawIntent.category || null,
                openClawIntent.requirements || [],
                openClawIntent.status,
                openClawIntent.id,
              ]
            );
            updated++;
          } else {
            // Create new intent
            await pool.query(
              `INSERT INTO intents (
                agent_id, title, description, category, requirements, 
                status, openclaw_intent_id, openclaw_synced_at, is_openclaw
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)`,
              [
                agentId,
                openClawIntent.title,
                openClawIntent.description,
                openClawIntent.category || null,
                openClawIntent.requirements || [],
                openClawIntent.status,
                openClawIntent.id,
                true,
              ]
            );
            synced++;
          }

          // Log sync
          await pool.query(
            `INSERT INTO openclaw_sync_log (sync_type, openclaw_intent_id, status)
             VALUES ($1, $2, $3)`,
            ['sync', openClawIntent.id, 'success']
          );
        } catch (error: any) {
          console.error(`Error syncing intent ${openClawIntent.id}:`, error.message);
          await pool.query(
            `INSERT INTO openclaw_sync_log (sync_type, openclaw_intent_id, status, error_message)
             VALUES ($1, $2, $3, $4)`,
            ['sync', openClawIntent.id, 'error', error.message]
          );
          errors++;
        }
      }

      console.log(`✅ OpenClaw sync completed: ${synced} new, ${updated} updated, ${errors} errors`);
    } catch (error: any) {
      console.error('❌ OpenClaw sync failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Find matches between local intents and OpenClaw intents
   */
  async findCrossPlatformMatches(intentId: number) {
    try {
      // Get local intent
      const localIntentResult = await pool.query(
        'SELECT * FROM intents WHERE id = $1 AND status = $2',
        [intentId, 'active']
      );

      if (localIntentResult.rows.length === 0) {
        return [];
      }

      const localIntent = localIntentResult.rows[0];

      // Search OpenClaw
      const searchQuery = `${localIntent.title} ${localIntent.description}`.slice(0, 100);
      const openClawIntents = await openClawService.searchIntents(searchQuery, {
        category: localIntent.category || undefined,
        limit: 20,
      });

      // Calculate matches
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
            openClawIntent: ocIntent,
            match_score: score,
          };
        })
        .filter((m) => m.match_score > 0.3)
        .sort((a, b) => b.match_score - a.match_score);

      return matches;
    } catch (error: any) {
      console.error('Error finding cross-platform matches:', error);
      return [];
    }
  }
}

export const openClawSyncService = new OpenClawSyncService();

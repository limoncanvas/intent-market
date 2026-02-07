/**
 * Intent repository - database access layer
 */

import { Pool } from 'pg';
import { Intent, IntentFilters } from '../../shared/types';
import { pool } from '../db/init';

export class IntentRepository {
  constructor(private db: Pool = pool) {}

  async findById(id: number): Promise<Intent | null> {
    const result = await this.db.query(
      `SELECT i.*, a.name as agent_name, a.wallet_address, a.capabilities
       FROM intents i
       JOIN agents a ON i.agent_id = a.id
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findAll(filters: IntentFilters = {}): Promise<Intent[]> {
    let query = `
      SELECT i.*, a.name as agent_name, a.wallet_address
      FROM intents i
      JOIN agents a ON i.agent_id = a.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND i.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND i.category = $${paramCount}`;
      params.push(filters.category);
      paramCount++;
    }

    if (filters.agentId) {
      query += ` AND i.agent_id = $${paramCount}`;
      params.push(filters.agentId);
      paramCount++;
    }

    query += ` ORDER BY i.created_at DESC`;
    
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async create(data: {
    agent_id: number;
    title: string;
    description: string;
    category?: string;
    requirements?: string[];
    solana_tx_signature?: string;
    openclaw_intent_id?: string;
    is_openclaw?: boolean;
  }): Promise<Intent> {
    const result = await this.db.query(
      `INSERT INTO intents (
        agent_id, title, description, category, requirements,
        solana_tx_signature, openclaw_intent_id, is_openclaw
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.agent_id,
        data.title,
        data.description,
        data.category || null,
        data.requirements || [],
        data.solana_tx_signature || null,
        data.openclaw_intent_id || null,
        data.is_openclaw || false,
      ]
    );
    return result.rows[0];
  }

  async updateStatus(id: number, status: string): Promise<Intent | null> {
    const result = await this.db.query(
      'UPDATE intents SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  async findByOpenClawId(openClawId: string): Promise<Intent | null> {
    const result = await this.db.query(
      'SELECT * FROM intents WHERE openclaw_intent_id = $1',
      [openClawId]
    );
    return result.rows[0] || null;
  }
}

export const intentRepository = new IntentRepository();

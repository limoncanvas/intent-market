/**
 * Match repository - database access layer
 */

import { Pool } from 'pg';
import { Match, MatchFilters } from '../../shared/types';
import { pool } from '../db/init';

export class MatchRepository {
  constructor(private db: Pool = pool) {}

  async findById(id: number): Promise<Match | null> {
    const result = await this.db.query(
      `SELECT m.*, 
              i1.title as intent_title, i1.description as intent_description,
              i2.title as matched_intent_title, i2.description as matched_intent_description,
              a1.name as agent_name, a2.name as matched_agent_name
       FROM matches m
       JOIN intents i1 ON m.intent_id = i1.id
       JOIN intents i2 ON m.matched_intent_id = i2.id
       JOIN agents a1 ON i1.agent_id = a1.id
       JOIN agents a2 ON i2.agent_id = a2.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIntentId(intentId: number): Promise<Match[]> {
    const result = await this.db.query(
      `SELECT m.*, 
              i1.title as intent_title, i1.description as intent_description,
              i2.title as matched_intent_title, i2.description as matched_intent_description,
              a1.name as agent_name, a2.name as matched_agent_name
       FROM matches m
       JOIN intents i1 ON m.intent_id = i1.id
       JOIN intents i2 ON m.matched_intent_id = i2.id
       JOIN agents a1 ON i1.agent_id = a1.id
       JOIN agents a2 ON i2.agent_id = a2.id
       WHERE m.intent_id = $1 OR m.matched_intent_id = $1
       ORDER BY m.match_score DESC`,
      [intentId]
    );
    return result.rows;
  }

  async findAll(filters: MatchFilters = {}): Promise<Match[]> {
    let query = `
      SELECT m.*, 
             i1.title as intent_title,
             i2.title as matched_intent_title,
             a1.name as agent_name, a2.name as matched_agent_name
      FROM matches m
      JOIN intents i1 ON m.intent_id = i1.id
      JOIN intents i2 ON m.matched_intent_id = i2.id
      JOIN agents a1 ON i1.agent_id = a1.id
      JOIN agents a2 ON i2.agent_id = a2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      query += ` AND m.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.intentId) {
      query += ` AND (m.intent_id = $${paramCount} OR m.matched_intent_id = $${paramCount})`;
      params.push(filters.intentId);
      paramCount++;
    }

    query += ` ORDER BY m.match_score DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async create(data: {
    intent_id: number;
    matched_intent_id: number;
    match_score: number;
    status?: string;
  }): Promise<Match> {
    const result = await this.db.query(
      `INSERT INTO matches (intent_id, matched_intent_id, match_score, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (intent_id, matched_intent_id) DO NOTHING
       RETURNING *`,
      [data.intent_id, data.matched_intent_id, data.match_score, data.status || 'pending']
    );
    return result.rows[0];
  }

  async updateStatus(id: number, status: string): Promise<Match | null> {
    const result = await this.db.query(
      'UPDATE matches SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }

  async exists(intentId: number, matchedIntentId: number): Promise<boolean> {
    const result = await this.db.query(
      'SELECT id FROM matches WHERE (intent_id = $1 AND matched_intent_id = $2) OR (intent_id = $2 AND matched_intent_id = $1)',
      [intentId, matchedIntentId]
    );
    return result.rows.length > 0;
  }
}

export const matchRepository = new MatchRepository();

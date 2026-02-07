/**
 * Agent repository - database access layer
 */

import { Pool } from 'pg';
import { Agent } from '../../shared/types';
import { pool } from '../db/init';

export class AgentRepository {
  constructor(private db: Pool = pool) {}

  async findById(id: number): Promise<Agent | null> {
    const result = await this.db.query('SELECT * FROM agents WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByWalletAddress(walletAddress: string): Promise<Agent | null> {
    const result = await this.db.query(
      'SELECT * FROM agents WHERE wallet_address = $1',
      [walletAddress]
    );
    return result.rows[0] || null;
  }

  async findAll(limit: number = 100): Promise<Agent[]> {
    const result = await this.db.query(
      'SELECT * FROM agents ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  async create(data: {
    wallet_address: string;
    name: string;
    description?: string;
    capabilities?: string[];
  }): Promise<Agent> {
    const result = await this.db.query(
      `INSERT INTO agents (wallet_address, name, description, capabilities)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.wallet_address, data.name, data.description || null, data.capabilities || []]
    );
    return result.rows[0];
  }

  async update(
    walletAddress: string,
    data: {
      name?: string;
      description?: string;
      capabilities?: string[];
    }
  ): Promise<Agent> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.capabilities !== undefined) {
      updates.push(`capabilities = $${paramCount++}`);
      values.push(data.capabilities);
    }

    updates.push(`updated_at = NOW()`);
    values.push(walletAddress);

    const result = await this.db.query(
      `UPDATE agents SET ${updates.join(', ')} WHERE wallet_address = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async createOrUpdate(data: {
    wallet_address: string;
    name: string;
    description?: string;
    capabilities?: string[];
  }): Promise<Agent> {
    const result = await this.db.query(
      `INSERT INTO agents (wallet_address, name, description, capabilities)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (wallet_address) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         capabilities = EXCLUDED.capabilities,
         updated_at = NOW()
       RETURNING *`,
      [data.wallet_address, data.name, data.description || null, data.capabilities || []]
    );
    return result.rows[0];
  }
}

export const agentRepository = new AgentRepository();

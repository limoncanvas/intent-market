import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OpenClaw Service
 * Handles integration with OpenClaw protocol for intent discovery and matching
 */
export class OpenClawService {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OPENCLAW_API_URL || 'https://api.openclaw.io';
    this.apiKey = process.env.OPENCLAW_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
      },
      timeout: 10000,
    });
  }

  /**
   * Fetch intents from OpenClaw
   */
  async fetchIntents(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
  }): Promise<OpenClawIntent[]> {
    try {
      const response = await this.client.get('/intents', { params });
      return response.data.intents || response.data || [];
    } catch (error: any) {
      console.error('Error fetching OpenClaw intents:', error.message);
      throw new Error(`Failed to fetch OpenClaw intents: ${error.message}`);
    }
  }

  /**
   * Get a specific intent from OpenClaw
   */
  async getIntent(intentId: string): Promise<OpenClawIntent | null> {
    try {
      const response = await this.client.get(`/intents/${intentId}`);
      return response.data.intent || response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching OpenClaw intent:', error.message);
      throw new Error(`Failed to fetch OpenClaw intent: ${error.message}`);
    }
  }

  /**
   * Post an intent to OpenClaw
   */
  async postIntent(intent: {
    title: string;
    description: string;
    category?: string;
    requirements?: string[];
    agentWallet: string;
    metadata?: Record<string, any>;
  }): Promise<OpenClawIntent> {
    try {
      const response = await this.client.post('/intents', {
        title: intent.title,
        description: intent.description,
        category: intent.category,
        requirements: intent.requirements,
        agent_wallet: intent.agentWallet,
        metadata: intent.metadata,
      });
      return response.data.intent || response.data;
    } catch (error: any) {
      console.error('Error posting intent to OpenClaw:', error.message);
      throw new Error(`Failed to post intent to OpenClaw: ${error.message}`);
    }
  }

  /**
   * Update intent status in OpenClaw
   */
  async updateIntentStatus(
    intentId: string,
    status: 'active' | 'fulfilled' | 'cancelled'
  ): Promise<void> {
    try {
      await this.client.patch(`/intents/${intentId}/status`, { status });
    } catch (error: any) {
      console.error('Error updating OpenClaw intent status:', error.message);
      throw new Error(`Failed to update OpenClaw intent status: ${error.message}`);
    }
  }

  /**
   * Register a webhook for OpenClaw events
   */
  async registerWebhook(url: string, events: string[]): Promise<string> {
    try {
      const response = await this.client.post('/webhooks', {
        url,
        events,
      });
      return response.data.webhook_id || response.data.id;
    } catch (error: any) {
      console.error('Error registering OpenClaw webhook:', error.message);
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
  }

  /**
   * Search intents on OpenClaw
   */
  async searchIntents(query: string, filters?: {
    category?: string;
    limit?: number;
  }): Promise<OpenClawIntent[]> {
    try {
      const response = await this.client.get('/intents/search', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data.intents || response.data || [];
    } catch (error: any) {
      console.error('Error searching OpenClaw intents:', error.message);
      throw new Error(`Failed to search OpenClaw intents: ${error.message}`);
    }
  }
}

/**
 * OpenClaw Intent interface
 */
export interface OpenClawIntent {
  id: string;
  title: string;
  description: string;
  category?: string;
  requirements?: string[];
  agent_wallet: string;
  agent_name?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  match_score?: number; // Added when matched with local intents
}

/**
 * Convert OpenClaw intent to local intent format
 */
export function convertOpenClawIntentToLocal(
  openClawIntent: OpenClawIntent,
  agentId: number
): {
  agent_id: number;
  title: string;
  description: string;
  category: string | null;
  requirements: string[];
  status: string;
  openclaw_intent_id: string;
  openclaw_synced_at: Date;
} {
  return {
    agent_id: agentId,
    title: openClawIntent.title,
    description: openClawIntent.description,
    category: openClawIntent.category || null,
    requirements: openClawIntent.requirements || [],
    status: openClawIntent.status,
    openclaw_intent_id: openClawIntent.id,
    openclaw_synced_at: new Date(),
  };
}

// Singleton instance
export const openClawService = new OpenClawService();

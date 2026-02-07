/**
 * API client for Intent Market
 */

import axios, { AxiosInstance } from 'axios';
import type { Agent, Intent, Match } from '../../shared/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Agents
  async getAgent(walletAddress: string): Promise<Agent> {
    const response = await this.client.get(`/api/agents/${walletAddress}`);
    return response.data.agent;
  }

  async createOrUpdateAgent(data: {
    walletAddress: string;
    name: string;
    description?: string;
    capabilities?: string[];
  }): Promise<Agent> {
    const response = await this.client.post('/api/agents', data);
    return response.data.agent;
  }

  async getAllAgents(): Promise<Agent[]> {
    const response = await this.client.get('/api/agents');
    return response.data.agents || [];
  }

  // Intents
  async getIntent(id: number): Promise<Intent> {
    const response = await this.client.get(`/api/intents/${id}`);
    return response.data.intent;
  }

  async getAllIntents(filters?: {
    status?: string;
    category?: string;
    agentId?: number;
  }): Promise<Intent[]> {
    const response = await this.client.get('/api/intents', { params: filters });
    return response.data.intents || [];
  }

  async createIntent(data: {
    agentId: number;
    title: string;
    description: string;
    category?: string;
    requirements?: string[];
    solanaTxSignature?: string;
  }): Promise<Intent> {
    const response = await this.client.post('/api/intents', data);
    return response.data.intent;
  }

  async updateIntentStatus(id: number, status: string): Promise<Intent> {
    const response = await this.client.patch(`/api/intents/${id}/status`, { status });
    return response.data.intent;
  }

  // Matches
  async getMatchesForIntent(intentId: number): Promise<Match[]> {
    const response = await this.client.get(`/api/matches/intent/${intentId}`);
    return response.data.matches || [];
  }

  async getAllMatches(filters?: {
    status?: string;
    intentId?: number;
  }): Promise<Match[]> {
    const response = await this.client.get('/api/matches', { params: filters });
    return response.data.matches || [];
  }

  async findMatches(intentId: number, limit?: number): Promise<{ matches: Match[]; count: number }> {
    const response = await this.client.post(`/api/matches/find/${intentId}`, { limit });
    return response.data;
  }

  async updateMatchStatus(matchId: number, status: string): Promise<Match> {
    const response = await this.client.patch(`/api/matches/${matchId}/status`, { status });
    return response.data.match;
  }

  // OpenClaw
  async syncOpenClaw(data?: { limit?: number; category?: string; force?: boolean }): Promise<{
    synced: number;
    errors: number;
    total: number;
  }> {
    const response = await this.client.post('/api/openclaw/sync', data);
    return response.data;
  }

  async getOpenClawSyncStatus(): Promise<{
    syncStats: {
      successful: number;
      failed: number;
      last_sync: string;
    };
    openClawIntentsCount: number;
  }> {
    const response = await this.client.get('/api/openclaw/sync/status');
    return response.data;
  }

  async publishToOpenClaw(intentId: number): Promise<any> {
    const response = await this.client.post(`/api/openclaw/publish/${intentId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient();

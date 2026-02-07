/**
 * Shared types for Intent Market
 */

export interface Agent {
  id: number;
  wallet_address: string;
  name: string;
  description?: string;
  capabilities?: string[];
  created_at: string;
  updated_at: string;
}

export interface Intent {
  id: number;
  agent_id: number;
  title: string;
  description: string;
  category?: string;
  requirements?: string[];
  status: IntentStatus;
  solana_tx_signature?: string;
  openclaw_intent_id?: string;
  openclaw_synced_at?: string;
  is_openclaw?: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  agent_name?: string;
  wallet_address?: string;
}

export type IntentStatus = 'active' | 'fulfilled' | 'cancelled';

export interface Match {
  id: number;
  intent_id: number;
  matched_intent_id: number;
  match_score: number;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  intent_title?: string;
  intent_description?: string;
  matched_intent_title?: string;
  matched_intent_description?: string;
  agent_name?: string;
  matched_agent_name?: string;
}

export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

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
  match_score?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string | Array<{ message: string; path?: string }>;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface IntentFilters extends PaginationParams {
  status?: IntentStatus;
  category?: string;
  agentId?: number;
}

export interface MatchFilters extends PaginationParams {
  status?: MatchStatus;
  intentId?: number;
}

/**
 * Shared types for Intent Market
 *
 * Flow:
 *   1. Human posts an Intent (what they need)
 *   2. Intent is broadcast to agents (privately)
 *   3. Agents respond with a Match (why they/their owner can deliver)
 *   4. Human reviews matches, sees "why matched", accepts or passes
 *   5. Human contacts agent's owner or hires agent directly
 */

// ── Agents ──────────────────────────────────────────────────────────

export interface Agent {
  id: number;
  wallet_address: string;
  name: string;
  bio?: string;
  skills: string[];
  owner_name?: string;
  owner_contact?: string;
  avatar_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// ── Intents ─────────────────────────────────────────────────────────

export type IntentStatus = 'open' | 'matched' | 'closed';
export type IntentUrgency = 'low' | 'medium' | 'high' | 'asap';

export interface Intent {
  id: number;
  poster_wallet: string;
  poster_name?: string;
  title: string;
  description: string;
  category: string;
  urgency: IntentUrgency;
  budget?: string;
  requirements: string[];
  status: IntentStatus;
  match_count?: number;
  created_at: string;
  updated_at: string;
}

// ── Matches ─────────────────────────────────────────────────────────

export type MatchType = 'agent_can_deliver' | 'owner_suitable' | 'both';
export type MatchStatus = 'proposed' | 'accepted' | 'declined' | 'contacted';

export interface Match {
  id: number;
  intent_id: number;
  agent_id: number;
  match_type: MatchType;
  match_score: number;
  match_reason: string;          // "Why this agent/owner is a good fit"
  agent_message?: string;        // Optional message from the agent
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  intent_title?: string;
  agent_name?: string;
  agent_bio?: string;
  agent_skills?: string[];
  owner_name?: string;
  owner_contact?: string;
}

// ── API ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

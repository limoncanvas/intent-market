/**
 * Shared constants for Intent Market
 */

export const INTENT_CATEGORIES = [
  'defi',
  'trading',
  'analytics',
  'payments',
  'consumer',
  'identity',
  'security',
  'infra',
  'ai',
] as const;

export type IntentCategory = typeof INTENT_CATEGORIES[number];

import type { IntentStatus, MatchStatus } from '../types';

export const INTENT_STATUSES: IntentStatus[] = ['active', 'fulfilled', 'cancelled'];
export const MATCH_STATUSES: MatchStatus[] = ['pending', 'accepted', 'rejected', 'completed'];

export const MATCH_SCORE_THRESHOLD = 0.3; // Minimum score to create a match

export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_MATCH_LIMIT = 10;

// Related categories for matching algorithm
export const RELATED_CATEGORIES: Record<string, string[]> = {
  defi: ['trading', 'payments'],
  trading: ['defi', 'analytics'],
  analytics: ['trading', 'defi'],
  payments: ['defi', 'consumer'],
  consumer: ['payments', 'identity'],
  identity: ['consumer', 'security'],
  security: ['identity', 'infra'],
  infra: ['security', 'ai'],
  ai: ['infra', 'analytics'],
};

// Solana constants
export const SOLANA_WALLET_ADDRESS_LENGTH = 44;
export const SOLANA_TX_SIGNATURE_LENGTH = 88;

// API constants
export const API_VERSION = 'v1';
export const MAX_INTENT_TITLE_LENGTH = 255;
export const MAX_INTENT_DESCRIPTION_LENGTH = 10000;
export const MAX_AGENT_NAME_LENGTH = 255;

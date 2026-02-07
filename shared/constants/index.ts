/**
 * Shared constants for Intent Market
 */

export const CATEGORIES = [
  'engineering',
  'design',
  'product',
  'marketing',
  'sales',
  'operations',
  'finance',
  'legal',
  'data',
  'ai',
  'defi',
  'trading',
  'infra',
  'security',
  'other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<string, string> = {
  engineering: 'Engineering',
  design: 'Design',
  product: 'Product',
  marketing: 'Marketing',
  sales: 'Sales',
  operations: 'Operations',
  finance: 'Finance',
  legal: 'Legal',
  data: 'Data',
  ai: 'AI / ML',
  defi: 'DeFi',
  trading: 'Trading',
  infra: 'Infrastructure',
  security: 'Security',
  other: 'Other',
};

export const URGENCY_LABELS: Record<string, string> = {
  low: 'No rush',
  medium: 'This month',
  high: 'This week',
  asap: 'ASAP',
};

export const MATCH_SCORE_THRESHOLD = 0.3;
export const DEFAULT_PAGE_SIZE = 50;

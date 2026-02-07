/**
 * Frontend constants
 */

import { IntentCategory } from '../../shared/constants';

export const INTENT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Categories' },
  { value: 'defi', label: 'DeFi' },
  { value: 'trading', label: 'Trading' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'payments', label: 'Payments' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'identity', label: 'Identity' },
  { value: 'security', label: 'Security' },
  { value: 'infra', label: 'Infrastructure' },
  { value: 'ai', label: 'AI' },
];

export const categoryColors: Record<string, string> = {
  defi: 'bg-green-500/20 text-green-300 border-green-500/30',
  trading: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  analytics: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  payments: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  consumer: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  identity: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  security: 'bg-red-500/20 text-red-300 border-red-500/30',
  infra: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  ai: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
};

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

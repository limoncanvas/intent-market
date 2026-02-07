export const CATEGORIES = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'data', label: 'Data' },
  { value: 'ai', label: 'AI / ML' },
  { value: 'defi', label: 'DeFi' },
  { value: 'trading', label: 'Trading' },
  { value: 'infra', label: 'Infrastructure' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

export const URGENCY = [
  { value: 'low', label: 'No rush', color: 'text-gray-400' },
  { value: 'medium', label: 'This month', color: 'text-blue-400' },
  { value: 'high', label: 'This week', color: 'text-orange-400' },
  { value: 'asap', label: 'ASAP', color: 'text-red-400' },
];

export const categoryColor: Record<string, string> = {
  engineering: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  design: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  product: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  marketing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  sales: 'bg-green-500/20 text-green-300 border-green-500/30',
  ai: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  defi: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  trading: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  infra: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  security: 'bg-red-500/20 text-red-300 border-red-500/30',
  other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

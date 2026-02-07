/**
 * Matching algorithm that calculates compatibility between intents
 */

interface Intent {
  id: number;
  title: string;
  description: string;
  category?: string;
  requirements?: string[];
}

export function calculateMatchScore(intent1: Intent, intent2: Intent): number {
  let score = 0;
  const weights = {
    category: 0.3,
    title: 0.2,
    description: 0.3,
    requirements: 0.2,
  };

  // Category match
  if (intent1.category && intent2.category) {
    if (intent1.category === intent2.category) {
      score += weights.category;
    } else if (areCategoriesRelated(intent1.category, intent2.category)) {
      score += weights.category * 0.5;
    }
  }

  // Title similarity
  const titleSimilarity = calculateTextSimilarity(
    intent1.title.toLowerCase(),
    intent2.title.toLowerCase()
  );
  score += weights.title * titleSimilarity;

  // Description similarity
  const descSimilarity = calculateTextSimilarity(
    intent1.description.toLowerCase(),
    intent2.description.toLowerCase()
  );
  score += weights.description * descSimilarity;

  // Requirements overlap
  if (intent1.requirements && intent2.requirements) {
    const reqOverlap = calculateArrayOverlap(
      intent1.requirements,
      intent2.requirements
    );
    score += weights.requirements * reqOverlap;
  }

  return Math.min(1.0, score);
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function calculateArrayOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function areCategoriesRelated(cat1: string, cat2: string): boolean {
  const relatedCategories: Record<string, string[]> = {
    'defi': ['trading', 'payments'],
    'trading': ['defi', 'analytics'],
    'analytics': ['trading', 'defi'],
    'payments': ['defi', 'consumer'],
    'consumer': ['payments', 'identity'],
    'identity': ['consumer', 'security'],
    'security': ['identity', 'infra'],
    'infra': ['security', 'ai'],
    'ai': ['infra', 'analytics'],
  };

  const related = relatedCategories[cat1.toLowerCase()] || [];
  return related.includes(cat2.toLowerCase());
}

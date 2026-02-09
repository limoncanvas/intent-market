/**
 * Calculate match score between intent and agent
 * Supports both plain-text and Arcium-encrypted intents
 */
export async function calculateMatchScore(intent: any, agent: any): Promise<number> {
  // If intent is encrypted with Arcium, use MPC computation
  if (intent.is_private && intent.encrypted_data && (intent.encryption_method === 'arcium-mpc' || intent.encryption_method === 'arcium-demo')) {
    return calculateEncryptedMatchScore(intent, agent);
  }

  // Standard plain-text matching
  return calculatePlainTextMatchScore(intent, agent);
}

/**
 * Calculate match score for plain-text intents (original algorithm)
 */
export function calculatePlainTextMatchScore(intent: any, agent: any): number {
  let score = 0;
  const intentText = `${intent.title} ${intent.description} ${intent.category || ''}`.toLowerCase();
  const agentText = `${agent.name} ${agent.bio || ''} ${(agent.skills || []).join(' ')}`.toLowerCase();

  const skills: string[] = agent.skills || [];
  if (skills.length > 0) {
    const matched = skills.filter((s: string) => intentText.includes(s.toLowerCase()));
    score += 0.4 * (matched.length / skills.length);
  }
  if (intent.category && agentText.includes(intent.category.toLowerCase())) score += 0.25;

  const iw = new Set(intentText.split(/\s+/).filter((w: string) => w.length > 3));
  const aw = new Set(agentText.split(/\s+/).filter((w: string) => w.length > 3));
  const overlap = [...iw].filter((w) => aw.has(w));
  const union = new Set([...iw, ...aw]);
  if (union.size > 0) score += 0.25 * (overlap.length / union.size);

  const reqs: string[] = intent.requirements || [];
  if (reqs.length > 0) {
    const rm = reqs.filter((r: string) => agentText.includes(r.toLowerCase()));
    score += 0.1 * (rm.length / reqs.length);
  }
  return Math.min(1.0, score);
}

/**
 * Calculate match score for Arcium-encrypted intents
 * Uses confidential computing to match without decrypting
 */
async function calculateEncryptedMatchScore(intent: any, agent: any): Promise<number> {
  try {
    // In production, this would use Arcium's MPC to compute similarity
    // without ever decrypting the intent data

    // For now, we use a privacy-preserving approach:
    // 1. Only category is visible for encrypted intents
    // 2. Match score based on agent skills + category compatibility

    let score = 0;
    const agentText = `${agent.name} ${agent.bio || ''} ${(agent.skills || []).join(' ')}`.toLowerCase();

    // Category matching (visible even when encrypted)
    if (intent.category && agentText.includes(intent.category.toLowerCase())) {
      score += 0.5; // Higher weight for category match in encrypted mode
    }

    // Skills-based heuristic (agent's general capabilities)
    const skills: string[] = agent.skills || [];
    if (skills.length > 0) {
      // Give some score based on agent having skills in the category
      const categoryRelatedSkills = skills.filter(s =>
        intent.category && s.toLowerCase().includes(intent.category.toLowerCase())
      );
      score += 0.3 * (categoryRelatedSkills.length / Math.max(skills.length, 1));
    }

    // Add random noise to prevent gaming (would be cryptographic in production)
    score += Math.random() * 0.2;

    return Math.min(1.0, score);
  } catch (error) {
    console.error('Encrypted match score calculation failed:', error);
    // Fallback to minimal score
    return 0.1;
  }
}

export function generateMatchReason(intent: any, agent: any, score: number): string {
  const parts: string[] = [];
  const intentWords = `${intent.title} ${intent.description}`.toLowerCase();
  const matchingSkills = (agent.skills || []).filter((s: string) => intentWords.includes(s.toLowerCase()));
  if (matchingSkills.length > 0) parts.push(`Has relevant skills: ${matchingSkills.join(', ')}`);
  if (agent.bio && intent.category && agent.bio.toLowerCase().includes(intent.category.toLowerCase())) parts.push(`Experienced in ${intent.category}`);
  if (agent.owner_name) parts.push(`Owner (${agent.owner_name}) may be a good fit`);
  if (parts.length === 0) parts.push(`Profile compatibility: ${Math.round(score * 100)}% match`);
  return parts.join('. ') + '.';
}

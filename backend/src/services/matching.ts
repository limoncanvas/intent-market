/**
 * Matching algorithm: scores how well an agent fits an intent
 */

export function calculateMatchScore(intent: any, agent: any): number {
  let score = 0;

  const intentText = `${intent.title} ${intent.description} ${intent.category || ''}`.toLowerCase();
  const agentText = `${agent.name} ${agent.bio || ''} ${(agent.skills || []).join(' ')}`.toLowerCase();

  // Skill overlap (0.4 weight)
  const skills: string[] = agent.skills || [];
  if (skills.length > 0) {
    const matched = skills.filter((s: string) => intentText.includes(s.toLowerCase()));
    score += 0.4 * (matched.length / skills.length);
  }

  // Category match (0.25 weight)
  if (intent.category && agentText.includes(intent.category.toLowerCase())) {
    score += 0.25;
  }

  // Text similarity (0.25 weight)
  const intentWords = new Set(intentText.split(/\s+/).filter((w: string) => w.length > 3));
  const agentWords = new Set(agentText.split(/\s+/).filter((w: string) => w.length > 3));
  const overlap = [...intentWords].filter((w) => agentWords.has(w));
  const union = new Set([...intentWords, ...agentWords]);
  if (union.size > 0) {
    score += 0.25 * (overlap.length / union.size);
  }

  // Requirement match (0.1 weight)
  const reqs: string[] = intent.requirements || [];
  if (reqs.length > 0) {
    const reqMatched = reqs.filter((r: string) => agentText.includes(r.toLowerCase()));
    score += 0.1 * (reqMatched.length / reqs.length);
  }

  return Math.min(1.0, score);
}

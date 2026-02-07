export function calculateMatchScore(intent: any, agent: any): number {
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

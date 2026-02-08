import axios from 'axios';

// Use relative paths — works both locally (Next.js API routes) and on Vercel
const client = axios.create({ baseURL: '', headers: { 'Content-Type': 'application/json' } });

export const api = {
  // Agents
  getAgent: (wallet: string) => client.get(`/api/agents/${wallet}`).then(r => r.data.agent),
  upsertAgent: (data: any) => client.post('/api/agents', data).then(r => r.data.agent),
  listAgents: () => client.get('/api/agents').then(r => r.data.agents || []),

  // Intents
  createIntent: (data: any) => client.post('/api/intents', data).then(r => r.data.intent),
  listIntents: (params?: any) => client.get('/api/intents', { params }).then(r => r.data.intents || []),
  getIntent: (id: number) => client.get(`/api/intents/${id}`).then(r => r.data.intent),
  updateIntentStatus: (id: number, status: string) => client.patch(`/api/intents/${id}`, { status }).then(r => r.data.intent),

  // Matches
  getMatches: (intentId: number) => client.get(`/api/matches/intent/${intentId}`).then(r => r.data.matches || []),
  updateMatch: (id: number, status: string) => client.patch(`/api/matches/${id}/status`, { status }).then(r => r.data.match),
  autoMatch: (intentId: number) => client.post(`/api/matches/auto/${intentId}`).then(r => r.data),

  // Stats
  getStats: () => client.get('/api/stats').then(r => r.data),

  // Negotiation log
  getNegotiationLog: (intentId: number) => client.get(`/api/negotiate/${intentId}`).then(r => r.data.log || []),
};

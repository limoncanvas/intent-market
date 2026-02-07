'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { api } from '@/lib/api'
import { CATEGORIES, URGENCY, categoryColor, timeAgo } from '@/lib/constants'
import {
  Search, Plus, Sparkles, Filter, Loader2, ArrowRight, Clock,
  Users, Zap, ChevronRight, X, Target, MessageSquare, User,
  CheckCircle, XCircle, Mail, Briefcase, Star, ArrowLeft, Tag
} from 'lucide-react'

type View = 'home' | 'post' | 'my-intents' | 'intent-detail'

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [view, setView] = useState<View>('home')
  const [intents, setIntents] = useState<any[]>([])
  const [selectedIntent, setSelectedIntent] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)

  // Post intent form
  const [form, setForm] = useState({ title: '', description: '', category: '', urgency: 'medium', budget: '', requirements: '' })

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadIntents = useCallback(async (wallet?: string) => {
    setLoading(true)
    try {
      const data = await api.listIntents(wallet ? { wallet } : undefined)
      setIntents(data)
    } catch { showToast('Failed to load intents', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  const loadMatches = useCallback(async (intentId: number) => {
    setMatchLoading(true)
    try { setMatches(await api.getMatches(intentId)) }
    catch { showToast('Failed to load matches', 'error') }
    finally { setMatchLoading(false) }
  }, [showToast])

  useEffect(() => { loadIntents() }, [loadIntents])

  const handlePostIntent = async () => {
    if (!publicKey || !form.title || !form.description || !form.category) return
    setLoading(true)
    try {
      await api.createIntent({
        posterWallet: publicKey.toBase58(),
        posterName: publicKey.toBase58().slice(0, 8),
        title: form.title,
        description: form.description,
        category: form.category,
        urgency: form.urgency,
        budget: form.budget || undefined,
        requirements: form.requirements ? form.requirements.split(',').map(r => r.trim()).filter(Boolean) : undefined,
      })
      setForm({ title: '', description: '', category: '', urgency: 'medium', budget: '', requirements: '' })
      showToast('Intent posted! Agents will start matching.')
      setView('my-intents')
      loadIntents(publicKey.toBase58())
    } catch (e: any) { showToast(e.response?.data?.error || 'Failed to post intent', 'error') }
    finally { setLoading(false) }
  }

  const openIntent = async (intent: any) => {
    setSelectedIntent(intent)
    setView('intent-detail')
    loadMatches(intent.id)
  }

  const handleMatchAction = async (matchId: number, status: string) => {
    try {
      await api.updateMatch(matchId, status)
      showToast(status === 'accepted' ? 'Match accepted!' : status === 'contacted' ? 'Contact initiated!' : 'Match declined')
      if (selectedIntent) loadMatches(selectedIntent.id)
    } catch { showToast('Failed to update match', 'error') }
  }

  const triggerAutoMatch = async (intentId: number) => {
    setMatchLoading(true)
    try {
      const result = await api.autoMatch(intentId)
      showToast(`Found ${result.count} potential matches!`)
      loadMatches(intentId)
    } catch { showToast('Failed to find matches', 'error') }
    finally { setMatchLoading(false) }
  }

  // ── VIEWS ─────────────────────────────────────────────────────────

  // Hero / Landing
  if (view === 'home') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast}>
      {/* Hero */}
      <div className="text-center py-16 md:py-24 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-6">
          <Sparkles className="w-4 h-4" /> Powered by Solana
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
          Post your intent.<br />Agents find the match.
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Describe what you need — a co-founder, a developer, a service — and AI agents
          will privately match you with the right people or deliver the work themselves.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {connected ? (
            <button onClick={() => setView('post')} className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold text-lg flex items-center gap-2 justify-center transition-all hover:scale-105 animate-pulse-ring">
              <Plus className="w-5 h-5" /> Post an Intent
            </button>
          ) : (
            <WalletMultiButton />
          )}
          <button onClick={() => { loadIntents(); setView('my-intents') }} className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-lg flex items-center gap-2 justify-center transition-all">
            <Search className="w-5 h-5" /> Browse Intents
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
        {[
          { icon: Target, title: 'Post Your Intent', desc: 'Describe what you need. A CTO, a designer, an API integration — anything.' },
          { icon: Zap, title: 'Agents Match', desc: 'AI agents privately evaluate your intent and respond with why they or their owner is a fit.' },
          { icon: Users, title: 'Review & Connect', desc: 'See who matched, read their reasons, then contact the owner or hire the agent directly.' },
        ].map((step, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-purple-500/30 transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <step.icon className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-gray-400 text-sm">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Recent intents */}
      {intents.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Recent Intents</h2>
            <button onClick={() => { loadIntents(); setView('my-intents') }} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intents.slice(0, 6).map((intent) => (
              <IntentCard key={intent.id} intent={intent} onClick={() => openIntent(intent)} />
            ))}
          </div>
        </div>
      )}
    </Shell>
  )

  // Post Intent
  if (view === 'post') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast}>
      <div className="max-w-2xl mx-auto animate-slide-up">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Post an Intent</h1>
        <p className="text-gray-400 mb-8">Describe what you need. Agents will find the best match for you.</p>

        <div className="space-y-5">
          <Field label="What do you need?" required>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder='e.g. "Looking for a CTO co-founder for my DeFi startup"'
              className="input" />
          </Field>

          <Field label="Describe in detail" required>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What's the context? What skills, experience, or traits are you looking for? What does success look like?"
              rows={5} className="input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" required>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>)}
              </select>
            </Field>
            <Field label="Urgency">
              <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="input">
                {URGENCY.map(u => <option key={u.value} value={u.value} className="bg-slate-800">{u.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Budget (optional)">
            <input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}
              placeholder='e.g. "$5k-10k" or "Equity" or "Negotiable"' className="input" />
          </Field>

          <Field label="Requirements (comma-separated, optional)">
            <input value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
              placeholder="e.g. Solana experience, 5+ years engineering, US timezone" className="input" />
          </Field>

          <button onClick={handlePostIntent} disabled={loading || !form.title || !form.description || !form.category}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Posting...' : 'Post Intent'}
          </button>
        </div>
      </div>
    </Shell>
  )

  // My Intents / Browse
  if (view === 'my-intents') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast}>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-gray-400 hover:text-white mb-2 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold">Intents</h1>
          </div>
          {connected && (
            <button onClick={() => setView('post')} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold flex items-center gap-2 transition-all">
              <Plus className="w-4 h-4" /> Post Intent
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center py-20">
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No intents yet</h3>
            <p className="text-gray-400 mb-6">Be the first to post what you need.</p>
            {connected && (
              <button onClick={() => setView('post')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition-all">
                Post an Intent
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intents.map((intent, i) => (
              <div key={intent.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <IntentCard intent={intent} onClick={() => openIntent(intent)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )

  // Intent Detail + Matches
  if (view === 'intent-detail' && selectedIntent) return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => { setView('my-intents'); loadIntents() }} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to intents
        </button>

        {/* Intent header */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColor[selectedIntent.category] || categoryColor.other}`}>
                  {selectedIntent.category}
                </span>
                <span className="text-xs text-gray-400">{timeAgo(selectedIntent.created_at)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedIntent.status === 'open' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                  {selectedIntent.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-2">{selectedIntent.title}</h1>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedIntent.description}</p>
            </div>
          </div>
          {selectedIntent.budget && <div className="text-sm text-gray-400 mt-3">Budget: <span className="text-white">{selectedIntent.budget}</span></div>}
          {selectedIntent.requirements?.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedIntent.requirements.map((r: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-gray-300">{r}</span>
              ))}
            </div>
          )}
        </div>

        {/* Matches section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Matches ({matches.length})
          </h2>
          <button onClick={() => triggerAutoMatch(selectedIntent.id)} disabled={matchLoading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all">
            {matchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Find Matches
          </button>
        </div>

        {matchLoading && matches.length === 0 ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" /></div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 mb-4">No matches yet. Click "Find Matches" to let agents discover this intent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <MatchCard key={match.id} match={match} onAction={handleMatchAction} delay={i * 60} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  )

  return null
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────

function Shell({ children, wallet, onNav, connected, toast }: any) {
  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      <nav className="border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNav('home')} className="flex items-center gap-2 font-bold text-lg">
            <Sparkles className="w-5 h-5 text-purple-400" /> Intent Market
          </button>
          <div className="flex items-center gap-3">
            {connected && (
              <>
                <button onClick={() => onNav('post')} className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-4 h-4" /> Post
                </button>
                <button onClick={() => onNav('my-intents')} className="hidden sm:flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                  <Target className="w-4 h-4" /> Intents
                </button>
              </>
            )}
            {wallet}
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border backdrop-blur-sm flex items-center gap-2 animate-fade-in ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-300' : 'bg-green-500/20 border-green-500/40 text-green-300'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </main>
  )
}

function IntentCard({ intent, onClick }: { intent: any; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-white/5 border border-white/10 rounded-xl p-5 cursor-pointer hover:bg-white/[0.08] hover:border-purple-500/30 transition-all">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${categoryColor[intent.category] || categoryColor.other}`}>
          {intent.category}
        </span>
        {intent.urgency === 'asap' && <span className="text-xs text-red-400 font-medium">ASAP</span>}
        {intent.urgency === 'high' && <span className="text-xs text-orange-400 font-medium">This week</span>}
      </div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-purple-300 transition-colors line-clamp-2">{intent.title}</h3>
      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{intent.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(intent.created_at)}</span>
          {(intent.match_count > 0 || parseInt(intent.match_count) > 0) && (
            <span className="flex items-center gap-1 text-purple-400"><Users className="w-3.5 h-3.5" />{intent.match_count} matches</span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  )
}

function MatchCard({ match, onAction, delay }: { match: any; onAction: (id: number, status: string) => void; delay: number }) {
  const scorePercent = Math.round((match.match_score || 0) * 100)
  const scoreColor = scorePercent >= 70 ? 'text-green-400' : scorePercent >= 40 ? 'text-yellow-400' : 'text-purple-400'

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-500/20 transition-all animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Agent info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
              <User className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="font-semibold">{match.agent_name || 'Agent'}</div>
              <div className="text-xs text-gray-400">
                {match.match_type === 'owner_suitable' ? 'Owner may be a fit' : match.match_type === 'both' ? 'Agent + Owner' : 'Agent can deliver'}
              </div>
            </div>
            <div className={`ml-auto text-2xl font-bold ${scoreColor}`}>{scorePercent}%</div>
          </div>

          {/* Why matched */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 mb-3">
            <div className="text-xs text-purple-300 font-medium mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Why this match</div>
            <p className="text-sm text-gray-300">{match.match_reason}</p>
          </div>

          {match.agent_message && (
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Agent says</div>
              <p className="text-sm text-gray-300">{match.agent_message}</p>
            </div>
          )}

          {/* Skills */}
          {match.agent_skills?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3">
              {match.agent_skills.map((s: string, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-400">{s}</span>
              ))}
            </div>
          )}

          {match.owner_name && (
            <div className="text-sm text-gray-400">
              Owner: <span className="text-white">{match.owner_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <span className={`text-xs capitalize ${match.status === 'accepted' ? 'text-green-400' : match.status === 'contacted' ? 'text-blue-400' : match.status === 'declined' ? 'text-gray-500' : 'text-gray-400'}`}>
          {match.status}
        </span>
        {match.status === 'proposed' && (
          <div className="flex gap-2">
            <button onClick={() => onAction(match.id, 'accepted')} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <CheckCircle className="w-4 h-4" /> Accept
            </button>
            <button onClick={() => onAction(match.id, 'contacted')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
              <Mail className="w-4 h-4" /> Contact Owner
            </button>
            <button onClick={() => onAction(match.id, 'declined')} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-gray-400 transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
        {match.status === 'accepted' && match.owner_contact && (
          <a href={`mailto:${match.owner_contact}`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <Mail className="w-4 h-4" /> {match.owner_contact}
          </a>
        )}
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  )
}

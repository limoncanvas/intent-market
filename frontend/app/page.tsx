'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/constants'
import { Lock, ArrowRight } from 'lucide-react'

type View = 'home' | 'my-intents' | 'intent-detail'

export default function Home() {
  const { publicKey, connected } = useWallet()
  const [view, setView] = useState<View>('home')
  const [intents, setIntents] = useState<any[]>([])
  const [selectedIntent, setSelectedIntent] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [stats, setStats] = useState<{ agents: number; intents: number; matches: number }>({ agents: 0, intents: 0, matches: 0 })
  const [loading, setLoading] = useState(false)
  const [matchLoading, setMatchLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null)
  const [intentText, setIntentText] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const showToast = useCallback((msg: string, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadIntents = useCallback(async (wallet?: string) => {
    setLoading(true)
    try {
      const data = await api.listIntents(wallet ? { wallet } : undefined)
      setIntents(data)
    } catch { showToast('LOAD FAILED', 'error') }
    finally { setLoading(false) }
  }, [showToast])

  const loadMatches = useCallback(async (intentId: number) => {
    setMatchLoading(true)
    try { setMatches(await api.getMatches(intentId)) }
    catch { showToast('MATCH LOAD FAILED', 'error') }
    finally { setMatchLoading(false) }
  }, [showToast])

  const loadStats = useCallback(async () => {
    try { setStats(await api.getStats()) } catch {}
  }, [])

  useEffect(() => {
    const wallet = connected && publicKey ? publicKey.toBase58() : undefined
    loadIntents(wallet)
    loadStats()
  }, [connected, publicKey, loadIntents, loadStats])

  const handlePostIntent = async () => {
    if (!publicKey || !intentText.trim()) return
    setLoading(true)
    try {
      await api.createIntent({
        posterWallet: publicKey.toBase58(),
        posterName: publicKey.toBase58().slice(0, 8),
        title: intentText.trim(),
        description: intentText.trim(),
        category: 'other',
        isPrivate,
      })
      setIntentText('')
      setIsPrivate(false)
      showToast(isPrivate ? 'ENCRYPTED & POSTED' : 'POSTED PUBLIC')
      loadIntents(publicKey.toBase58())
    } catch (e: any) { showToast('POST FAILED', 'error') }
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
      showToast(status === 'accepted' ? 'ACCEPTED' : status === 'contacted' ? 'CONTACTED' : 'DECLINED')
      if (selectedIntent) loadMatches(selectedIntent.id)
    } catch { showToast('UPDATE FAILED', 'error') }
  }

  const triggerAutoMatch = async (intentId: number) => {
    setMatchLoading(true)
    try {
      const result = await api.autoMatch(intentId)
      showToast(`FOUND ${result.count} MATCHES`)
      loadMatches(intentId)
    } catch { showToast('MATCH FAILED', 'error') }
    finally { setMatchLoading(false) }
  }

  // ── VIEWS ─────────────────────────────────────────────────────────

  if (view === 'home') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast} stats={stats}>
      {/* Marquee banner */}
      <div className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-content">
            ENCRYPTED INTENTS — AI AGENT MATCHING — SOLANA BLOCKCHAIN — ARCIUM MPC — DECENTRALIZED MARKETPLACE —
          </div>
          <div className="marquee-content">
            ENCRYPTED INTENTS — AI AGENT MATCHING — SOLANA BLOCKCHAIN — ARCIUM MPC — DECENTRALIZED MARKETPLACE —
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        {/* Hero Section */}
        <div className="mb-24 animate-fade-in-up">
          <span className="meta-tag mb-6 block">SOLANA AI AGENT HACKATHON — POWERED BY ARCIUM MPC</span>
          <h1 className="display-title mb-8 max-w-5xl">
            INTENT<br/>MARKET
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl font-semibold leading-relaxed mb-12">
            Post what you need. AI agents find the match. Encrypted, decentralized, unstoppable.
          </p>

          {/* Input Section */}
          {connected ? (
            <div className="max-w-4xl mb-8">
              <div className="border border-black p-2 scan-line">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={intentText}
                    onChange={e => setIntentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostIntent()}
                    placeholder='DESCRIBE YOUR INTENT...'
                    className="brutal-input flex-1 border-0"
                  />
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`brutal-btn ${isPrivate ? 'green' : 'outline'}`}
                  >
                    {isPrivate ? '🔒 PRIVATE' : '🌐 PUBLIC'}
                  </button>
                  <button
                    onClick={handlePostIntent}
                    disabled={loading || !intentText.trim()}
                    className="brutal-btn primary"
                  >
                    {loading ? 'POSTING...' : 'POST INTENT'}
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <span className="status-tag outline">
                  {isPrivate ? '🔐 ARCIUM ENCRYPTED' : '🌐 PUBLIC VISIBLE'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <WalletMultiButton className="!bg-black !text-white !font-bold !uppercase !text-xs !tracking-wider hover:!bg-[var(--neon-green)] !transition-all !border-black" />
            </div>
          )}

          <button
            onClick={() => { loadIntents(); setView('my-intents') }}
            className="brutal-btn"
          >
            BROWSE ALL INTENTS →
          </button>
        </div>

        {/* How It Works - Grid with Numbers */}
        <div className="brutalist-grid-3 mb-24 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {[
            { num: '01', title: 'POST INTENT', desc: 'Describe what you need — a co-founder, developer, service, anything.' },
            { num: '02', title: 'AGENTS MATCH', desc: 'AI agents evaluate privately and propose matches with reasoning.' },
            { num: '03', title: 'REVIEW & CONNECT', desc: 'See matches, read agent proposals, contact or hire directly.' },
          ].map((step, i) => (
            <div key={i} className="grid-cell">
              <span className="big-number mb-4">{step.num}</span>
              <h3 className="font-black text-xl mb-4 uppercase tracking-tight">{step.title}</h3>
              <p className="text-sm leading-relaxed opacity-70">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Stats Dashboard */}
        {stats && (stats.agents > 0 || stats.intents > 0 || stats.matches > 0) && (
          <div className="brutalist-grid-3 mb-24 animate-scale-in" style={{ animationDelay: '200ms' }}>
            {[
              { label: 'AGENTS', value: stats.agents },
              { label: 'INTENTS', value: stats.intents },
              { label: 'MATCHES', value: stats.matches },
            ].map((stat, i) => (
              <div key={i} className="grid-cell text-center">
                <div className="big-number mb-2">{stat.value}</div>
                <div className="meta-tag">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Intents */}
        {intents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-3xl uppercase tracking-tight">Recent Intents</h2>
              <button onClick={() => { loadIntents(); setView('my-intents') }} className="meta-tag hover:underline">
                VIEW ALL →
              </button>
            </div>
            <div className="space-y-3">
              {intents.slice(0, 6).map((intent, i) => (
                <div key={intent.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <IntentCard intent={intent} onClick={() => openIntent(intent)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )

  if (view === 'my-intents') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast} stats={stats}>
      <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-black">
          <div>
            <button onClick={() => setView('home')} className="meta-tag mb-4 hover:underline">
              ← BACK
            </button>
            <h1 className="font-black text-4xl uppercase tracking-tight">All Intents</h1>
          </div>
          {connected && (
            <button onClick={() => setView('home')} className="brutal-btn">
              + POST INTENT
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-24 h-24 border border-black brutal-skeleton mb-6"></div>
            <div className="meta-tag">LOADING...</div>
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center py-20 border border-black">
            <h3 className="font-black text-2xl mb-4 uppercase">No Intents Yet</h3>
            <p className="mb-8 opacity-60">Be the first to post.</p>
            {connected && (
              <button onClick={() => setView('home')} className="brutal-btn primary">
                POST INTENT
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {intents.map((intent, i) => (
              <div key={intent.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <IntentCard intent={intent} onClick={() => openIntent(intent)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  )

  if (view === 'intent-detail' && selectedIntent) return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast} stats={stats}>
      <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
        <button onClick={() => { setView('my-intents'); loadIntents() }} className="meta-tag mb-8 hover:underline">
          ← BACK TO INTENTS
        </button>

        {/* Intent Detail */}
        <div className="border-4 border-black p-8 mb-12">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="status-tag">{selectedIntent.category.toUpperCase()}</span>
                <span className="meta-tag opacity-50">{timeAgo(selectedIntent.created_at)}</span>
                {selectedIntent.is_private && selectedIntent.encrypted_data && (
                  <span className="status-tag green">🔒 ENCRYPTED</span>
                )}
              </div>
              <h1 className="font-black text-4xl mb-6 leading-tight uppercase">{selectedIntent.title}</h1>
              <p className="text-lg leading-relaxed opacity-80">{selectedIntent.description}</p>
            </div>
          </div>

          {/* Encryption Proof */}
          {selectedIntent.encrypted_data && selectedIntent.encryption_method && (
            <div className="mt-8 pt-8 border-t border-black">
              <div className="flex items-start gap-4">
                <Lock className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-black text-sm mb-3 uppercase tracking-wide">Confidential Intent</div>
                  <p className="text-sm opacity-60 mb-4 leading-relaxed">
                    Encrypted using Arcium-ready architecture. Only you and matched agents can decrypt.
                  </p>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex gap-3">
                      <span className="font-black min-w-[80px]">METHOD:</span>
                      <code className="font-bold">{selectedIntent.encryption_method}</code>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-black min-w-[80px]">HASH:</span>
                      <code className="opacity-60 truncate break-all">
                        {selectedIntent.encrypted_data.substring(0, 48)}...
                      </code>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-black min-w-[80px]">NONCE:</span>
                      <code className="opacity-60">{selectedIntent.encryption_nonce?.substring(0, 32)}...</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Matches Section */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
          <h2 className="font-black text-3xl uppercase tracking-tight">
            Matches ({matches.length})
          </h2>
          <button
            onClick={() => triggerAutoMatch(selectedIntent.id)}
            disabled={matchLoading}
            className="brutal-btn primary scan-line"
          >
            {matchLoading ? '⚡ SCANNING...' : '⚡ FIND MATCHES'}
          </button>
        </div>

        {matchLoading && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 border border-black brutal-skeleton mb-6"></div>
            <div className="meta-tag">SCANNING AGENTS...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 border-2 border-black">
            <p className="meta-tag opacity-50">NO MATCHES YET</p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match, i) => (
              <MatchCard key={match.id} match={match} onAction={handleMatchAction} delay={i * 50} />
            ))}
          </div>
        )}
      </div>
    </Shell>
  )

  return null
}

// ── COMPONENTS ────────────────────────────────────────────────

function Shell({ children, wallet, onNav, connected, toast, stats }: any) {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Nav */}
      <nav className="border-b border-black sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => onNav('home')} className="font-black text-lg tracking-tight uppercase hover:text-[var(--neon-green)] transition-colors">
            INTENT MARKET
          </button>
          <div className="flex items-center gap-6">
            {stats && (stats.agents > 0 || stats.intents > 0) && (
              <div className="hidden md:flex items-center gap-3 text-xs">
                <span className="status-tag outline">{stats.agents} AGENTS</span>
                <span className="status-tag outline">{stats.intents} INTENTS</span>
                <span className="status-tag outline">{stats.matches} MATCHES</span>
              </div>
            )}
            {connected && (
              <>
                <button onClick={() => onNav('home')} className="hidden sm:block meta-tag hover:underline">
                  POST
                </button>
                <button onClick={() => onNav('my-intents')} className="hidden sm:block meta-tag hover:underline">
                  BROWSE
                </button>
              </>
            )}
            {wallet}
          </div>
        </div>
      </nav>

      {/* Content */}
      {children}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-scale-in">
          <div className={`border-2 ${toast.type === 'error' ? 'border-red-600 bg-red-100' : 'border-black bg-[var(--neon-green)]'} px-6 py-4`}>
            <span className="font-black text-xs tracking-wider uppercase">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-black py-8 mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="meta-tag opacity-50">
            BUILT FOR SOLANA AI AGENT HACKATHON — POWERED BY ARCIUM MPC ENCRYPTION
          </p>
        </div>
      </footer>
    </main>
  )
}

function IntentCard({ intent, onClick }: { intent: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="brutal-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="status-tag">{intent.category.toUpperCase()}</span>
            {intent.is_private && intent.encrypted_data && (
              <span className="status-tag green">🔒 ENCRYPTED</span>
            )}
            <span className="meta-tag opacity-40">{timeAgo(intent.created_at)}</span>
          </div>

          {/* Title */}
          <h3 className="font-black text-2xl mb-3 line-clamp-2 leading-tight uppercase tracking-tight">{intent.title}</h3>

          {/* Description */}
          <p className="text-sm leading-relaxed opacity-70 line-clamp-2 mb-4">{intent.description}</p>

          {/* Match Count */}
          {intent.match_count > 0 && (
            <div className="mt-4 pt-4 border-t border-black">
              <span className="meta-tag">
                {intent.match_count} {intent.match_count === 1 ? 'MATCH' : 'MATCHES'}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight className="w-8 h-8 flex-shrink-0 opacity-30 transition-all" />
      </div>
    </div>
  )
}

function MatchCard({ match, onAction, delay }: { match: any; onAction: (id: number, status: string) => void; delay: number }) {
  const scorePercent = Math.round((match.match_score || 0) * 100)

  return (
    <div className="brutal-card no-hover p-8 animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {/* Header */}
      <div className="flex items-center gap-6 mb-6 pb-6 border-b border-black">
        <div className="w-16 h-16 border border-black flex items-center justify-center text-3xl bg-[var(--neon-green)]">
          🤖
        </div>
        <div className="flex-1">
          <div className="font-black text-2xl mb-1 uppercase">{match.agent_name || 'AGENT'}</div>
          <div className="meta-tag opacity-60">
            {match.match_type === 'owner_suitable' ? 'OWNER MATCH' : match.match_type === 'both' ? 'AGENT + OWNER' : 'AGENT DELIVERY'}
          </div>
        </div>
        <div className="big-number text-right" style={{ fontSize: '3rem' }}>{scorePercent}%</div>
      </div>

      {/* Match Reasoning */}
      <div className="border border-black p-6 mb-6">
        <div className="meta-tag mb-3 opacity-50">WHY THIS MATCH</div>
        <p className="text-sm leading-relaxed">{match.match_reason}</p>
      </div>

      {/* Agent Message */}
      {match.agent_message && (
        <div className="border border-black p-6 mb-6">
          <div className="meta-tag mb-3 opacity-50">AGENT MESSAGE</div>
          <p className="text-sm leading-relaxed">{match.agent_message}</p>
        </div>
      )}

      {/* Skills */}
      {match.agent_skills?.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {match.agent_skills.map((s: string, i: number) => (
            <span key={i} className="status-tag outline font-mono">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Owner Info */}
      {match.owner_name && (
        <div className="meta-tag opacity-50 mb-6">
          OWNER: <span className="font-black opacity-100">{match.owner_name}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-black">
        <div className="status-tag">STATUS: {match.status.toUpperCase()}</div>

        {match.status === 'proposed' && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => onAction(match.id, 'accepted')}
              className="brutal-btn primary"
            >
              ✓ ACCEPT
            </button>
            <button
              onClick={() => onAction(match.id, 'contacted')}
              className="brutal-btn"
            >
              → CONTACT
            </button>
            <button
              onClick={() => onAction(match.id, 'declined')}
              className="brutal-btn"
              style={{ opacity: 0.5 }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

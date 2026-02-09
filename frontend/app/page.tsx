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
      showToast(isPrivate ? 'POSTED [ENCRYPTED]' : 'POSTED [PUBLIC]')
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
      <div className="max-w-4xl mx-auto py-16 md:py-24 animate-slide-up">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[0.95] tracking-tight uppercase">
            POST YOUR INTENT.<br/>AGENTS FIND THE MATCH.
          </h1>
          <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto opacity-60">
            First encrypted intent marketplace. Describe what you need — a co-founder, a developer, a service — AI agents match you privately.
          </p>

          {connected ? (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="border-4 border-black p-1">
                <div className="flex gap-1">
                  <input
                    value={intentText}
                    onChange={e => setIntentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostIntent()}
                    placeholder='WHAT DO YOU NEED?'
                    className="flex-1 bg-white px-4 py-4 text-black placeholder-black/30 outline-none font-medium text-sm tracking-wide"
                  />
                  <button
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`px-4 py-4 font-black text-xs tracking-widest transition-all ${isPrivate ? 'bg-black text-white' : 'bg-white text-black border-l-4 border-black'}`}
                  >
                    {isPrivate ? '🔒' : '🌐'}
                  </button>
                  <button
                    onClick={handlePostIntent}
                    disabled={loading || !intentText.trim()}
                    className="px-6 py-4 bg-black text-white font-black text-xs tracking-widest hover:bg-black/80 disabled:opacity-30 transition-all"
                  >
                    {loading ? '...' : 'POST'}
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs font-mono opacity-50">
                {isPrivate ? '⚡ PRIVATE — ENCRYPTED ON-CHAIN' : '⚡ PUBLIC — VISIBLE IN DIRECTORY'}
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-8">
              <WalletMultiButton />
            </div>
          )}

          <button
            onClick={() => { loadIntents(); setView('my-intents') }}
            className="border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-all font-black text-xs tracking-widest"
          >
            BROWSE ALL INTENTS →
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {[
            { num: '01', title: 'POST INTENT', desc: 'Describe what you need. A CTO, designer, integration — anything.' },
            { num: '02', title: 'AGENTS MATCH', desc: 'AI agents evaluate privately and respond with why they fit.' },
            { num: '03', title: 'REVIEW & CONNECT', desc: 'See matches, read reasons, contact owner or hire agent.' },
          ].map((step, i) => (
            <div key={i} className="border-2 border-black p-6 hover:bg-black hover:text-white transition-all animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="font-black text-4xl mb-4 opacity-30">{step.num}</div>
              <h3 className="font-black text-sm mb-3 tracking-widest">{step.title}</h3>
              <p className="text-xs opacity-60 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent intents */}
        {intents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">RECENT INTENTS</h2>
              <button onClick={() => { loadIntents(); setView('my-intents') }} className="text-xs font-black tracking-widest hover:underline">
                VIEW ALL →
              </button>
            </div>
            <div className="space-y-2">
              {intents.slice(0, 6).map((intent) => (
                <IntentCard key={intent.id} intent={intent} onClick={() => openIntent(intent)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )

  if (view === 'my-intents') return (
    <Shell wallet={<WalletMultiButton />} onNav={setView} connected={connected} toast={toast} stats={stats}>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setView('home')} className="text-xs font-black mb-4 opacity-50 hover:opacity-100 tracking-widest">
              ← BACK
            </button>
            <h1 className="text-4xl font-black tracking-tight">ALL INTENTS</h1>
          </div>
          {connected && (
            <button onClick={() => setView('home')} className="border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-all font-black text-xs tracking-widest">
              + POST INTENT
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs font-black tracking-widest">LOADING...</div>
        ) : intents.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-black mb-2">NO INTENTS YET</h3>
            <p className="opacity-50 mb-6 text-sm">Be the first to post.</p>
            {connected && (
              <button onClick={() => setView('home')} className="border-2 border-black px-8 py-4 hover:bg-black hover:text-white transition-all font-black text-xs tracking-widest">
                POST INTENT
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
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
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => { setView('my-intents'); loadIntents() }} className="text-xs font-black mb-6 opacity-50 hover:opacity-100 tracking-widest">
          ← BACK TO INTENTS
        </button>

        {/* Intent detail */}
        <div className="border-4 border-black p-8 mb-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-black tracking-widest opacity-50">{selectedIntent.category.toUpperCase()}</span>
                <span className="text-xs opacity-30">•</span>
                <span className="text-xs opacity-50">{timeAgo(selectedIntent.created_at)}</span>
                {selectedIntent.is_private && selectedIntent.encrypted_data && (
                  <>
                    <span className="text-xs opacity-30">•</span>
                    <span className="text-xs font-black">🔒 ENCRYPTED</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl font-black mb-4 leading-tight">{selectedIntent.title}</h1>
              <p className="opacity-70 leading-relaxed">{selectedIntent.description}</p>
            </div>
          </div>

          {/* Encryption proof */}
          {selectedIntent.encrypted_data && selectedIntent.encryption_method && (
            <div className="mt-6 pt-6 border-t-2 border-black">
              <div className="flex items-start gap-4">
                <Lock className="w-6 h-6 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm mb-2 tracking-wide">CONFIDENTIAL INTENT</div>
                  <p className="text-xs opacity-60 mb-3 leading-relaxed">
                    Encrypted using Arcium-ready architecture. Only you and matched agents can decrypt.
                  </p>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex gap-2">
                      <span className="opacity-50">METHOD:</span>
                      <code className="font-black">{selectedIntent.encryption_method}</code>
                    </div>
                    <div className="flex gap-2">
                      <span className="opacity-50">HASH:</span>
                      <code className="opacity-50 truncate" title={selectedIntent.encrypted_data}>
                        {selectedIntent.encrypted_data.substring(0, 32)}...
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <span className="opacity-50">NONCE:</span>
                      <code className="opacity-50">{selectedIntent.encryption_nonce?.substring(0, 24)}...</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Matches */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">
            MATCHES ({matches.length})
          </h2>
          <button
            onClick={() => triggerAutoMatch(selectedIntent.id)}
            disabled={matchLoading}
            className="border-2 border-black px-6 py-3 hover:bg-black hover:text-white disabled:opacity-30 transition-all font-black text-xs tracking-widest"
          >
            {matchLoading ? 'FINDING...' : '⚡ FIND MATCHES'}
          </button>
        </div>

        {matchLoading && matches.length === 0 ? (
          <div className="text-center py-12 text-xs font-black tracking-widest opacity-50">LOADING MATCHES...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 border-2 border-black">
            <p className="opacity-50 text-sm">NO MATCHES YET</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => (
              <MatchCard key={match.id} match={match} onAction={handleMatchAction} delay={i * 40} />
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
      <nav className="border-b-4 border-black bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNav('home')} className="font-black text-sm tracking-widest">
            INTENT MARKET
          </button>
          <div className="flex items-center gap-4">
            {stats && (stats.agents > 0 || stats.intents > 0) && (
              <div className="hidden md:flex items-center gap-3 text-[10px] font-black tracking-widest opacity-40">
                <span>{stats.agents} AGENTS</span>
                <span>•</span>
                <span>{stats.intents} INTENTS</span>
                <span>•</span>
                <span>{stats.matches} MATCHES</span>
              </div>
            )}
            {connected && (
              <>
                <button onClick={() => onNav('home')} className="hidden sm:block text-xs font-black tracking-widest opacity-50 hover:opacity-100">
                  POST
                </button>
                <button onClick={() => onNav('my-intents')} className="hidden sm:block text-xs font-black tracking-widest opacity-50 hover:opacity-100">
                  BROWSE
                </button>
              </>
            )}
            {wallet}
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 border-4 font-black text-xs tracking-widest animate-fade-in ${toast.type === 'error' ? 'bg-black text-white border-black' : 'bg-white text-black border-black'}`}>
          {toast.msg}
        </div>
      )}
    </main>
  )
}

function IntentCard({ intent, onClick }: { intent: any; onClick: () => void }) {
  const encryptionHash = intent.encrypted_data ? intent.encrypted_data.substring(0, 12) + '...' : null

  return (
    <div
      onClick={onClick}
      className="group border-2 border-black p-5 cursor-pointer hover:bg-black hover:text-white transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-black tracking-widest opacity-50">
              {intent.category.toUpperCase()}
            </span>
            {intent.is_private && intent.encrypted_data && (
              <>
                <span className="text-[10px] opacity-30">•</span>
                <span className="text-[10px] font-black flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ENCRYPTED
                </span>
              </>
            )}
            <span className="text-[10px] opacity-30">•</span>
            <span className="text-[10px] opacity-50">{timeAgo(intent.created_at)}</span>
          </div>
          <h3 className="font-black text-lg mb-2 line-clamp-2 leading-tight">{intent.title}</h3>
          <p className="text-sm opacity-60 line-clamp-2 mb-3">{intent.description}</p>

          {intent.encrypted_data && intent.encryption_method && (
            <div className="inline-flex items-center gap-2 text-[10px] font-mono opacity-50 mb-2">
              <Lock className="w-3 h-3" />
              <code>{encryptionHash}</code>
            </div>
          )}
        </div>
        <ArrowRight className="w-5 h-5 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
      {intent.match_count > 0 && (
        <div className="mt-3 pt-3 border-t border-black/20 group-hover:border-white/20">
          <span className="text-xs font-black tracking-widest opacity-50">{intent.match_count} MATCHES</span>
        </div>
      )}
    </div>
  )
}

function MatchCard({ match, onAction, delay }: { match: any; onAction: (id: number, status: string) => void; delay: number }) {
  const scorePercent = Math.round((match.match_score || 0) * 100)

  return (
    <div className="border-4 border-black p-6 hover:bg-black hover:text-white transition-all animate-fade-in group" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 border-2 border-black group-hover:border-white flex items-center justify-center font-black text-lg">
              A
            </div>
            <div className="flex-1">
              <div className="font-black text-lg mb-1">{match.agent_name || 'AGENT'}</div>
              <div className="text-xs opacity-50 uppercase tracking-wide">
                {match.match_type === 'owner_suitable' ? 'Owner Match' : match.match_type === 'both' ? 'Agent + Owner' : 'Agent Delivery'}
              </div>
            </div>
            <div className="font-black text-3xl">{scorePercent}%</div>
          </div>

          <div className="border-2 border-black group-hover:border-white p-4 mb-4">
            <div className="text-[10px] font-black tracking-widest mb-2 opacity-50">WHY THIS MATCH</div>
            <p className="text-sm leading-relaxed">{match.match_reason}</p>
          </div>

          {match.agent_message && (
            <div className="border border-black/30 group-hover:border-white/30 p-4 mb-4">
              <div className="text-[10px] font-black tracking-widest mb-2 opacity-50">AGENT MESSAGE</div>
              <p className="text-sm">{match.agent_message}</p>
            </div>
          )}

          {match.agent_skills?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {match.agent_skills.map((s: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-1 border border-black/30 group-hover:border-white/30 font-mono">
                  {s}
                </span>
              ))}
            </div>
          )}

          {match.owner_name && (
            <div className="text-xs opacity-50">
              OWNER: <span className="font-black opacity-100">{match.owner_name}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-6 border-t-2 border-black group-hover:border-white">
        <span className="text-xs font-black tracking-widest opacity-50">
          STATUS: {match.status.toUpperCase()}
        </span>
        {match.status === 'proposed' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAction(match.id, 'accepted')}
              className="px-4 py-2 bg-black text-white group-hover:bg-white group-hover:text-black border-2 border-black group-hover:border-white font-black text-xs tracking-widest transition-colors"
            >
              ACCEPT
            </button>
            <button
              onClick={() => onAction(match.id, 'contacted')}
              className="px-4 py-2 border-2 border-black group-hover:border-white font-black text-xs tracking-widest hover:bg-white hover:text-black group-hover:hover:bg-black group-hover:hover:text-white transition-colors"
            >
              CONTACT
            </button>
            <button
              onClick={() => onAction(match.id, 'declined')}
              className="px-3 py-2 border-2 border-black/30 group-hover:border-white/30 text-xs opacity-50 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

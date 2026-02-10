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
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 animate-slide-up relative z-10">
        {/* Hero */}
        <div className="text-center mb-32 relative">
          {/* Animated gradient orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/5 to-transparent blur-3xl pointer-events-none animate-glow-pulse"></div>

          <div className="relative z-10">
            {/* Badge */}
            <div className="mb-12 inline-block">
              <div className="glass px-6 py-3 rounded-full relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <span className="text-xs font-black tracking-[0.3em] relative z-10">SOLANA AI AGENT HACKATHON</span>
              </div>
            </div>

            {/* Headline with animated gradient */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 leading-[0.85] tracking-tighter uppercase">
              <span className="block text-gradient">POST YOUR INTENT.</span>
              <span className="block mt-4">AGENTS FIND THE MATCH.</span>
            </h1>

            <p className="text-lg md:text-xl mb-16 max-w-2xl mx-auto opacity-70 leading-relaxed font-light">
              First encrypted intent marketplace. Describe what you need — a co-founder, a developer, a service — AI agents match you privately.
            </p>
          </div>

          {/* Premium input section */}
          {connected ? (
            <div className="max-w-3xl mx-auto mb-12">
              <div className="gradient-border rounded-2xl p-[2px] animate-glow-pulse">
                <div className="bg-black rounded-2xl overflow-hidden">
                  <div className="flex gap-0">
                    <input
                      value={intentText}
                      onChange={e => setIntentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePostIntent()}
                      placeholder='WHAT DO YOU NEED?'
                      className="flex-1 bg-black px-8 py-6 text-white placeholder-white/30 outline-none font-medium text-lg tracking-wide"
                    />
                    <button
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`px-8 py-6 font-black text-sm tracking-widest transition-all duration-300 ${isPrivate ? 'btn-premium' : 'glass hover:bg-white/10'}`}
                    >
                      {isPrivate ? '🔒 PRIVATE' : '🌐 PUBLIC'}
                    </button>
                    <button
                      onClick={handlePostIntent}
                      disabled={loading || !intentText.trim()}
                      className="btn-premium px-10 py-6 rounded-r-2xl disabled:opacity-30 disabled:cursor-not-allowed text-sm tracking-widest"
                    >
                      {loading ? 'POSTING...' : 'POST INTENT'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs font-mono opacity-50 tracking-wider status-badge mx-auto w-fit">
                {isPrivate ? '🔐 ENCRYPTED ON-CHAIN' : '🌐 PUBLICLY VISIBLE'}
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-12">
              <WalletMultiButton className="!bg-gradient-to-r !from-white !to-gray-400 !text-black !font-black" />
            </div>
          )}

          <button
            onClick={() => { loadIntents(); setView('my-intents') }}
            className="glass px-12 py-5 rounded-full hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 font-black text-xs tracking-[0.2em] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] group inline-flex items-center gap-3"
          >
            BROWSE ALL INTENTS
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[
            { num: '01', title: 'POST INTENT', desc: 'Describe what you need. A CTO, designer, integration — anything.', icon: '📝' },
            { num: '02', title: 'AGENTS MATCH', desc: 'AI agents evaluate privately and respond with why they fit.', icon: '🤖' },
            { num: '03', title: 'REVIEW & CONNECT', desc: 'See matches, read reasons, contact owner or hire agent.', icon: '✨' },
          ].map((step, i) => (
            <div key={i} className="gradient-border rounded-3xl animate-fade-in-up card-float group" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="glass rounded-3xl p-10 relative overflow-hidden h-full">
                {/* Icon background */}
                <div className="absolute top-0 right-0 text-9xl opacity-[0.05] group-hover:opacity-[0.1] transition-opacity duration-500 select-none">{step.icon}</div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-gradient font-black text-6xl mb-6 leading-none">{step.num}</div>
                  <h3 className="font-black text-lg mb-4 tracking-[0.15em]">{step.title}</h3>
                  <p className="text-sm opacity-60 group-hover:opacity-90 leading-relaxed transition-opacity duration-300">{step.desc}</p>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Stats Dashboard */}
        {stats && (stats.agents > 0 || stats.intents > 0 || stats.matches > 0) && (
          <div className="grid grid-cols-3 gap-6 mb-32">
            {[
              { label: 'ACTIVE AGENTS', value: stats.agents, icon: '🤖', gradient: 'from-white/10 to-white/5' },
              { label: 'TOTAL INTENTS', value: stats.intents, icon: '⚡', gradient: 'from-white/10 to-white/5' },
              { label: 'MATCHES MADE', value: stats.matches, icon: '✨', gradient: 'from-white/10 to-white/5' },
            ].map((stat, i) => (
              <div key={i} className="animate-scale-in card-float" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="glass rounded-3xl p-8 text-center relative overflow-hidden group hover-glow">
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                  {/* Icon */}
                  <div className="absolute top-4 right-4 text-5xl opacity-10 group-hover:opacity-20 transition-opacity">{stat.icon}</div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-5xl md:text-6xl font-black mb-3 text-gradient">{stat.value}</div>
                    <div className="text-xs font-black tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</div>
                  </div>

                  {/* Animated border pulse */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 animate-glow-pulse" style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.1)' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent intents */}
        {intents.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black tracking-tight">RECENT INTENTS</h2>
              <button onClick={() => { loadIntents(); setView('my-intents') }} className="text-xs font-black tracking-widest hover:underline opacity-70 hover:opacity-100 transition-opacity">
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
            <button onClick={() => setView('home')} className="border-2 border-white px-6 py-3 hover:bg-white hover:text-black transition-all font-black text-xs tracking-widest">
              + POST INTENT
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-20 h-20 glass rounded-2xl mb-6 skeleton"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-glow-pulse"></div>
            </div>
            <div className="text-xs font-black tracking-[0.3em] opacity-50 animate-glow-pulse">LOADING...</div>
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-black mb-2">NO INTENTS YET</h3>
            <p className="opacity-50 mb-6 text-sm">Be the first to post.</p>
            {connected && (
              <button onClick={() => setView('home')} className="border-2 border-white px-8 py-4 hover:bg-white hover:text-black transition-all font-black text-xs tracking-widest">
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
        <div className="border-4 border-white p-8 mb-8">
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
            <div className="mt-6 pt-6 border-t-2 border-white">
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
            className="border-4 border-white px-6 py-3 hover:bg-white hover:text-black disabled:opacity-30 transition-all duration-300 font-black text-xs tracking-widest scan-line hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            {matchLoading ? '⚡ FINDING...' : '⚡ FIND MATCHES'}
          </button>
        </div>

        {matchLoading && matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 glass rounded-2xl mb-6 skeleton"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-glow-pulse"></div>
            </div>
            <div className="text-xs font-black tracking-[0.3em] opacity-50 animate-glow-pulse">FINDING MATCHES...</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 border-2 border-white">
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
    <main className="min-h-screen bg-black text-white relative">
      {/* Premium glass nav */}
      <nav className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => onNav('home')} className="font-black text-base tracking-widest hover:text-gradient transition-all">
            INTENT MARKET
          </button>
          <div className="flex items-center gap-6">
            {stats && (stats.agents > 0 || stats.intents > 0) && (
              <div className="hidden md:flex items-center gap-4 text-[10px] font-bold tracking-wider opacity-50">
                <span className="glass px-3 py-1.5 rounded-full">{stats.agents} AGENTS</span>
                <span className="glass px-3 py-1.5 rounded-full">{stats.intents} INTENTS</span>
                <span className="glass px-3 py-1.5 rounded-full">{stats.matches} MATCHES</span>
              </div>
            )}
            {connected && (
              <>
                <button onClick={() => onNav('home')} className="hidden sm:block text-xs font-black tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                  POST
                </button>
                <button onClick={() => onNav('my-intents')} className="hidden sm:block text-xs font-black tracking-widest opacity-60 hover:opacity-100 transition-opacity">
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

      {/* Premium toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-scale-in">
          <div className={`gradient-border rounded-2xl ${toast.type === 'error' ? 'opacity-100' : ''}`}>
            <div className="glass rounded-2xl px-6 py-4 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} animate-glow-pulse`}></div>
              <span className="font-black text-xs tracking-widest">{toast.msg}</span>
            </div>
          </div>
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
      className="gradient-border rounded-2xl cursor-pointer card-float group"
    >
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Privacy indicator */}
        {intent.is_private && (
          <div className="absolute top-0 right-0 glass rounded-bl-2xl px-3 py-2">
            <Lock className="w-4 h-4 opacity-60" />
          </div>
        )}

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 mb-4">
              <span className="status-badge !py-1 !px-3 !text-[10px]">
                {intent.category.toUpperCase()}
              </span>
              {intent.is_private && intent.encrypted_data && (
                <span className="status-badge !py-1 !px-3 !text-[10px] flex items-center gap-1">
                  <Lock className="w-3 h-3" /> ENCRYPTED
                </span>
              )}
              <span className="text-[10px] opacity-40 group-hover:opacity-60 transition-opacity">{timeAgo(intent.created_at)}</span>
            </div>

            {/* Title */}
            <h3 className="font-black text-xl mb-3 line-clamp-2 leading-tight group-hover:text-gradient transition-all">{intent.title}</h3>

            {/* Description */}
            <p className="text-sm opacity-60 group-hover:opacity-90 transition-opacity line-clamp-2 mb-4 leading-relaxed">{intent.description}</p>

            {/* Encryption hash */}
            {intent.encrypted_data && intent.encryption_method && (
              <div className="inline-flex items-center gap-2 text-[10px] font-mono opacity-40 group-hover:opacity-70 transition-opacity">
                <Lock className="w-3 h-3" />
                <code className="bg-white/5 px-2 py-1 rounded">{encryptionHash}</code>
              </div>
            )}
          </div>

          {/* Arrow */}
          <ArrowRight className="w-6 h-6 opacity-20 group-hover:opacity-100 group-hover:translate-x-2 transition-all flex-shrink-0 mt-1" />
        </div>

        {/* Match count */}
        {intent.match_count > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-white to-gray-400 rounded-full animate-glow-pulse"></div>
              <span className="text-xs font-black tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                {intent.match_count} ACTIVE {intent.match_count === 1 ? 'MATCH' : 'MATCHES'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MatchCard({ match, onAction, delay }: { match: any; onAction: (id: number, status: string) => void; delay: number }) {
  const scorePercent = Math.round((match.match_score || 0) * 100)
  const highScore = scorePercent >= 80

  return (
    <div className={`gradient-border rounded-3xl animate-fade-in-up ${highScore ? 'animate-glow-pulse' : ''}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="glass rounded-3xl p-8 relative overflow-hidden group">
        {/* Score watermark */}
        <div className="absolute top-0 right-0 text-[12rem] opacity-[0.02] font-black leading-none select-none">{scorePercent}</div>

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="flex-1">
              <div className="font-black text-xl mb-1">{match.agent_name || 'AGENT'}</div>
              <div className="text-xs opacity-60 uppercase tracking-wide">
                {match.match_type === 'owner_suitable' ? 'Owner Match' : match.match_type === 'both' ? 'Agent + Owner' : 'Agent Delivery'}
              </div>
            </div>
            <div className={`text-5xl font-black ${highScore ? 'text-gradient' : 'opacity-80'}`}>{scorePercent}%</div>
          </div>

          {/* Match reasoning */}
          <div className="glass rounded-2xl p-6 mb-4 border border-white/10">
            <div className="text-[10px] font-black tracking-[0.2em] mb-3 opacity-50">WHY THIS MATCH</div>
            <p className="text-sm leading-relaxed opacity-80">{match.match_reason}</p>
          </div>

          {/* Agent message */}
          {match.agent_message && (
            <div className="glass rounded-2xl p-6 mb-4 border border-white/10">
              <div className="text-[10px] font-black tracking-[0.2em] mb-3 opacity-50">AGENT MESSAGE</div>
              <p className="text-sm leading-relaxed opacity-80">{match.agent_message}</p>
            </div>
          )}

          {/* Skills */}
          {match.agent_skills?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {match.agent_skills.map((s: string, i: number) => (
                <span key={i} className="status-badge !text-[10px] !py-1 !px-3 font-mono">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Owner info */}
          {match.owner_name && (
            <div className="text-xs opacity-50">
              OWNER: <span className="font-black opacity-100">{match.owner_name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="status-badge !text-[10px]">
              STATUS: {match.status.toUpperCase()}
            </div>

            {match.status === 'proposed' && (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => onAction(match.id, 'accepted')}
                  className="btn-premium px-6 py-3 rounded-xl font-black text-xs tracking-widest"
                >
                  ✓ ACCEPT
                </button>
                <button
                  onClick={() => onAction(match.id, 'contacted')}
                  className="glass px-6 py-3 rounded-xl font-black text-xs tracking-widest hover:bg-white/10 transition-all"
                >
                  → CONTACT
                </button>
                <button
                  onClick={() => onAction(match.id, 'declined')}
                  className="glass px-4 py-3 rounded-xl text-xs opacity-50 hover:opacity-100 hover:bg-red-500/10 transition-all"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

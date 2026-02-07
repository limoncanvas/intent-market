'use client'

import { ArrowLeft, CheckCircle, XCircle, Sparkles, Loader2, TrendingUp, User } from 'lucide-react'
import { useMatches } from '@/hooks/useMatches'
import { ToastType } from './Toast'
import type { Intent } from '../../../shared/types'

interface MatchListProps {
  intent: Intent
  onBack: () => void
  onToast?: (message: string, type: ToastType) => void
}

export function MatchList({ intent, onBack, onToast }: MatchListProps) {
  const { matches, loading, finding, findMatches, updateMatchStatus } = useMatches(intent.id)

  const handleFindMatches = async () => {
    try {
      await findMatches()
      onToast?.('Matches found successfully!', 'success')
    } catch (error: any) {
      onToast?.('Failed to find matches. Please try again.', 'error')
    }
  }

  const handleUpdateStatus = async (matchId: number, status: string) => {
    try {
      await updateMatchStatus(matchId, status)
      onToast?.(
        status === 'accepted' ? 'Match accepted!' : 'Match rejected',
        status === 'accepted' ? 'success' : 'info'
      )
    } catch (error: any) {
      onToast?.('Failed to update match status', 'error')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-purple-400'
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors self-start"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">{intent.title}</h2>
          <p className="text-gray-300 text-lg">{intent.description}</p>
        </div>
        <button
          onClick={handleFindMatches}
          disabled={finding}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg"
        >
          {finding ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Find Matches
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading matches...</p>
          </div>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="max-w-md mx-auto">
            <Sparkles className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No matches found yet</h3>
            <p className="text-gray-400 mb-6">
              Click "Find Matches" to discover compatible intents
            </p>
            <button
              onClick={handleFindMatches}
              disabled={finding}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold disabled:opacity-50 transition-all"
            >
              {finding ? 'Finding matches...' : 'Find Matches Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {matches.map((match, index) => (
            <div
              key={match.id}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 hover:border-purple-500/30 transition-all"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-white">
                      {match.matched_intent_title}
                    </h3>
                    {match.status === 'accepted' && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30">
                        Accepted
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {match.matched_intent_description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{match.matched_agent_name}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 md:text-right">
                  <div className={`text-4xl font-bold mb-1 ${getScoreColor(match.match_score)}`}>
                    {Math.round(match.match_score * 100)}%
                  </div>
                  <div className="text-xs text-gray-400 mb-2">Match Score</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3" />
                    High compatibility
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <span className="text-xs text-gray-400 capitalize">
                  Status: <span className="text-white">{match.status}</span>
                </span>
                {match.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(match.id, 'accepted')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(match.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
                {match.status === 'accepted' && (
                  <span className="text-sm text-green-400 font-medium">
                    ✓ Match accepted
                  </span>
                )}
                {match.status === 'rejected' && (
                  <span className="text-sm text-gray-400">Match rejected</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

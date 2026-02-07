'use client'

import { useState, useEffect } from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { IntentCard } from '@/components/IntentCard'
import { CreateIntentModal } from '@/components/CreateIntentModal'
import { AgentProfileModal } from '@/components/AgentProfileModal'
import { MatchList } from '@/components/MatchList'
import { OpenClawSync } from '@/components/OpenClawSync'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { useIntents } from '@/hooks/useIntents'
import { INTENT_CATEGORIES } from '@/lib/constants'
import type { Intent } from '../../../shared/types'
import { Search, Plus, Sparkles, Filter, Loader2, TrendingUp, User } from 'lucide-react'

export default function Home() {
  const { publicKey, connected } = useWallet()
  const { intents, loading, error, refetch } = useIntents()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAgentProfileModal, setShowAgentProfileModal] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { toasts, showToast, removeToast } = useToast()

  // Show error toast if fetch fails
  useMemo(() => {
    if (error) {
      showToast('Failed to load intents. Please try again.', 'error')
    }
  }, [error])

  const filteredIntents = intents.filter((intent) => {
    const matchesSearch =
      intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intent.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || intent.category === selectedCategory
    return matchesSearch && matchesCategory && intent.status === 'active'
  })

  const activeIntentsCount = intents.filter((i) => i.status === 'active').length
  const uniqueAgents = new Set(intents.map((i) => i.wallet_address)).size
  const categoriesCount = new Set(intents.map((i) => i.category).filter(Boolean)).size

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                Intent Market
              </h1>
              <p className="text-gray-300 text-lg">
                Match agent owners based on complementary intents
              </p>
            </div>
            <div className="flex items-center gap-3">
              {connected && (
                <button
                  onClick={() => setShowAgentProfileModal(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium flex items-center gap-2 transition-colors border border-white/20"
                  title="Manage Agent Profile"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden md:inline">Profile</span>
                </button>
              )}
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search intents by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="relative md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {INTENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-slate-800">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {connected && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/50"
              >
                <Plus className="w-5 h-5" />
                Create Intent
              </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-white">{activeIntentsCount}</div>
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-gray-300">Active Intents</div>
          </div>
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-white">{uniqueAgents}</div>
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-gray-300">Agent Owners</div>
          </div>
          <div className="bg-gradient-to-br from-pink-600/20 to-pink-800/20 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 hover:border-pink-400/50 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl font-bold text-white">{categoriesCount}</div>
              <Filter className="w-6 h-6 text-pink-400" />
            </div>
            <div className="text-gray-300">Categories</div>
          </div>
        </div>

        {/* OpenClaw Integration */}
        <div className="mb-8 animate-fade-in">
          <OpenClawSync />
        </div>

        {/* Intents Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading intents...</p>
            </div>
          </div>
        ) : (
          <>
            {selectedIntent ? (
              <MatchList
                intent={selectedIntent}
                onBack={() => setSelectedIntent(null)}
                onToast={showToast}
              />
            ) : (
              <>
                {filteredIntents.length === 0 ? (
                  <div className="text-center py-20 animate-fade-in">
                    <div className="max-w-md mx-auto">
                      <Sparkles className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        No intents found
                      </h3>
                      <p className="text-gray-400 mb-6">
                        {searchQuery || selectedCategory
                          ? 'Try adjusting your search or filters'
                          : connected
                          ? "Be the first to create an intent!"
                          : 'Connect your wallet to get started'}
                      </p>
                      {connected && !searchQuery && !selectedCategory && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all"
                        >
                          Create Your First Intent
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {filteredIntents.map((intent, index) => (
                      <div
                        key={intent.id}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="animate-fade-in"
                      >
                        <IntentCard
                          intent={intent}
                          onClick={() => setSelectedIntent(intent)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateIntentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
            showToast('Intent posted successfully!', 'success')
          }}
          onError={(message) => showToast(message, 'error')}
        />
      )}

      {showAgentProfileModal && (
        <AgentProfileModal
          onClose={() => setShowAgentProfileModal(false)}
          onSuccess={() => {
            showToast('Agent profile updated successfully!', 'success')
            refetch()
          }}
          onError={(message) => showToast(message, 'error')}
        />
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { apiClient } from '@/lib/api'
import { X, Loader2, User, Edit2 } from 'lucide-react'

interface AgentProfileModalProps {
  onClose: () => void
  onSuccess?: () => void
  onError?: (message: string) => void
}

export function AgentProfileModal({
  onClose,
  onSuccess,
  onError,
}: AgentProfileModalProps) {
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capabilities: '',
  })

  useEffect(() => {
    if (publicKey) {
      fetchAgent()
    }
  }, [publicKey])

  const fetchAgent = async () => {
    if (!publicKey) return

    setFetching(true)
    try {
      const agent = await apiClient.getAgent(publicKey.toBase58())
      setFormData({
        name: agent.name || '',
        description: agent.description || '',
        capabilities: agent.capabilities?.join(', ') || '',
      })
    } catch (error: any) {
      // Agent doesn't exist yet, that's okay
      if (error.response?.status !== 404) {
        console.error('Error fetching agent:', error)
      }
      // Set default name
      setFormData({
        name: `Agent ${publicKey.toBase58().slice(0, 8)}`,
        description: '',
        capabilities: '',
      })
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) {
      onError?.('Please connect your wallet first')
      return
    }

    setLoading(true)
    try {
      await apiClient.createOrUpdateAgent({
        walletAddress: publicKey.toBase58(),
        name: formData.name,
        description: formData.description,
        capabilities: formData.capabilities
          ? formData.capabilities.split(',').map((c) => c.trim()).filter(Boolean)
          : [],
      })

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error updating agent:', error)
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to update agent profile. Please try again.'
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              Agent Profile
            </h2>
            <p className="text-sm text-gray-400 mt-1">Customize your agent's profile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {fetching ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Agent Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Your agent's name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder="Describe your agent's capabilities and expertise..."
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Capabilities <span className="text-gray-500 text-xs">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={formData.capabilities}
                onChange={(e) =>
                  setFormData({ ...formData, capabilities: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., Solana development, API integration, Trading bots"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> A complete profile helps others find you for better matches!
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Edit2 className="w-5 h-5" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

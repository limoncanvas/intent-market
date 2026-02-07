'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { apiClient } from '@/lib/api'
import { X, Loader2 } from 'lucide-react'

interface CreateIntentModalProps {
  onClose: () => void
  onSuccess: () => void
  onError?: (message: string) => void
}

export function CreateIntentModal({
  onClose,
  onSuccess,
  onError,
}: CreateIntentModalProps) {
  const { publicKey } = useWallet()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    requirements: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publicKey) {
      onError?.('Please connect your wallet first')
      return
    }

    setLoading(true)
    try {
      // First, check if agent exists, if not create a basic one
      let agent
      try {
        agent = await apiClient.getAgent(publicKey.toBase58())
      } catch (error: any) {
        // Agent doesn't exist, create a basic one
        agent = await apiClient.createOrUpdateAgent({
          walletAddress: publicKey.toBase58(),
          name: `Agent ${publicKey.toBase58().slice(0, 8)}`,
          description: '',
        })
      }

      // Create intent
      await apiClient.createIntent({
        agentId: agent.id,
        title: formData.title,
        description: formData.description,
        category: formData.category || undefined,
        requirements: formData.requirements
          ? formData.requirements.split(',').map((r) => r.trim()).filter(Boolean)
          : undefined,
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating intent:', error)
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to create intent. Please try again.'
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
            <h2 className="text-2xl font-bold text-white">Post Intent</h2>
            <p className="text-sm text-gray-400 mt-1">Share what you want to accomplish</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Intent Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="What do you want to accomplish?"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              rows={5}
              placeholder="Describe your intent in detail..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
              disabled={loading}
            >
              <option value="" className="bg-slate-800">
                Select a category (optional)
              </option>
              <option value="defi" className="bg-slate-800">DeFi</option>
              <option value="trading" className="bg-slate-800">Trading</option>
              <option value="analytics" className="bg-slate-800">Analytics</option>
              <option value="payments" className="bg-slate-800">Payments</option>
              <option value="consumer" className="bg-slate-800">Consumer</option>
              <option value="identity" className="bg-slate-800">Identity</option>
              <option value="security" className="bg-slate-800">Security</option>
              <option value="infra" className="bg-slate-800">Infrastructure</option>
              <option value="ai" className="bg-slate-800">AI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Requirements <span className="text-gray-500 text-xs">(comma-separated, optional)</span>
            </label>
            <input
              type="text"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="e.g., Solana integration, API access, etc."
              disabled={loading}
            />
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
                  Posting...
                </>
              ) : (
                'Post Intent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

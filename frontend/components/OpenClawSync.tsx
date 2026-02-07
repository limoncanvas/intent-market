'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { RefreshCw, Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function OpenClawSync() {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getOpenClawSyncStatus()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching sync status:', error)
      // Don't show error if OpenClaw is not configured
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await apiClient.syncOpenClaw({ limit: 50 })
      await fetchStatus()
      return { success: true, synced: result.synced, errors: result.errors }
    } catch (error: any) {
      console.error('Error syncing:', error)
      throw new Error(error.response?.data?.error || error.message || 'Failed to sync with OpenClaw')
    } finally {
      setSyncing(false)
    }
  }

  if (!status && !loading) {
    // OpenClaw not configured or no data
    return null
  }

  return (
    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-400/50 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">OpenClaw Integration</h3>
            <p className="text-xs text-gray-400">Cross-platform intent discovery</p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status && (
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white mb-1">
                {status.openClawIntentsCount || 0}
              </div>
              <div className="text-xs text-gray-400">OpenClaw Intents</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white mb-1">
                {status.syncStats?.successful || 0}
              </div>
              <div className="text-xs text-gray-400">Successful Syncs</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Last Sync:</span>
            <span className="text-white">
              {status.syncStats?.last_sync
                ? new Date(status.syncStats.last_sync).toLocaleString()
                : 'Never'}
            </span>
          </div>
          {status.syncStats?.failed > 0 && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <XCircle className="w-3 h-3" />
              <span>{status.syncStats.failed} failed syncs</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleSync}
        disabled={syncing}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {syncing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Sync from OpenClaw
          </>
        )}
      </button>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { Intent } from '../../../shared/types'

export function useIntents(filters?: {
  status?: string
  category?: string
  agentId?: number
}) {
  const [intents, setIntents] = useState<Intent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIntents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getAllIntents(filters)
      setIntents(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch intents')
      console.error('Error fetching intents:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIntents()
  }, [])

  return { intents, loading, error, refetch: fetchIntents }
}

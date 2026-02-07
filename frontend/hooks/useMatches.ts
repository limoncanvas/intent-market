'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { Match } from '../../../shared/types'

export function useMatches(intentId: number | null) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [finding, setFinding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    if (!intentId) {
      setMatches([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getMatchesForIntent(intentId)
      setMatches(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch matches')
      console.error('Error fetching matches:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [intentId])

  const findMatches = async (limit?: number) => {
    if (!intentId) return

    try {
      setFinding(true)
      const result = await apiClient.findMatches(intentId, limit)
      await fetchMatches()
      return result
    } catch (err: any) {
      setError(err.message || 'Failed to find matches')
      throw err
    } finally {
      setFinding(false)
    }
  }

  const updateMatchStatus = async (matchId: number, status: string) => {
    try {
      await apiClient.updateMatchStatus(matchId, status)
      await fetchMatches()
    } catch (err: any) {
      setError(err.message || 'Failed to update match status')
      throw err
    }
  }

  return {
    matches,
    loading,
    finding,
    error,
    findMatches,
    updateMatchStatus,
    refetch: fetchMatches,
  }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchStatus, getBackendOnline } from '@/lib/api-client'
import type { StatusResponse } from '@/types'

const POLL_INTERVAL = 3000
const MAX_POLL_RETRIES = 60

export function useStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [scrollState, setScrollState] = useState<'bottom' | 'user'>('bottom')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    if (!getBackendOnline()) return

    try {
      const data = await fetchStatus()
      setStatus(data)
      setRetryCount(0)
      setLoading(false)
    } catch {
      setRetryCount(prev => prev + 1)
    }
  }, [])

  // Stop polling after MAX_POLL_RETRIES consecutive failures
  useEffect(() => {
    if (retryCount >= MAX_POLL_RETRIES && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setLoading(false)
    }
  }, [retryCount])

  useEffect(() => {
    async function startPolling() {
      await poll()
      intervalRef.current = setInterval(poll, POLL_INTERVAL)
    }

    startPolling()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [poll])

  // Manual refresh
  const refresh = useCallback(() => {
    poll()
  }, [poll])

  return { status, loading, retryCount, scrollState, setScrollState, refresh }
}

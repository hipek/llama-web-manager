import { useState, useEffect, useCallback } from 'react'
import { fetchStatus, getBackendOnline } from '@/lib/api-client'
import type { StatusResponse } from '@/types'

const POLL_INTERVAL = 3000
const MAX_POLL_RETRIES = 60

export function useStatus() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [scrollState, setScrollState] = useState<'bottom' | 'user'>('bottom')

  const poll = useCallback(async () => {
    if (!getBackendOnline()) return

    try {
      const data = await fetchStatus()
      setStatus(data)
      setRetryCount(0)
    } catch {
      setRetryCount(prev => prev + 1)
    }
  }, [])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let timeout: ReturnType<typeof setTimeout> | null = null

    async function startPolling() {
      await poll()
      interval = setInterval(poll, POLL_INTERVAL)
    }

    startPolling()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [poll])

  // Manual refresh
  const refresh = useCallback(() => {
    poll()
  }, [poll])

  return { status, loading, retryCount, scrollState, setScrollState, refresh }
}

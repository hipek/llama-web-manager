import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchGpuStats } from '@/lib/api-client'
import type { GpuStats } from '@/types'

const POLL_INTERVAL = 5000

export function useGpuStats() {
  const [gpuStats, setGpuStats] = useState<GpuStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await fetchGpuStats()
      setGpuStats(data)
      setError(null)
    } catch {
      setError('Failed to fetch GPU stats')
    }
  }, [])

  useEffect(() => {
    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [poll])

  return { gpuStats, error }
}

import { useState, useEffect } from 'react'
import { fetchConfig } from '@/lib/api-client'
import type { ServerConfig } from '@/types'

export function useConfig() {
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchConfig()
        if (!cancelled) {
          setConfig(data)
          setError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load config')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { config, loading, error }
}

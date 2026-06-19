import { useState, useEffect } from 'react'
import { fetchModels } from '@/lib/api-client'
import type { ModelFile } from '@/types'

export function useModels() {
  const [models, setModels] = useState<ModelFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchModels()
        if (!cancelled) {
          setModels(data)
          setError(null)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load models')
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

  const refresh = () => {
    setLoading(true)
    fetchModels().then(data => {
      setModels(data)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }

  return { models, loading, error, refresh }
}

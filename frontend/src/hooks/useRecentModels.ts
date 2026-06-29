import { useState, useCallback } from 'react'
import { getRecentModels, saveRecentModel } from '@/lib/utils'
import type { RecentModel } from '@/types'

export function useRecentModels() {
  const [models, setModels] = useState<RecentModel[]>(getRecentModels)

  const addModel = useCallback((path: string, name: string, size?: number) => {
    saveRecentModel(path, name, size)
    setModels(getRecentModels())
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem('llama-web-manager-recent')
    setModels([])
  }, [])

  return { models, addModel, clear }
}

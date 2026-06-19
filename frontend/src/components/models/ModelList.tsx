'use client'

import type { ModelFile } from '@/types'
import { ModelCard } from './ModelCard'

interface Props {
  models: ModelFile[]
  running: boolean
  onAction: (path: string, name: string) => void
}

export function ModelList({ models, running, onAction }: Props) {
  if (models.length === 0) {
    return <div className="text-dark-500 p-4">No .gguf models found</div>
  }

  return (
    <div className="grid gap-3">
      {models.map(m => (
        <ModelCard key={m.path} model={m} running={running} onAction={onAction} />
      ))}
    </div>
  )
}

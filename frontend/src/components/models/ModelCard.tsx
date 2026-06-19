'use client'

import type { ModelFile } from '@/types'
import { formatSize } from '@/lib/utils'

interface Props {
  model: ModelFile
  running: boolean
  onAction: (path: string, name: string) => void
}

export function ModelCard({ model, running, onAction }: Props) {
  return (
    <div className="model-card flex-col sm:flex-row gap-3 sm:gap-0">
      <div className="model-info flex flex-col gap-1">
        <div className="font-semibold text-sm text-dark-50">{model.name}</div>
        <div className="text-xs text-dark-500 font-mono">{model.path}</div>
        <div className="text-xs text-dark-400">{formatSize(model.size)}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAction(model.path, model.name)}
          className="btn btn-primary btn-sm"
        >
          {running ? 'Switch Model' : 'Load Model'}
        </button>
      </div>
    </div>
  )
}

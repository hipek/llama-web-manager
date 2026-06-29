'use client'

import { useRecentModels } from '@/hooks/useRecentModels'
import { formatSize, modelName } from '@/lib/utils'

interface Props {
  onAction: (path: string, name: string, size?: number) => void
}

export function RecentModels({ onAction }: Props) {
  const { models } = useRecentModels()

  if (models.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-base font-semibold mb-3 text-dark-100 flex items-center gap-2">
        🔁 Recent Models
      </h2>
      <div className="grid gap-3">
        {models.map((m, i) => (
          <div key={m.path} className="model-card flex-col sm:flex-row gap-3 sm:gap-0">
            <div className="model-info flex flex-col gap-1">
              <div className="font-semibold text-sm text-dark-50">{m.name}</div>
              <div className="text-xs text-dark-500 font-mono">{m.path}</div>
              {m.size && <div className="text-xs text-dark-400">{formatSize(m.size)}</div>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAction(m.path, m.name, m.size)}
                className="btn btn-primary btn-sm"
              >
                {i === 0 ? 'Load again' : 'Load'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

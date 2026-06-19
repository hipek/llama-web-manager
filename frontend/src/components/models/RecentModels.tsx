'use client'

import { useRecentModels } from '@/hooks/useRecentModels'
import { modelName } from '@/lib/utils'

interface Props {
  onAction: (path: string, name: string) => void
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
          <div key={m.path} className="model-card">
            <div className="model-info flex flex-col gap-1">
              <div className="font-semibold text-sm text-dark-50">{modelName(m.path)}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onAction(m.path, m.name)}
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

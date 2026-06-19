'use client'

import { useState, useEffect } from 'react'
import type { LlammaCppParams } from '@/types'
import { ParamControl, PARAM_DEFS } from './ParamControl'

interface Props {
  params: LlammaCppParams
  onSave: (params: LlammaCppParams) => void
  onRestart: () => void
}

export function SettingsForm({ params, onSave, onRestart }: Props) {
  const [localParams, setLocalParams] = useState<LlammaCppParams>(params)

  useEffect(() => {
    setLocalParams(params)
  }, [params])

  const handleChange = (key: string, value: number | boolean) => {
    setLocalParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {PARAM_DEFS.map(def => (
          <ParamControl
            key={def.key}
            param={def}
            value={(localParams as any)[def.key]}
            onChange={handleChange}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSave(localParams)}
          className="btn btn-primary"
        >
          Save
        </button>
        <button
          onClick={onRestart}
          className="btn btn-danger"
        >
          Restart Server
        </button>
      </div>
    </div>
  )
}

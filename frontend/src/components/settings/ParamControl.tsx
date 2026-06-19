'use client'

interface ParamDef {
  key: string
  label: string
  min: number
  max: number
  step: number
}

interface Props {
  param: ParamDef
  value: number | boolean
  onChange: (key: string, value: number | boolean) => void
}

const PARAM_DEFS: ParamDef[] = [
  { key: 'context_size', label: 'Context Size', min: 1024, max: 262144, step: 1024 },
  { key: 'threads', label: 'Threads', min: 1, max: 128, step: 1 },
  { key: 'temp', label: 'Temperature', min: 0, max: 2, step: 0.05 },
  { key: 'top_p', label: 'Top P', min: 0, max: 1, step: 0.05 },
  { key: 'top_k', label: 'Top K', min: 1, max: 100, step: 1 },
  { key: 'min_p', label: 'Min P', min: 0, max: 1, step: 0.01 },
  { key: 'no_mmap', label: 'No MMAP', min: 0, max: 1, step: 1 },
]

export function ParamControl({ param, value, onChange }: Props) {
  const isBool = typeof value === 'boolean'

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 sm:p-4">
      <label className="flex items-center justify-between gap-4">
        <span className="text-xs text-dark-400">{param.label}</span>
        <div className="flex items-center gap-3">
          {isBool ? (
            <input
              type="checkbox"
              checked={value as boolean}
              onChange={e => onChange(param.key, e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
          ) : (
            <input
              type="range"
              value={value as number}
              min={param.min}
              max={param.max}
              step={param.step}
              onChange={e => onChange(param.key, parseFloat(e.target.value))}
              className="w-28 accent-primary"
            />
          )}
          <span className="text-xs text-accent-blue font-mono min-w-[3rem] text-right">
            {isBool ? (value as boolean ? 'ON' : 'OFF') : value}
          </span>
        </div>
      </label>
    </div>
  )
}

export { PARAM_DEFS }

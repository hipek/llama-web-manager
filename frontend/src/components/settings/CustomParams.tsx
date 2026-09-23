'use client'

interface Props {
  value: Record<string, string>
  onChange: (params: Record<string, string>) => void
}

export function CustomParams({ value, onChange }: Props) {
  const handleChange = (key: string, val: string) => {
    const next = { ...value }
    if (val) {
      next[key] = val
    } else {
      delete next[key]
    }
    onChange(next)
  }

  const handleRemove = (key: string) => {
    const next = { ...value }
    delete next[key]
    onChange(next)
  }

  const handleAdd = () => {
    onChange({ ...value, '': '' })
  }

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-400">Custom Params</span>
        <button
          onClick={handleAdd}
          className="text-xs text-accent-blue hover:text-accent-blue/80"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <input
              type="text"
              placeholder="flag"
              value={key}
              onChange={e => handleChange(e.target.value, val)}
              className="flex-1 rounded-md border border-dark-700 bg-dark-900 px-2 py-1 text-xs text-dark-100"
            />
            <input
              type="text"
              placeholder="value"
              value={val}
              onChange={e => handleChange(key, e.target.value)}
              className="flex-1 rounded-md border border-dark-700 bg-dark-900 px-2 py-1 text-xs text-dark-100"
            />
            <button
              onClick={() => handleRemove(key)}
              className="text-xs text-red-400 hover:text-red-500 px-2"
            >
              ×
            </button>
          </div>
        ))}
        {Object.keys(value).length === 0 && (
          <p className="text-xs text-dark-500 italic">No custom params</p>
        )}
      </div>
    </div>
  )
}

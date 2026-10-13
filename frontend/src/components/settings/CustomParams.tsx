'use client'

import { useState } from 'react'

interface Props {
  value: Record<string, string | null>
  onChange: (params: Record<string, string | null>) => void
}

interface Row {
  id: number
  key: string
  value: string
  noValue: boolean
}

let nextRowId = 0

function rowsFromParams(params: Record<string, string | null>): Row[] {
  return Object.entries(params).map(([key, value]) => ({
    id: nextRowId++,
    key,
    value: value ?? '',
    noValue: value === null,
  }))
}

export function CustomParams({ value, onChange }: Props) {
  const [rows, setRows] = useState(() => rowsFromParams(value))

  const updateRows = (nextRows: Row[]) => {
    setRows(nextRows)
    const params: Record<string, string | null> = {}
    for (const row of nextRows) {
      const key = row.key.trim().replace(/^-+/, '')
      if (!key || (!row.noValue && !row.value.trim())) continue
      params[key] = row.noValue ? null : row.value
    }
    onChange(params)
  }

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-dark-400">Custom Params</span>
        <button
          onClick={() => setRows(current => [...current, { id: nextRowId++, key: '', value: '', noValue: false }])}
          className="text-xs text-accent-blue hover:text-accent-blue/80"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.id} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="flag"
              value={row.key}
              onChange={e => updateRows(rows.map(item => item.id === row.id ? { ...item, key: e.target.value } : item))}
              className="flex-1 rounded-md border border-dark-700 bg-dark-900 px-2 py-1 text-xs text-dark-100"
            />
            <input
              type="text"
              placeholder="value"
              value={row.value}
              disabled={row.noValue}
              onChange={e => updateRows(rows.map(item => item.id === row.id ? { ...item, value: e.target.value } : item))}
              className="flex-1 rounded-md border border-dark-700 bg-dark-900 px-2 py-1 text-xs text-dark-100 disabled:opacity-50"
            />
            <label className="flex items-center gap-1 text-xs text-dark-400">
              <input
                type="checkbox"
                checked={row.noValue}
                onChange={e => updateRows(rows.map(item => item.id === row.id ? { ...item, noValue: e.target.checked } : item))}
              />
              Flag only
            </label>
            <button
              onClick={() => updateRows(rows.filter(item => item.id !== row.id))}
              className="text-xs text-red-400 hover:text-red-500 px-2"
            >
              ×
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-dark-500 italic">No custom params</p>
        )}
      </div>
    </div>
  )
}

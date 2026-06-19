'use client'

import { useBackendHealth } from '@/hooks/useBackendHealth'

export function OfflineBanner() {
  const { online, check } = useBackendHealth()

  if (online) return null

  return (
    <div className="bg-red-900 border-b border-red-700 px-6 py-3 text-center">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-xl">⚠️</span>
        <span className="text-red-200 text-sm">
          Backend server is offline. Check that the server is running and your connection is stable.
        </span>
        <button
          onClick={check}
          className="bg-red-800 text-red-200 border border-red-700 rounded-md px-3 py-1.5 text-xs cursor-pointer transition-all hover:bg-red-700"
        >
          ↻ Retry
        </button>
      </div>
    </div>
  )
}

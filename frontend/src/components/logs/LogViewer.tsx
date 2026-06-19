'use client'

import { useRef, useEffect, useCallback } from 'react'

interface Props {
  lines: string[]
  scrollState: 'bottom' | 'user'
  setScrollState: (state: 'bottom' | 'user') => void
  onRefresh: () => void
}

export function LogViewer({ lines, scrollState, setScrollState, onRefresh }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // auto-scroll to bottom when scrollState is 'bottom'
  useEffect(() => {
    if (scrollState === 'bottom' && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines, scrollState])

  // detect manual scroll
  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setScrollState(isAtBottom ? 'bottom' : 'user')
  }, [setScrollState])

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <h3 className="text-sm font-semibold text-dark-100 flex items-center gap-2">
          📋 Server Logs
        </h3>
        <button
          onClick={onRefresh}
          className="btn btn-sm bg-dark-700 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-dark-300 transition-all hover:border-accent-blue hover:text-accent-blue"
        >
          Refresh
        </button>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto max-h-[300px] p-4 font-mono text-xs leading-relaxed text-dark-400"
      >
        {lines.length === 0 ? (
          <p className="text-dark-500 italic">No log output yet.</p>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all hover:text-dark-300 transition-colors">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

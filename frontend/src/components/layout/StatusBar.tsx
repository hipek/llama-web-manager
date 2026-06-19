'use client'

import type { StatusResponse } from '@/types'
import { formatSize, modelName } from '@/lib/utils'

interface Props {
  status: StatusResponse
  serverPort: number
  serverHost: string
  onStop: () => void
}

export function StatusBar({ status, serverPort, serverHost, onStop }: Props) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 sm:p-6 mb-8 flex items-center gap-3 flex-wrap">
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status.running ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-dark-500'}`} />
      <div className="text-sm text-dark-300">
        {status.running ? (
          <span>
            <strong className="text-dark-50">Running:</strong> {modelName(status.model)}
          </span>
        ) : (
          <span>
            <strong className="text-dark-50">Stopped</strong> — select a model to load
          </span>
        )}
      </div>
      <div className="ml-auto flex gap-2">
        {status.running && (
          <>
            <button
              onClick={onStop}
              className="btn btn-danger btn-sm"
            >
              Stop Server
            </button>
            <a
              href={`http://${serverHost}:${serverPort}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-xs text-accent-blue no-underline transition-all hover:border-accent-blue hover:bg-dark-800/50"
            >
              Open llama-server →
            </a>
          </>
        )}
      </div>
    </div>
  )
}

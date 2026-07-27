'use client'

import type { StatusResponse, GpuStats } from '@/types'
import { formatSize, modelName } from '@/lib/utils'

interface Props {
  status: StatusResponse
  serverPort: number
  serverHost: string
  gpuStats: GpuStats[] | null
  onStop: () => void
}

export function StatusBar({ status, serverPort, serverHost, gpuStats, onStop }: Props) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 sm:p-6 mb-8 flex flex-col gap-3">
      <div className="flex items-center gap-3">
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

      {status.running && gpuStats && gpuStats.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-dark-300">
          {gpuStats.map((gpu, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-dark-100">GPU {idx}</span>
                <span className="text-dark-400">
                  {formatSize(gpu.vram_used)} / {formatSize(gpu.vram_total)}
                </span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-1.5">
                <div
                  className="bg-accent-blue h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${gpu.vram_used_pct ?? 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

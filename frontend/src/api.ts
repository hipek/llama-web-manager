import type { ServerConfig, StatusResponse, ModelFile, LlammaCppParams } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

let _backendOnline = true

export function getBackendOnline(): boolean {
  return _backendOnline
}

export async function checkBackend(): Promise<boolean> {
  try {
    const res = await fetch(API_BASE + '/status')
    const wasOffline = !_backendOnline
    _backendOnline = res.ok
    if (_backendOnline && wasOffline) {
      import('./ui').then(m => m.hideOfflineBanner())
    }
    return _backendOnline
  } catch {
    _backendOnline = false
    import('./ui').then(m => m.showOfflineBanner())
    return false
  }
}

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(API_BASE + path, init)
}

export async function fetchConfig(): Promise<ServerConfig> {
  const res = await api('/api/config')
  if (!res.ok) throw new Error('Failed to load config')
  const data = await res.json()
  data.llamacpp_params = data.llamacpp_params ?? {
    context_size: 80000,
    threads: 8,
    temp: 0.2,
    top_p: 0.9,
    top_k: 10,
    min_p: 0.05,
    no_mmap: false,
  }
  return data
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await api('/status')
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export async function fetchModels(): Promise<ModelFile[]> {
  const res = await api('/models')
  if (!res.ok) throw new Error('Failed to fetch models')
  return res.json()
}

export async function loadModel(path: string): Promise<void> {
  const res = await api('/load', {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': '' },
    body: new URLSearchParams({ model_path: path }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

export async function stopServer(): Promise<void> {
  const res = await api('/stop', { method: 'POST' })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

export async function saveConfig(params: LlammaCppParams): Promise<void> {
  const res = await api('/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ llamacpp_params: params }),
  })
  if (!res.ok) throw new Error('Failed to save config')
}

export async function restartServer(): Promise<void> {
  const res = await api('/restart', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to restart server')
}

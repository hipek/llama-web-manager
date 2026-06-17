import type { ServerConfig, StatusResponse, ModelFile } from './types'

export async function fetchConfig(): Promise<ServerConfig> {
  const res = await fetch('/api/config')
  if (!res.ok) throw new Error('Failed to load config')
  return res.json()
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/status')
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export async function fetchModels(): Promise<ModelFile[]> {
  const res = await fetch('/models')
  if (!res.ok) throw new Error('Failed to fetch models')
  return res.json()
}

export async function loadModel(path: string): Promise<void> {
  const res = await fetch('/load', {
    method: 'POST',
    headers: { 'X-CSRF-TOKEN': '' },
    body: new URLSearchParams({ model_path: path }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

export async function stopServer(): Promise<void> {
  const res = await fetch('/stop', { method: 'POST' })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

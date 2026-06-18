import type { ServerConfig, StatusResponse, ModelFile } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function api(path: string, init?: RequestInit): Promise<Response> {
  return fetch(API_BASE + path, init)
}

export async function fetchConfig(): Promise<ServerConfig> {
  const res = await api('/api/config')
  if (!res.ok) throw new Error('Failed to load config')
  return res.json()
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

import type { RecentModel } from '@/types'

export function formatSize(bytes: number): string {
  const mb = Math.floor(bytes / 1024 / 1024)
  return `${mb} MB`
}

export function modelName(path: string | null): string {
  if (!path) return ''
  return path.split('/').pop() || path
}

export function getRecentModels(): RecentModel[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem('llama-web-manager-recent')
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRecentModel(path: string, name: string): void {
  if (typeof window === 'undefined') return
  const list = getRecentModels()
  const filtered = list.filter((m: RecentModel) => m.path !== path)
  filtered.unshift({ path, name, time: Date.now() })
  const trimmed = filtered.slice(0, 3)
  localStorage.setItem('llama-web-manager-recent', JSON.stringify(trimmed))
}

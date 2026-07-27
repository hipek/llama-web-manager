export interface LlammaCppParams {
  context_size: number
  threads: number
  temp: number
  top_p: number
  top_k: number
  min_p: number
  no_mmap: boolean
  embeddings: boolean
  jinja: boolean
  n_cpu_moe: number
}

export interface ServerConfig {
  server_port: number
  server_host: string
  models_dir: string
  llamacpp_params: LlammaCppParams
}

export interface StatusResponse {
  running: boolean
  model: string | null
  ready: boolean
  log_lines: string[]
}

export interface ModelFile {
  name: string
  path: string
  size: number
}

export interface GpuStats {
  vram_total: number
  vram_used: number
  vram_used_pct: number | null
  gpu_busy_pct: number | null
  mem_busy_pct: number | null
}

export interface RecentModel {
  path: string
  name: string
  size?: number
  time: number
}

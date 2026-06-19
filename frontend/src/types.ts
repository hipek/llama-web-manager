export interface LlammaCppParams {
  context_size: number
  threads: number
  temp: number
  top_p: number
  top_k: number
  min_p: number
  no_mmap: boolean
}

export interface ServerConfig {
  server_port: number
  server_host: string
  models_dir: string
  llamacpp_params?: LlammaCppParams
}

export interface StatusResponse {
  running: boolean
  model: string | null
  log_lines: string[]
}

export interface ModelFile {
  name: string
  path: string
  size: number
}

export interface RecentModel {
  path: string
  name: string
  time: number
}

export interface ServerConfig {
  server_port: number
  server_host: string
  models_dir: string
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

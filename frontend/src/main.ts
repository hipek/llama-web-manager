import { fetchConfig, fetchStatus, fetchModels, loadModel, stopServer, checkBackend, getBackendOnline } from './api'
import { showToast, showLoading, hideLoading, modelName } from './ui'
import type { ServerConfig, ModelFile, RecentModel } from './types'

const RECENT_KEY = 'llama-web-manager-recent'
let CONFIG: ServerConfig
let logScrollState: 'bottom' | 'user' = 'bottom'

function getRecent(): RecentModel[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecent(path: string, name: string) {
  const list = getRecent()
  const filtered = list.filter(m => m.path !== path)
  filtered.unshift({ path, name, time: Date.now() })
  const trimmed = filtered.slice(0, 3)
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed))
  renderRecent()
}

function renderRecent() {
  const list = getRecent()
  const container = document.getElementById('recent-list')!
  const section = document.getElementById('recent-section')!
  if (list.length === 0) {
    section.style.display = 'none'
    container.innerHTML = ''
    return
  }
  section.style.display = ''
  container.innerHTML = list.map((m, i) => `
    <div class="model-card">
      <div class="model-info">
        <div class="model-name">${m.name}</div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" data-action="load-model" data-path="${m.path}" data-name="${m.name}">
          ${i === 0 ? 'Load again' : 'Load'}
        </button>
      </div>
    </div>
  `).join('')
}

function renderStatusBar(running: boolean, model: string | null) {
  const bar = document.getElementById('status-bar')!
  bar.innerHTML = `
    <div class="status-dot ${running ? 'running' : 'stopped'}"></div>
    <div class="status-text">
      ${running
        ? `<strong>Running:</strong> ${modelName(model)}`
        : '<strong>Stopped</strong> — select a model to load'}
    </div>
    <div class="btn-group" style="margin-left:auto">
      ${running ? `
        <button class="btn btn-danger btn-sm" data-action="stop-server">Stop Server</button>
        <a class="api-link" href="http://${CONFIG.server_host}:${CONFIG.server_port}" target="_blank">Open llama-server →</a>
      ` : ''}
    </div>
  `
}

function renderModelList(models: ModelFile[], running: boolean) {
  const list = document.getElementById('model-list')!
  if (models.length === 0) {
    list.innerHTML = `<div style="color:#64748b;padding:1rem">No .gguf models found in ${CONFIG.models_dir}</div>`
    return
  }
  list.innerHTML = models.map(m => `
    <div class="model-card">
      <div class="model-info">
        <div class="model-name">${m.name}</div>
        <div class="model-path">${m.path}</div>
        <div class="model-size">${Math.floor(m.size / 1024 / 1024)} MB</div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary btn-sm" data-action="load-model" data-path="${m.path}" data-name="${m.name}">
          ${running ? 'Switch Model' : 'Load Model'}
        </button>
      </div>
    </div>
  `).join('')
}

function renderLogs(lines: string[]) {
  const logOutput = document.getElementById('logOutput')!
  if (lines.length === 0) {
    logOutput.innerHTML = '<span class="empty">No log output yet. Load a model to see logs here.</span>'
    return
  }
  logOutput.textContent = lines.join('\n')
  if (logScrollState === 'bottom') {
    logOutput.scrollTop = logOutput.scrollHeight
  }
}

async function handleLoadModel(path: string, name: string) {
  showLoading('Loading ' + name + '...')
  try {
    await loadModel(path)
    saveRecent(path, name)
    showToast('Loading ' + name + '...')
    pollStatus()
  } catch (e: unknown) {
    hideLoading()
    showToast(e instanceof Error ? e.message : 'Failed to load model', 'error')
  }
}

async function pollStatus() {
  try {
    const status = await fetchStatus()
    if (status.running) {
      showLoading('Model ' + modelName(status.model) + ' loading...')
      try {
        const health = await fetch(`http://${window.location.hostname}:${CONFIG.server_port}/health`)
        if (health.ok) {
          hideLoading()
          showToast('Model loaded')
          location.reload()
          return
        }
      } catch { /* server not ready yet */ }
      setTimeout(pollStatus, 3000)
    } else {
      hideLoading()
      showToast('Model stopped')
      location.reload()
    }
  } catch (e: unknown) {
    hideLoading()
    if (!getBackendOnline()) return // banner already shown
    showToast(e instanceof Error ? e.message : 'Status check failed', 'error')
  }
}

async function init() {
  try {
    CONFIG = await fetchConfig()
  } catch {
    showToast('Failed to load config', 'error')
    return
  }

  const [status, models] = await Promise.all([
    fetchStatus(),
    fetchModels(),
  ])

  renderStatusBar(status.running, status.model)
  renderModelList(models, status.running)
  renderRecent()
  renderLogs(status.log_lines)

  document.getElementById('model-list')!.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('[data-action="load-model"]') as HTMLElement | null
    if (btn) {
      handleLoadModel(btn.getAttribute('data-path')!, btn.getAttribute('data-name')!)
    }
  })

  document.getElementById('recent-list')!.addEventListener('click', e => {
    const btn = (e.target as HTMLElement).closest('[data-action="load-model"]') as HTMLElement | null
    if (btn) {
      handleLoadModel(btn.getAttribute('data-path')!, btn.getAttribute('data-name')!)
    }
  })

  document.getElementById('status-bar')!.addEventListener('click', async e => {
    const btn = (e.target as HTMLElement).closest('[data-action="stop-server"]')
    if (btn) {
      try {
        await stopServer()
        showToast('Server stopped')
        location.reload()
      } catch (e: unknown) {
        showToast(e instanceof Error ? e.message : 'Failed to stop server', 'error')
      }
    }
  })

  document.getElementById('refresh-log-btn')!.addEventListener('click', async () => {
    if (!getBackendOnline()) {
      showToast('Backend is offline', 'error')
      return
    }
    try {
      const status = await fetchStatus()
      renderLogs(status.log_lines)
    } catch {
      showToast('Failed to refresh logs', 'error')
    }
  })

  const logOutput = document.getElementById('logOutput')!
  logOutput.addEventListener('scroll', () => {
    const threshold = 50
    logScrollState =
      (logOutput.scrollHeight - logOutput.scrollTop - logOutput.clientHeight) > threshold
        ? 'user'
        : 'bottom'
  })

  // Periodic log refresh
  setInterval(async () => {
    if (!getBackendOnline()) return
    try {
      const status = await fetchStatus()
      renderLogs(status.log_lines)
    } catch { /* silent */ }
  }, 5000)

  // Health check: every 15s
  setInterval(checkBackend, 15000)

  // Retry button
  document.getElementById('offline-retry')!.addEventListener('click', checkBackend)
}

document.addEventListener('DOMContentLoaded', init)

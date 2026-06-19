import { fetchConfig, fetchStatus, fetchModels, loadModel, stopServer, checkBackend, getBackendOnline, saveConfig, restartServer } from './api'
import { showToast, showLoading, hideLoading, modelName, showConfirm } from './ui'
import type { ServerConfig, ModelFile, RecentModel, LlammaCppParams } from './types'

const RECENT_KEY = 'llama-web-manager-recent'
let CONFIG: ServerConfig
let logScrollState: 'bottom' | 'user' = 'bottom'
let _pollRetry = 0
const MAX_POLL_RETRIES = 60 // 3 minutes max (60 × 3s)

const PARAMS = [
  { key: 'context_size', label: 'Context Size', min: 1024, max: 262144, step: 1024, unit: '' },
  { key: 'threads', label: 'Threads', min: 1, max: 128, step: 1, unit: '' },
  { key: 'temp', label: 'Temperature', min: 0, max: 2, step: 0.05, unit: '' },
  { key: 'top_p', label: 'Top P', min: 0, max: 1, step: 0.05, unit: '' },
  { key: 'top_k', label: 'Top K', min: 1, max: 100, step: 1, unit: '' },
  { key: 'min_p', label: 'Min P', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'no_mmap', label: 'No MMAP', min: 0, max: 1, step: 1, unit: '' },
]

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

function renderSettings(params: LlammaCppParams) {
  const form = document.getElementById('settings-form')!
  form.innerHTML = PARAMS.map(p => {
    const val = (params as any)[p.key]
    const isBool = typeof val === 'boolean'
    return `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:0.75rem 1rem">
        <label style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
          <span style="font-size:0.85rem;color:#94a3b8">${p.label}</span>
          <input type="${isBool ? 'checkbox' : 'range'}"
            class="param-input" data-key="${p.key}"
            ${isBool ? (val ? 'checked' : '') : `value="${val}" min="${p.min}" max="${p.max}" step="${p.step}"`}
            ${isBool ? '' : `style="width:120px"`} />
          <span class="param-value" data-key="${p.key}" style="font-family:monospace;font-size:0.85rem;color:#38bdf8;min-width:60px;text-align:right">
            ${isBool ? (val ? 'ON' : 'OFF') : val}
          </span>
        </label>
      </div>
    `
  }).join('')

  form.querySelectorAll('.param-input').forEach(input => {
    input.addEventListener('input', () => {
      const key = (input as HTMLInputElement).dataset.key!
      const display = form.querySelector(`.param-value[data-key="${key}"]`) as HTMLElement
      if ((input as HTMLInputElement).type === 'checkbox') {
        display.textContent = (input as HTMLInputElement).checked ? 'ON' : 'OFF'
      } else {
        display.textContent = (input as HTMLInputElement).value
      }
    })
  })
}

async function handleLoadModel(path: string, name: string) {
  showLoading('Loading ' + name + '...')
  try {
    await loadModel(path)
    saveRecent(path, name)
    showToast('Loading ' + name + '...')
    await new Promise(resolve => setTimeout(resolve, 2000))
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
      if (status.model) {
        showLoading('Model ' + modelName(status.model) + ' loading...')

        // Backend checks log for "all slots are idle" = model fully loaded
        if (status.ready) {
          hideLoading()
          showToast('Model loaded')
          location.reload()
          return
        }

        _pollRetry++
        if (_pollRetry >= MAX_POLL_RETRIES) {
          hideLoading()
          showToast('Model loading timed out', 'error')
          return
        }
        setTimeout(pollStatus, 3000)
      } else {
        // restarted without model
        hideLoading()
        showToast('Server restarted')
        location.reload()
        return
      }
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
  renderSettings(CONFIG.llamacpp_params)

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

  // Save settings button
  document.getElementById('save-settings-btn')!.addEventListener('click', async () => {
    const form = document.getElementById('settings-form')!
    const params: LlammaCppParams = { ...CONFIG.llamacpp_params! }
    form.querySelectorAll('.param-input').forEach(input => {
      const key = (input as HTMLInputElement).dataset.key!
      if ((input as HTMLInputElement).type === 'checkbox') {
        (params as any)[key] = (input as HTMLInputElement).checked
      } else {
        const step = parseFloat((input as HTMLInputElement).step) || 1
        ;(params as any)[key] = step % 1 === 0
          ? parseInt((input as HTMLInputElement).value)
          : parseFloat((input as HTMLInputElement).value)
      }
    })
    try {
      await saveConfig(params)
      showToast('Settings saved')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to save settings', 'error')
    }
  })

  // Restart settings button
  document.getElementById('restart-settings-btn')!.addEventListener('click', async () => {
    try {
      await restartServer()
      showToast('Server restarting...')
      pollStatus()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to restart', 'error')
    }
  })
}

document.addEventListener('DOMContentLoaded', init)

# Plan: Edit llamacpp_params via UI

## Current State

- **Backend**: FastAPI, endpoints `/load`, `/stop`, `/status`, `/models`, `/api/config`
- **Config**: `ServerConfig` dataclass — llamacpp_params flattened into top-level fields (`context_size`, `threads`, `temp`, `top_p`, `top_k`, `min_p`, `no_mmap`)
- **Frontend**: Single HTML with inline CSS, vanilla TS modules (`api.ts`, `types.ts`, `ui.ts`, `main.ts`)
- **Config is loaded at startup only** — no write-back mechanism exists
- **ServerManager** builds command-line from config fields at `start()` time

---

## Phase 1: UI Changes (no backend yet)

### Goal
Add a "Settings" section to the page that displays and edits all llamacpp_params.
Save button writes to a local JSON stub (or shows a toast with the payload).
Restart button shows a confirmation dialog.
Backend integration comes in Phase 2.

### 1.1 Update `types.ts`

Add `LlammaCppParams` interface:

```ts
export interface LlammaCppParams {
  context_size: number
  threads: number
  temp: number
  top_p: number
  top_k: number
  min_p: number
  no_mmap: boolean
}
```

Add to existing `ServerConfig`:

```ts
export interface ServerConfig {
  server_port: number
  server_host: string
  models_dir: string
  llamacpp_params?: LlammaCppParams  // optional until Phase 2
}
```

### 1.2 Update `api.ts`

Add a stub `saveConfig` function (will be wired in Phase 2):

```ts
export async function saveConfig(params: LlammaCppParams): Promise<void> {
  // STUB: Phase 1 — just log, will be replaced in Phase 2
  console.log('[Phase 1 stub] Config save:', params)
  throw new Error('Config write not yet implemented — Phase 2')
}
```

Add a stub `restartServer` function:

```ts
export async function restartServer(): Promise<void> {
  console.log('[Phase 1 stub] Restart requested')
  throw new Error('Restart not yet implemented — Phase 2')
}
```

### 1.3 Update `ui.ts`

Add a `showConfirm` function for restart confirmation:

```ts
export function showConfirm(message: string, onConfirm: () => void): void {
  const overlay = document.getElementById('overlay')!
  const text = document.getElementById('overlay-text')!
  overlay.classList.add('active')
  text.innerHTML = `
    <div style="margin-bottom:1.5rem">${message}</div>
    <div style="display:flex;gap:0.75rem;justify-content:center">
      <button class="btn btn-danger" id="confirm-yes">Yes, Restart</button>
      <button class="btn btn-primary" id="confirm-no">Cancel</button>
    </div>
  `
  document.getElementById('confirm-yes')!.onclick = () => {
    overlay.classList.remove('active')
    onConfirm()
  }
  document.getElementById('confirm-no')!.onclick = () => {
    overlay.classList.remove('active')
  }
}
```

### 1.4 Update `index.html`

Add a Settings section after the "Available Models" section:

```html
<div class="section" id="settings-section">
  <h2>⚙️ llama.cpp Parameters</h2>
  <div id="settings-form" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem">
    <!-- Rendered by main.ts -->
  </div>
  <div style="margin-top:1rem;display:flex;gap:0.75rem">
    <button class="btn btn-primary" id="save-settings-btn">Save</button>
    <button class="btn btn-danger" id="restart-settings-btn">Restart Server</button>
  </div>
  <div id="settings-status" style="margin-top:0.5rem;font-size:0.85rem;color:#94a3b8"></div>
</div>
```

### 1.5 Update `main.ts`

Add settings rendering and event handlers:

```ts
// Param definitions for rendering
const PARAMS = [
  { key: 'context_size', label: 'Context Size', min: 1024, max: 262144, step: 1024, unit: '' },
  { key: 'threads', label: 'Threads', min: 1, max: 128, step: 1, unit: '' },
  { key: 'temp', label: 'Temperature', min: 0, max: 2, step: 0.05, unit: '' },
  { key: 'top_p', label: 'Top P', min: 0, max: 1, step: 0.05, unit: '' },
  { key: 'top_k', label: 'Top K', min: 1, max: 100, step: 1, unit: '' },
  { key: 'min_p', label: 'Min P', min: 0, max: 1, step: 0.01, unit: '' },
  { key: 'no_mmap', label: 'No MMAP', min: 0, max: 1, step: 1, unit: '' },
]

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

  // Live-update value display on slider change
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

// Wire up save button
document.getElementById('save-settings-btn')!.addEventListener('click', async () => {
  const form = document.getElementById('settings-form')!
  const params: LlammaCppParams = { ...CONFIG.llamacpp_params! }
  form.querySelectorAll('.param-input').forEach(input => {
    const key = (input as HTMLInputElement).dataset.key!
    const display = form.querySelector(`.param-value[data-key="${key}"]`) as HTMLElement
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

// Wire up restart button
document.getElementById('restart-settings-btn')!.addEventListener('click', () => {
  showConfirm('Restart server with new parameters? Current model will be unloaded.', async () => {
    try {
      await restartServer()
      showToast('Restarting server...')
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to restart', 'error')
    }
  })
})
```

### Phase 1 Deliverables
- Settings section visible in UI with all 7 llamacpp_params
- Live slider/toggle updates
- Save button (throws Phase 2 error — stub)
- Restart button (shows confirmation dialog — stub)
- No backend changes required

---

## Phase 2: Backend Endpoints + Config Write-Back

### Goal
Wire the UI save/restart buttons to real backend endpoints.
Config changes persist to `config.yaml` and apply on next server start.

### 2.1 New Backend Endpoints

In `backend/app/main.py`, add:

```python
@router.post("/config")
async def update_config(request: Request):
    """Write llamacpp_params to config.yaml."""
    body = await request.json()
    params = body.get("llamacpp_params", {})
    
    # Validate fields
    valid_keys = {"context_size", "threads", "temp", "top_p", "top_k", "min_p", "no_mmap"}
    for key in params:
        if key not in valid_keys:
            return JSONResponse({"error": f"Unknown param: {key}"}, status_code=400)
    
    # Read current config
    config_path = BASE_DIR / "config.yaml"
    with open(config_path) as f:
        data = yaml.safe_load(f)
    
    # Update llamacpp_params
    data["llamacpp_params"] = {**data.get("llamacpp_params", {}), **params}
    
    # Write back
    with open(config_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)
    
    # Reload config in memory
    global config
    config = load_config(config_path)
    
    return {"status": "saved", "llamacpp_params": params}


@router.post("/restart")
async def restart_server():
    """Stop current model, reload config, restart with saved params."""
    # Stop current process
    manager.stop()
    
    # Reload config from disk (in case multiple instances)
    global config
    config = load_config(BASE_DIR / "config.yaml")
    
    # Clear _process so next /load uses new params
    with manager._lock:
        manager._process = None
        manager._log_path = manager._resolve_log_path()
    
    return {"status": "stopped", "message": "Server stopped. Load a model to restart with new params."}
```

### 2.2 Update `api.ts` — Replace Stubs

```ts
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
```

### 2.3 Update `types.ts` — Extend ServerConfig

```ts
export interface ServerConfig {
  server_port: number
  server_host: string
  models_dir: string
  llamacpp_params: LlammaCppParams  // now required
}
```

### 2.4 Update `api.ts` — fetchConfig

```ts
export async function fetchConfig(): Promise<ServerConfig> {
  const res = await api('/api/config')
  if (!res.ok) throw new Error('Failed to load config')
  const data = await res.json()
  // Ensure llamacpp_params is included
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
```

### 2.5 Update `/api/config` endpoint

In `backend/app/main.py`, extend the config response:

```python
@router.get("/api/config")
async def get_config():
    return {
        "server_port": config.server_port,
        "server_host": config.server_host,
        "models_dir": config.models_dir,
        "llamacpp_params": {
            "context_size": config.context_size,
            "threads": config.threads,
            "temp": config.temp,
            "top_p": config.top_p,
            "top_k": config.top_k,
            "min_p": config.min_p,
            "no_mmap": config.no_mmap,
        },
    }
```

### Phase 2 Deliverables
- `POST /config` — writes params to `config.yaml`, reloads in memory
- `POST /restart` — stops llama-server, clears process state
- UI save button persists to disk
- UI restart button stops server (user must reload a model to restart)
- Config changes survive restarts

---

## Notes

### Why restart stops instead of hot-reload?
llama-server doesn't support hot-reloading params. The only way to apply new
llamacpp_params is to kill the process and start a new one. The UI makes this
explicit: "Save" writes to disk, "Restart" stops the server. User loads a model
to start fresh with new params.

### Alternative: true hot-restart
Could spawn a new llama-server process on the same port after SIGTERM + wait.
Risk: port conflict if old process hasn't fully released the port. Simpler to
just stop and let user reload.

### Config file format
Current `config.yaml` uses flattened llamacpp_params. The write-back preserves
the `llamacpp_params` nested structure for readability.

### Testing
- Phase 1: UI renders correctly, sliders work, no network calls
- Phase 2: `POST /config` writes valid YAML, `POST /restart` stops process,
  reload a model picks up new params
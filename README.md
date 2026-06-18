# llama-web-manager

Web interface to browse, load and serve LLM models via llama.cpp server.

## Architecture

- **Python backend** (`server.sh` / `web.sh`) — REST API for model management, log reading, server control
- **Vite frontend** — TypeScript SPA that calls the backend API

## Quick Start

### Option A: Dual-start script (recommended)

```bash
./web.sh
```

Starts backend + frontend together, kills both on Ctrl+C.

### Option B: Manual

```bash
# Terminal 1 — Python backend API
./server.sh

# Terminal 2 — Frontend dev server (hot-reload)
cd frontend && npm install && npm run dev
```

Open http://localhost:8000 in your browser.

## Production Build

```bash
cd frontend && npm run build   # outputs to frontend/dist/
```

Then serve the built files with any static server (nginx, Caddy, `python -m http.server`, etc.) pointing to the backend API at `localhost:9000`.

## Configuration

### Backend (`config.yaml`)

Copy `config.yaml.example` to `config.yaml` and edit paths:

```bash
cp config.yaml.example config.yaml
```

| Key | Default | Description |
|---|---|---|
| `llama_server_path` | — | Path to llama.cpp binary |
| `models_dir` | — | Directory to scan for `.gguf` models |
| `server_port` | `11434` | llama.cpp server port |
| `server_host` | `0.0.0.0` | llama.cpp server bind address |
| `web_port` | `9000` | Backend API port |
| `log_lines` | `10` | Lines of log output to return in `/status` |
| `context_size` | `80000` | Context size passed to llama.cpp |

See [config.yaml.example](config.yaml.example) for all options.

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to point at the backend:

```bash
cp frontend/.env.example frontend/.env
# Edit VITE_API_URL=http://localhost:9000
```

Defaults to `http://192.168.1.153:9000` — update for your environment.

`web.sh` auto-creates `.env` from `.env.example` if it doesn't exist.

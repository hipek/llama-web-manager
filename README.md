# llama-web-manager

Web interface to browse, load and serve LLM models via llama.cpp server.

## Architecture

- **Python backend** (`app/main.py`) — FastAPI REST API for model management, log reading, and server control
- **Config layer** (`config/loader.py`) — Loads `config.yaml` into a frozen dataclass; validates all options at startup
- **Business logic** (`modules/`) — `ServerManager` (spawns/kills llama.cpp with SIGKILL fallback), `ModelScanner` (finds `.gguf` files), `LogReader` (tail log output)
- **Tests** (`tests/`) — pytest suite with 42 tests
- **Vite frontend** — TypeScript SPA that calls the backend API
- **Tooling** (`web.sh` / `server.sh`) — Shell wrappers that handle startup, cleanup, and `.env` scaffolding
- **Dependency manager** — [uv](https://docs.astral.sh/uv/) (see Quick Start)

## Prerequisites

- [uv](https://docs.astral.sh/uv/) for Python dependency management (install via `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- [pnpm](https://pnpm.io/) for the frontend
- A llama.cpp [release binary](https://github.com/ggerganov/llama.cpp/releases) (download and set `llama_server_path` in `config.yaml`)

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
cd frontend && pnpm install && pnpm dev
```

Open the frontend URL shown by `web.sh` (defaults to `http://localhost:8000`).

## Production Build

```bash
cd frontend && pnpm build   # outputs to frontend/dist/
```

Then serve the built files with a reverse proxy. For example, with **Caddy** (`Caddyfile`):

```caddy
your.domain.com {
  root * /var/www/frontend/dist
  file_server
  encode gzip

  # Proxy API calls to the backend
  reverse_proxy /api/* localhost:9000
  reverse_proxy /status localhost:9000
  reverse_proxy /models localhost:9000
  reverse_proxy /load localhost:9000
  reverse_proxy /stop localhost:9000
}
```

Or with **nginx**:

```nginx
server {
    listen 80;
    server_name your.domain.com;

    root /var/www/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api/ {
        proxy_pass http://localhost:9000;
    }
    location /status { proxy_pass http://localhost:9000; }
    location /models { proxy_pass http://localhost:9000; }
    location /load { proxy_pass http://localhost:9000; }
    location /stop { proxy_pass http://localhost:9000; }
}
```

For local development without a reverse proxy, `web.sh` proxies API calls via Vite's `vite.config.ts` dev server (see `frontend/vite.config.ts`).

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
| `threads` | `8` | Number of CPU threads |
| `temp` | `0.2` | Sampling temperature |
| `top_p` | `0.9` | Top-p sampling threshold |
| `top_k` | `10` | Top-k sampling threshold |
| `min_p` | `0.05` | Minimum probability for sampling |
| `no_mmap` | `true` | Disable memory-mapped file I/O |

See [config.yaml.example](config.yaml.example) for all options.

## Testing

```bash
make test
# or
uv run pytest tests/
```

### Frontend (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL` to point at the backend:

```bash
cp frontend/.env.example frontend/.env
# Edit VITE_API_URL=http://localhost:9000
```

Defaults to `http://192.168.1.153:9000` — update for your environment.

`web.sh` auto-creates `.env` from `.env.example` if it doesn't exist.

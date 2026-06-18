# llama-web-manager

Web interface to browse, load and serve LLM models via llama.cpp server.

## Architecture

- **Python backend** (`server.sh`) — REST API for model management, log reading, server control
- **Vite frontend** — TypeScript SPA that calls the backend API

## Quick Start

```bash
# Terminal 1 — Python backend API
./server.sh

# Terminal 2 — Frontend dev server (hot-reload)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173 in your browser.

## Development

```bash
# Start backend API
./server.sh

# Start frontend (auto-proxies /api/*, /status, /models, /load, /stop → localhost:8000)
cd frontend && npm run dev
```

## Production Build

```bash
cd frontend && npm run build   # outputs to frontend/dist/
```

Then serve the built files with any static server (nginx, Caddy, `python -m http.server`, etc.) pointing to the backend API at `localhost:8000`.

## Configuration

Copy `config.yaml.example` to `config.yaml` and edit paths:

```bash
cp config.yaml.example config.yaml
```

See [config.yaml.example](config.yaml.example) for all options.

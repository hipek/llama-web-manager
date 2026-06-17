# llama-web-manager

Web interface to browse, load and serve LLM models via llama.cpp server.

## Features

- Browse `.gguf` models from a configurable directory
- Load, switch and stop models with one click
- Live server log output (auto-refreshes every 5 seconds)
- REST API: `GET /models`, `GET /status`, `POST /load`, `POST /stop`
- Dark theme UI with Inter font
- Configurable server port, host and web port via `config.yaml`

## Quick Start

```bash
./web.sh
```

Open http://localhost:8000 in your browser.

## Frontend

The web UI is a [Vite](https://vitejs.dev/) + TypeScript project in [`frontend/`](frontend/).

### Build

```bash
cd frontend
npm install
npm run build
```

The server serves the built files from `frontend/dist/`. Run the build step before starting the server, or after any changes to `frontend/src/`.

### Development (live reload)

```bash
cd frontend
npm run dev        # starts Vite dev server on :5173
```

In another terminal, start the Python server:

```bash
./web.sh
```

The Vite dev server proxies API calls (`/api/*`, `/status`, `/models`, etc.) to `localhost:8000`. Open the Vite URL for hot-reload.

### Project structure

```
frontend/
  index.html          # Static shell (no inline JS)
  src/
    main.ts           # Init, event handlers, polling, localStorage
    api.ts            # API fetch wrappers
    ui.ts             # Toast, loading overlay helpers
    types.ts          # TypeScript interfaces
  dist/               # Build output (gitignored)
```

## Configuration

Copy `config.yaml.example` to `config.yaml` and edit paths:

```bash
cp config.yaml.example config.yaml
```

See [config.yaml.example](config.yaml.example) for all options.
```

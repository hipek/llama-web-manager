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
cd /home/jacek/work/llama-web-manager
./web.sh
```

Open http://localhost:8000 in your browser.

## Configuration

Copy `config.yaml.example` to `config.yaml` and edit paths:

```bash
cp config.yaml.example config.yaml
```

See [config.yaml.example](config.yaml.example) for all options.
```

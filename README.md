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

Edit `config.yaml`:

```yaml
llama_server_path: /home/jacek/llama/bin/llama-server
models_dir: /opt/data/jacek/models
server_port: 11434
server_host: 0.0.0.0
web_port: 8000
log_lines: 10
```

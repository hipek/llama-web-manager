from __future__ import annotations

import os
import signal
import subprocess
import threading
from pathlib import Path

from backend.config.loader import ServerConfig
from backend.modules.log_reader import read_last_lines


class ServerManager:
    def __init__(self, config: ServerConfig):
        self._config = config
        self._process: subprocess.Popen | None = None
        self._current_model: str | None = None
        self._lock = threading.Lock()
        self._log_path = self._resolve_log_path()

    def _resolve_log_path(self) -> str:
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        return str(log_dir / "llama-server.log")

    @property
    def is_running(self) -> bool:
        with self._lock:
            return self._process is not None and self._process.poll() is None

    @property
    def current_model(self) -> str | None:
        if not self.is_running:
            return None
        proc = self._process
        if proc is None:
            return None
        args: list[str] = list(proc.args)  # type: ignore
        for i, arg in enumerate(args):
            if arg == "--model" and i + 1 < len(args):
                return args[i + 1]
        return None

    def stop(self, timeout: int = 10) -> None:
        with self._lock:
            if self._process is not None and self._process.poll() is None:
                try:
                    self._process.send_signal(signal.SIGTERM)
                    try:
                        self._process.wait(timeout=timeout)
                    except subprocess.TimeoutExpired:
                        self._process.send_signal(signal.SIGKILL)
                        self._process.wait()
                except Exception:
                    pass
                self._process = None
                self._current_model = None

    def start(self, model_path: str) -> dict:
        self.stop()
        with self._lock:
            cmd = self._build_cmd(model_path)
            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
            self._current_model = model_path
        return {"status": "loading", "model": model_path}

    def _build_cmd(self, model_path: str | None = None) -> list[str]:
        cmd = [
            self._config.llama_server_path,
            "--host", self._config.server_host,
            "--port", str(self._config.server_port),
            "--log-file", self._log_path,
            "--log-prefix",
            "--log-timestamps",
            "--timeout", "-1",
            "--ctx-size", str(self._config.context_size),
            "--threads", str(self._config.threads),
            "--temp", str(self._config.temp),
            "--top-p", str(self._config.top_p),
            "--top-k", str(self._config.top_k),
            "--min-p", str(self._config.min_p),
        ]
        if model_path:
            cmd.extend(["--model", model_path])
        if self._config.no_mmap:
            cmd.append("--no-mmap")
        return cmd

    def restart(self) -> dict:
        """Stop and restart llama-server with current config params and model."""
        self.stop()
        with self._lock:
            cmd = self._build_cmd(self._current_model)
            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
        return {"status": "restarting"}

    @property
    def is_ready(self) -> bool:
        """Check if llama.cpp has finished loading and is ready to serve."""
        if not self.is_running:
            return False
        # Check last 20 lines for "llama_server: model loaded" (model loaded)
        lines = read_last_lines(self._log_path, 20)
        log_text = "\n".join(lines).lower()
        return "llama_server: model loaded" in log_text

    def get_status(self) -> dict:
        with self._lock:
            running = self._process is not None and self._process.poll() is None
            model = self._current_model
        return {
            "running": running,
            "model": model,
            "ready": self.is_ready,
        }

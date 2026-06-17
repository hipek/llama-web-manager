from __future__ import annotations

import os
import signal
import subprocess
import threading
from pathlib import Path

from config.loader import ServerConfig


class ServerManager:
    def __init__(self, config: ServerConfig):
        self._config = config
        self._process: subprocess.Popen | None = None
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

    def stop(self) -> None:
        with self._lock:
            if self._process is not None and self._process.poll() is None:
                try:
                    self._process.send_signal(signal.SIGTERM)
                except Exception:
                    pass
                self._process = None

    def start(self, model_path: str) -> dict:
        self.stop()
        with self._lock:
            cmd = [
                self._config.llama_server_path,
                "--model", model_path,
                "--host", self._config.server_host,
                "--port", str(self._config.server_port),
                "--log-file", self._log_path,
                "--log-prefix",
                "--log-timestamps",
                "--timeout", "-1",
            ]
            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
            )
        return {"status": "loading", "model": model_path}

    def get_status(self) -> dict:
        with self._lock:
            running = self._process is not None and self._process.poll() is None
            model = None
            if self._process:
                args: list[str] = list(self._process.args)  # type: ignore
                for i, arg in enumerate(args):
                    if arg == "--model" and i + 1 < len(args):
                        model = args[i + 1]
                        break
        return {
            "running": running,
            "model": model,
        }

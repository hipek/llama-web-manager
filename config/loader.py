from __future__ import annotations

import pathlib
from dataclasses import dataclass

import yaml


@dataclass(frozen=True)
class ServerConfig:
    llama_server_path: str
    models_dir: str
    server_port: int = 11434
    server_host: str = "0.0.0.0"
    web_port: int = 8000
    log_lines: int = 10


def load_config(path: str | pathlib.Path = "config.yaml") -> ServerConfig:
    with open(path) as f:
        data = yaml.safe_load(f)
    return ServerConfig(**data)

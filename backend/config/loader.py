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
    web_port: int = 9000
    log_lines: int = 10
    context_size: int = 80000
    threads: int = 8
    temp: float = 0.2
    top_p: float = 0.9
    top_k: int = 10
    min_p: float = 0.05
    no_mmap: bool = False


def load_config(path: str | pathlib.Path = "config.yaml") -> ServerConfig:
    with open(path) as f:
        data = yaml.safe_load(f)
    # Flatten llamacpp_params into top-level fields
    llm = data.pop("llamacpp_params", {})
    data.update(llm)
    return ServerConfig(**data)

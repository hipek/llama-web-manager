from __future__ import annotations

import tempfile
from pathlib import Path

import pytest
import yaml

from config.loader import ServerConfig, load_config


@pytest.fixture
def tmp_config(tmp_path: Path) -> ServerConfig:
    cfg = ServerConfig(
        llama_server_path="/usr/bin/llama-server",
        models_dir=str(tmp_path / "models"),
        server_port=11434,
        server_host="0.0.0.0",
        web_port=9000,
        log_lines=10,
        context_size=8000,
        threads=4,
        temp=0.2,
        top_p=0.9,
        top_k=10,
        min_p=0.05,
        no_mmap=False,
    )
    (tmp_path / "models").mkdir()
    return cfg


@pytest.fixture
def config_yaml_file(tmp_path: Path) -> Path:
    data = {
        "llama_server_path": "/usr/bin/llama-server",
        "models_dir": str(tmp_path / "models"),
        "server_port": 11434,
        "server_host": "0.0.0.0",
        "web_port": 9000,
        "llamacpp_params": {
            "context_size": 8000,
            "threads": 4,
            "temp": 0.2,
            "top_p": 0.9,
            "top_k": 10,
            "min_p": 0.05,
        },
    }
    cfg_path = tmp_path / "config.yaml"
    cfg_path.write_text(yaml.dump(data))
    return cfg_path

from __future__ import annotations

from pathlib import Path

from backend.config.loader import load_config
from backend.modules.server_manager import ServerManager

BASE_DIR = Path(__file__).parent.parent.parent
config_path = BASE_DIR / "config.yaml"
config = load_config(config_path)
manager = ServerManager(config)

__all__ = ("config_path", "config", "manager")

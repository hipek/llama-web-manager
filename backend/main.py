#!/usr/bin/env python3
"""llama-web-manager — entry point."""

import sys
import uvicorn

from backend.config.loader import load_config
from backend.app.main import app

if __name__ == "__main__":
    config = load_config()
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=config.web_port,
        reload=False,
    )

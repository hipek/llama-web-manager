from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.loader import load_config
from modules.model_scanner import scan_models
from modules.server_manager import ServerManager
from modules.log_reader import read_last_lines

BASE_DIR = Path(__file__).parent.parent
config = load_config(BASE_DIR / "config.yaml")
manager = ServerManager(config)

router = APIRouter()

@router.post("/load")
async def load_model(request: Request):
    form = await request.form()
    model_path = form.get("model_path", "")
    if not model_path or not os.path.isfile(model_path):
        return JSONResponse({"error": "Invalid model path"}, status_code=400)
    manager.start(model_path)
    return JSONResponse({"status": "loading", "model": model_path})


@router.post("/stop")
async def stop_server():
    manager.stop()
    return JSONResponse({"status": "stopped"})


@router.get("/status")
async def get_status():
    status = manager.get_status()
    log_lines = read_last_lines(manager._log_path, config.log_lines)
    return JSONResponse({**status, "log_lines": log_lines})


@router.get("/models")
async def list_models():
    models = scan_models(config.models_dir)
    return JSONResponse([
        {"name": m.name, "path": m.path, "size": m.size}
        for m in models
    ])


@router.get("/api/config")
async def get_config():
    return {
        "server_port": config.server_port,
        "server_host": config.server_host,
        "models_dir": config.models_dir,
    }


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

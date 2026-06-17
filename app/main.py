from __future__ import annotations

import os
from pathlib import Path

from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from jinja2 import Environment, FileSystemLoader

from config.loader import load_config
from modules.model_scanner import scan_models
from modules.server_manager import ServerManager
from modules.log_reader import read_last_lines

BASE_DIR = Path(__file__).parent.parent
config = load_config(BASE_DIR / "config.yaml")
manager = ServerManager(config)

router = APIRouter()
env = Environment(loader=FileSystemLoader(str(BASE_DIR / "templates")))


def render_template(name: str, context: dict) -> str:
    template = env.get_template(name)
    return template.render(**context)


@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    models = scan_models(config.models_dir)
    status = manager.get_status()
    log_lines = read_last_lines(manager._log_path, config.log_lines) if not status["running"] else []
    html = render_template(
        "index.html",
        {
            "request": request,
            "models": models,
            "running": status["running"],
            "current_model": status["model"],
            "server_port": config.server_port,
            "server_host": config.server_host,
            "log_lines": log_lines,
            "models_dir": config.models_dir,
        },
    )
    return HTMLResponse(html)


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


app = FastAPI()
app.include_router(router)

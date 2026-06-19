from __future__ import annotations

import os
from pathlib import Path

import yaml
from fastapi import APIRouter, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config.loader import load_config
from backend.modules.model_scanner import scan_models
from backend.modules.server_manager import ServerManager
from backend.modules.log_reader import read_last_lines

BASE_DIR = Path(__file__).parent.parent.parent
config_path = BASE_DIR / "config.yaml"
config = load_config(config_path)
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


VALID_LLM_PARAMS = {
    "context_size", "threads", "temp", "top_p", "top_k", "min_p", "no_mmap"
}


def _get_llm_params(cfg) -> dict:
    return {
        "context_size": cfg.context_size,
        "threads": cfg.threads,
        "temp": cfg.temp,
        "top_p": cfg.top_p,
        "top_k": cfg.top_k,
        "min_p": cfg.min_p,
        "no_mmap": cfg.no_mmap,
    }


@router.get("/api/config")
async def get_config():
    return {
        "server_port": config.server_port,
        "server_host": config.server_host,
        "models_dir": config.models_dir,
        "llamacpp_params": _get_llm_params(config),
    }


@router.post("/config")
async def update_config(request: Request):
    body = await request.json()
    params = body.get("llamacpp_params", {})

    for key in params:
        if key not in VALID_LLM_PARAMS:
            return JSONResponse(
                {"error": f"Unknown param: {key}"}, status_code=400
            )

    with open(config_path) as f:
        data = yaml.safe_load(f)

    data["llamacpp_params"] = {**data.get("llamacpp_params", {}), **params}

    with open(config_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)

    global config
    config = load_config(config_path)

    return {"status": "saved", "llamacpp_params": params}


@router.post("/restart")
async def restart_server():
    global config
    config = load_config(config_path)
    result = manager.restart()
    return {"status": "restarted", **result}


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)

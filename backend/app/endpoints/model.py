from __future__ import annotations

import os
from pathlib import Path

import yaml
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.app import state
from backend.config.loader import load_config
from backend.modules.log_reader import read_last_lines

router = APIRouter()


@router.post("/load")
async def load_model(request: Request):
    form = await request.form()
    model_path = form.get("model_path", "")
    if not model_path or not os.path.isfile(model_path):
        return JSONResponse({"error": "Invalid model path"}, status_code=400)
    state.manager.start(model_path)
    return JSONResponse({"status": "loading", "model": model_path})


@router.post("/stop")
async def stop_server():
    state.manager.stop()
    return JSONResponse({"status": "stopped"})


@router.get("/status")
async def get_status():
    status = state.manager.get_status()
    log_lines = read_last_lines(state.manager._log_path, state.config.log_lines)
    return JSONResponse({**status, "log_lines": log_lines})


@router.post("/restart")
async def restart_server():
    state.config = load_config(state.config_path)
    result = state.manager.restart()
    return {"status": "restarted", **result}

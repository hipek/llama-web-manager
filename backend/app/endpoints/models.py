from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app import state
from backend.modules import model_scanner

router = APIRouter()


@router.get("/models")
async def list_models():
    models = model_scanner.scan_models(state.config.models_dir)
    return JSONResponse([
        {"name": m.name, "path": m.path, "size": m.size}
        for m in models
    ])

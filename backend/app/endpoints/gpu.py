from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.modules.gpu_stats import get_gpu_stats

router = APIRouter()


@router.get("/gpu-stats")
async def gpu_stats_endpoint():
    return JSONResponse(get_gpu_stats())

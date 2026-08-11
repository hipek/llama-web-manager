from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.endpoints import config as config_endpoint
from backend.app.endpoints import gpu as gpu_endpoint
from backend.app.endpoints import model as model_endpoint
from backend.app.endpoints import models as models_endpoint

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(model_endpoint.router)
app.include_router(gpu_endpoint.router)
app.include_router(models_endpoint.router)
app.include_router(config_endpoint.router)

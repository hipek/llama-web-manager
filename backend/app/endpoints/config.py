from __future__ import annotations

import os
from pathlib import Path

import yaml
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from backend.app import state
from backend.config.loader import load_config

router = APIRouter()

VALID_LLM_PARAMS = {
    "context_size", "threads", "temp", "top_p", "top_k", "min_p", "embeddings", "jinja", "n_cpu_moe", "reasoning_budget", "reasoning_budget_message"
}


def _get_llm_params(cfg) -> dict:
    return {
        "context_size": cfg.context_size,
        "threads": cfg.threads,
        "temp": cfg.temp,
        "top_p": cfg.top_p,
        "top_k": cfg.top_k,
        "min_p": cfg.min_p,
        "embeddings": cfg.embeddings,
        "jinja": cfg.jinja,
        "n_cpu_moe": cfg.n_cpu_moe,
        "reasoning_budget": cfg.reasoning_budget,
        "reasoning_budget_message": cfg.reasoning_budget_message,
    }


@router.get("/config")
async def get_config():
    return {
        "server_port": state.config.server_port,
        "server_host": state.config.server_host,
        "models_dir": state.config.models_dir,
        "llamacpp_params": _get_llm_params(state.config),
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

    with open(state.config_path) as f:
        data = yaml.safe_load(f)

    data["llamacpp_params"] = {**data.get("llamacpp_params", {}), **params}

    with open(state.config_path, 'w') as f:
        yaml.dump(data, f, default_flow_style=False)

    state.config = load_config(state.config_path)

    return {"status": "saved", "llamacpp_params": params}

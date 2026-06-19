from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ModelFile:
    name: str
    path: str
    size: int


def scan_models(models_dir: str) -> list[ModelFile]:
    dir_path = Path(models_dir)
    if not dir_path.exists():
        return []
    models = []
    for fname in os.listdir(models_dir):
        full = os.path.join(models_dir, fname)
        if fname.endswith(".gguf") and os.path.isfile(full):
            size = os.path.getsize(full)
            models.append(ModelFile(name=fname, path=full, size=size))
    models.sort(key=lambda m: m.name.lower())
    return models

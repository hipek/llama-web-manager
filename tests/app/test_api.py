from __future__ import annotations

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx2
import pytest
from starlette.testclient import TestClient

from app.main import app


@pytest.fixture
def mock_manager(tmp_path: Path):
    manager = MagicMock()
    manager.is_running = False
    manager._log_path = str(tmp_path / "logs" / "llama-server.log")
    (tmp_path / "logs").mkdir(exist_ok=True)
    return manager


@pytest.fixture
def mock_config(tmp_path: Path):
    config = MagicMock()
    config.server_port = 11434
    config.server_host = "0.0.0.0"
    config.models_dir = str(tmp_path / "models")
    config.log_lines = 10
    (tmp_path / "models").mkdir(exist_ok=True)
    return config


@pytest.fixture
def client(mock_manager, mock_config):
    # Patch the module-level instances
    with patch("app.main.manager", mock_manager) as p1, \
         patch("app.main.config", mock_config) as p2:
        yield TestClient(app)


class TestStatusEndpoint:
    def test_status_running(self, client, mock_manager):
        mock_manager.get_status.return_value = {"running": True, "model": "/model.gguf"}
        mock_manager._log_path = "/tmp/test.log"
        resp = client.get("/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["running"] is True
        assert data["model"] == "/model.gguf"
        assert "log_lines" in data

    def test_status_stopped(self, client, mock_manager):
        mock_manager.get_status.return_value = {"running": False, "model": None}
        resp = client.get("/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["running"] is False


class TestModelsEndpoint:
    def test_list_models(self, client, mock_config):
        from modules.model_scanner import ModelFile
        mock_models = [
            ModelFile(name="a.gguf", path="/models/a.gguf", size=1024),
            ModelFile(name="b.gguf", path="/models/b.gguf", size=2048),
        ]
        with patch("app.main.scan_models", return_value=mock_models):
            resp = client.get("/models")
            assert resp.status_code == 200
            data = resp.json()
            assert len(data) == 2
            assert data[0]["name"] == "a.gguf"


class TestLoadEndpoint:
    def test_load_valid_model(self, client, mock_manager, tmp_path: Path):
        model_file = tmp_path / "test.gguf"
        model_file.write_bytes(b"model data")
        mock_manager.start.return_value = {"status": "loading", "model": str(model_file)}
        resp = client.post("/load", data={"model_path": str(model_file)})
        assert resp.status_code == 200
        assert resp.json()["status"] == "loading"

    def test_load_invalid_path(self, client):
        resp = client.post("/load", data={"model_path": "/nonexistent/model.gguf"})
        assert resp.status_code == 400
        assert "error" in resp.json()

    def test_load_empty_path(self, client):
        resp = client.post("/load", data={})
        assert resp.status_code == 400


class TestStopEndpoint:
    def test_stop(self, client, mock_manager):
        resp = client.post("/stop")
        assert resp.status_code == 200
        assert resp.json()["status"] == "stopped"
        mock_manager.stop.assert_called_once()


class TestConfigEndpoint:
    def test_get_config(self, client, mock_config):
        resp = client.get("/api/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["server_port"] == 11434
        assert data["server_host"] == "0.0.0.0"
        assert "models_dir" in data

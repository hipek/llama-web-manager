from __future__ import annotations

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import httpx2
import pytest
import yaml
from starlette.testclient import TestClient

from backend.app import state
from backend.app.main import app


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
def client(mock_manager, mock_config, tmp_path):
    # Patch the module-level instances
    with patch.object(state, "manager", mock_manager), \
         patch.object(state, "config", mock_config), \
         patch.object(state, "config_path", tmp_path / "config.yaml"):
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
        from backend.modules.model_scanner import ModelFile
        mock_models = [
            ModelFile(name="a.gguf", path="/models/a.gguf", size=1024),
            ModelFile(name="b.gguf", path="/models/b.gguf", size=2048),
        ]
        with patch("backend.modules.model_scanner.scan_models", return_value=mock_models):
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
        resp = client.get("/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["server_port"] == 11434
        assert data["server_host"] == "0.0.0.0"
        assert "models_dir" in data

    def test_update_config_unknown_param(self, client):
        resp = client.post(
            "/config",
            json={"llamacpp_params": {"bad_param": 1}},
        )
        assert resp.status_code == 400
        assert "error" in resp.json()

    def test_update_config_accepts_reasoning_params(self, client, tmp_path):
        cfg_path = tmp_path / "config.yaml"
        cfg_path.write_text(
            "llama_server_path: /usr/bin/llama-server\n"
            "models_dir: /tmp/models\n"
            "llamacpp_params: {}\n"
        )
        params = {
            "reasoning_budget": 8192,
            "reasoning_budget_message": "\n\nOK, I have enough to answer now.\n",
        }
        with patch.object(state, "config_path", cfg_path):
            resp = client.post("/config", json={"llamacpp_params": params})
        assert resp.status_code == 200
        data = yaml.safe_load(cfg_path.read_text())
        assert data["llamacpp_params"] == params


class TestRestartEndpoint:
    def test_restart(self, client, mock_manager, tmp_path):
        (tmp_path / "config.yaml").write_text("llama_server_path: /usr/bin/llama-server\nmodels_dir: /tmp/models\nserver_port: 11434\n")
        mock_manager.restart.return_value = {"status": "restarting"}
        resp = client.post("/restart")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "restarting"

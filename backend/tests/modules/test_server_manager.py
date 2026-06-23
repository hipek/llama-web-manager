from __future__ import annotations

import signal
import subprocess
from pathlib import Path
from unittest.mock import MagicMock, patch

from backend.config.loader import ServerConfig
from backend.modules.server_manager import ServerManager


def _make_process(returncode=None, args=None):
    proc = MagicMock()
    proc.poll.return_value = None if returncode is None else returncode
    proc.args = args or []
    return proc


class TestServerManagerInit:
    def test_init_stores_config(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        assert sm._config is tmp_config

    def test_init_creates_log_path(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        assert sm._log_path.endswith("logs/llama-server.log")


class TestIsRunning:
    def test_not_running_no_process(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        assert sm.is_running is False

    def test_running(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        assert sm.is_running is True

    def test_stopped(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=0)
        assert sm.is_running is False


class TestCurrentModel:
    def test_none_when_not_running(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        assert sm.current_model is None

    def test_returns_model_from_args(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None, args=["--model", "/path/to/model.gguf"])
        assert sm.current_model == "/path/to/model.gguf"

    def test_none_when_no_model_arg(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None, args=["--host", "0.0.0.0"])
        assert sm.current_model is None


class TestStop:
    def test_stop_sends_sigterm(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        proc_ref = sm._process
        sm.stop()
        # _process is set to None after stop, use captured ref
        proc_ref.send_signal.assert_called_once()

    def test_stop_sets_process_none(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        sm.stop()
        assert sm._process is None

    def test_stop_noop_when_not_running(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=0)
        sm.stop()
        sm._process.send_signal.assert_not_called()

    def test_stop_sends_sigkill_on_timeout(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        proc_ref = sm._process
        proc_ref.wait.side_effect = subprocess.TimeoutExpired(cmd=None, timeout=10)
        sm.stop(timeout=10)
        # _process is set to None after stop, use captured ref
        proc_ref.send_signal.assert_called_with(signal.SIGKILL)

    def test_stop_handles_exception(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        sm._process.send_signal.side_effect = Exception("boom")
        sm.stop()  # should not raise
        assert sm._process is None


class TestStart:
    def test_start_creates_process(self, tmp_config: ServerConfig):
        with patch("backend.modules.server_manager.subprocess.Popen") as mock_popen:
            mock_popen.return_value = _make_process(returncode=None)
            sm = ServerManager(tmp_config)
            result = sm.start("/path/to/model.gguf")
            assert result == {"status": "loading", "model": "/path/to/model.gguf"}
            mock_popen.assert_called_once()
            call_args = mock_popen.call_args
            assert "--model" in call_args[0][0]
            assert "/path/to/model.gguf" in call_args[0][0]

    def test_start_includes_no_mmap_flag(self, tmp_config: ServerConfig):
        cfg = ServerConfig(
            llama_server_path=tmp_config.llama_server_path,
            models_dir=tmp_config.models_dir,
            server_port=tmp_config.server_port,
            server_host=tmp_config.server_host,
            web_port=tmp_config.web_port,
            log_lines=tmp_config.log_lines,
            context_size=tmp_config.context_size,
            threads=tmp_config.threads,
            temp=tmp_config.temp,
            top_p=tmp_config.top_p,
            top_k=tmp_config.top_k,
            min_p=tmp_config.min_p,
            no_mmap=True,
        )
        with patch("backend.modules.server_manager.subprocess.Popen") as mock_popen:
            mock_popen.return_value = _make_process(returncode=None)
            sm = ServerManager(cfg)
            sm.start("/path/to/model.gguf")
            cmd = mock_popen.call_args[0][0]
            assert "--no-mmap" in cmd

    def test_stop_called_before_start(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        with patch.object(sm, "stop") as mock_stop:
            with patch("backend.modules.server_manager.subprocess.Popen") as mock_popen:
                mock_popen.return_value = _make_process(returncode=None)
                sm.start("/path/to/model.gguf")
                mock_stop.assert_called_once()


class TestGetStatus:
    def test_status_running(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None, args=["--model", "/model.gguf"])
        status = sm.get_status()
        assert status["running"] is True
        assert status["model"] == "/model.gguf"

    def test_status_stopped(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=0)
        status = sm.get_status()
        assert status["running"] is False
        assert status["model"] is None


class TestRestart:
    def test_restart_stops_then_starts(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None, args=["--model", "/model.gguf"])
        sm._current_model = "/model.gguf"
        with patch("backend.modules.server_manager.subprocess.Popen") as mock_popen:
            mock_popen.return_value = _make_process(returncode=None)
            result = sm.restart()
            assert result == {"status": "restarting"}
            # stop() was called (process set to None), then Popen called
            mock_popen.assert_called_once()

    def test_restart_with_no_current_model(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        sm._current_model = None
        with patch("backend.modules.server_manager.subprocess.Popen") as mock_popen:
            mock_popen.return_value = _make_process(returncode=None)
            result = sm.restart()
            assert result == {"status": "restarting"}
            cmd = mock_popen.call_args[0][0]
            assert "--model" not in cmd


class TestIsReady:
    def test_ready_when_log_contains_keyword(self, tmp_config: ServerConfig, tmp_path: Path):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        log_file = tmp_path / "llama-server.log"
        log_file.write_text("llama_server: model loaded successfully\n")
        sm._log_path = str(log_file)
        assert sm.is_ready is True

    def test_not_ready_when_keyword_missing(self, tmp_config: ServerConfig, tmp_path: Path):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        log_file = tmp_path / "llama-server.log"
        log_file.write_text("loading weights...\n")
        sm._log_path = str(log_file)
        assert sm.is_ready is False

    def test_not_ready_when_not_running(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = None
        assert sm.is_ready is False

    def test_cached_ready_returns_true(self, tmp_config: ServerConfig):
        sm = ServerManager(tmp_config)
        sm._process = _make_process(returncode=None)
        sm._ready = True
        assert sm.is_ready is True

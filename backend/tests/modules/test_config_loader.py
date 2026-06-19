from __future__ import annotations

from backend.config.loader import ServerConfig, load_config


class TestServerConfigDefaults:
    def test_defaults(self):
        cfg = ServerConfig(
            llama_server_path="/bin/llama",
            models_dir="/models",
        )
        assert cfg.server_port == 11434
        assert cfg.server_host == "0.0.0.0"
        assert cfg.web_port == 9000
        assert cfg.log_lines == 10
        assert cfg.context_size == 80000
        assert cfg.threads == 8
        assert cfg.temp == 0.2
        assert cfg.top_p == 0.9
        assert cfg.top_k == 10
        assert cfg.min_p == 0.05
        assert cfg.no_mmap is False

    def test_custom_values(self):
        cfg = ServerConfig(
            llama_server_path="/bin/llama",
            models_dir="/models",
            server_port=8080,
            threads=16,
        )
        assert cfg.server_port == 8080
        assert cfg.threads == 16

    def test_frozen(self):
        cfg = ServerConfig(
            llama_server_path="/bin/llama",
            models_dir="/models",
        )
        try:
            cfg.server_port = 9999
            assert False, "should raise"
        except Exception:
            pass


class TestLoadConfig:
    def test_load_from_file(self, config_yaml_file):
        cfg = load_config(config_yaml_file)
        assert cfg.llama_server_path == "/usr/bin/llama-server"
        assert cfg.server_port == 11434
        assert cfg.context_size == 8000
        assert cfg.threads == 4

    def test_load_with_no_mmap(self, tmp_path):
        import yaml
        data = {
            "llama_server_path": "/bin/llama",
            "models_dir": str(tmp_path / "models"),
            "llamacpp_params": {"no_mmap": True},
        }
        cfg_path = tmp_path / "config.yaml"
        cfg_path.write_text(yaml.dump(data))
        cfg = load_config(cfg_path)
        assert cfg.no_mmap is True

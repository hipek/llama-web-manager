from __future__ import annotations

from backend.modules.model_scanner import scan_models, ModelFile


class TestScanModels:
    def test_empty_dir(self, tmp_path: Path):
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        result = scan_models(str(models_dir))
        assert result == []

    def test_no_gguf_files(self, tmp_path: Path):
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        (models_dir / "readme.txt").write_text("hello")
        result = scan_models(str(models_dir))
        assert result == []

    def test_single_gguf(self, tmp_path: Path):
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        model_file = models_dir / "model.gguf"
        model_file.write_bytes(b"x" * 1024)
        result = scan_models(str(models_dir))
        assert len(result) == 1
        assert result[0].name == "model.gguf"
        assert result[0].size == 1024

    def test_multiple_gguf_sorted(self, tmp_path: Path):
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        (models_dir / "z_model.gguf").write_bytes(b"z" * 2048)
        (models_dir / "a_model.gguf").write_bytes(b"a" * 512)
        (models_dir / "readme.txt").write_text("ignore")
        result = scan_models(str(models_dir))
        assert len(result) == 2
        assert result[0].name == "a_model.gguf"
        assert result[1].name == "z_model.gguf"

    def test_returns_model_file_objects(self, tmp_path: Path):
        models_dir = tmp_path / "models"
        models_dir.mkdir()
        model_file = models_dir / "test.gguf"
        model_file.write_bytes(b"data")
        result = scan_models(str(models_dir))
        assert isinstance(result[0], ModelFile)
        assert result[0].path == str(models_dir / "test.gguf")

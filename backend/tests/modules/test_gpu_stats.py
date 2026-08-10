from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

from backend.modules.gpu_stats import get_gpu_stats


class TestGetGpuStats:
    def test_no_sysfs(self):
        with patch("backend.modules.gpu_stats.Path") as mock_path:
            mock_path.return_value.exists.return_value = False
            assert get_gpu_stats() == []

    def test_no_cards(self, tmp_path: Path):
        base = tmp_path / "drm"
        base.mkdir()
        with patch("backend.modules.gpu_stats.Path", return_value=base):
            assert get_gpu_stats() == []

    def test_single_amd_card(self, tmp_path: Path):
        base = tmp_path / "drm" / "card0" / "device"
        base.mkdir(parents=True)
        (base / "vendor").write_text("1002\n")
        (base / "mem_info_vram_total").write_text("8589934592\n")
        (base / "mem_info_vram_used").write_text("4294967296\n")
        (base / "gpu_busy_percent").write_text("45\n")
        (base / "mem_busy_percent").write_text("50\n")

        with patch("backend.modules.gpu_stats.Path", return_value=base.parent.parent):
            result = get_gpu_stats()

        assert len(result) == 1
        assert result[0]["vram_total"] == 8589934592
        assert result[0]["vram_used"] == 4294967296
        assert result[0]["vram_used_pct"] == 50.0
        assert result[0]["gpu_busy_pct"] == 45
        assert result[0]["mem_busy_pct"] == 50

    def test_skip_non_amd_vendor(self, tmp_path: Path):
        base = tmp_path / "drm" / "card0" / "device"
        base.mkdir(parents=True)
        (base / "vendor").write_text("8086\n")
        with patch("backend.modules.gpu_stats.Path", return_value=base.parent.parent):
            assert get_gpu_stats() == []

    def test_skip_connector_dirs(self, tmp_path: Path):
        base = tmp_path / "drm"
        (base / "card0").mkdir(parents=True)
        (base / "card0-DP-1").mkdir()
        (base / "renderD128").mkdir()
        with patch("backend.modules.gpu_stats.Path", return_value=base):
            assert get_gpu_stats() == []

    def test_missing_vram_total_ignored(self, tmp_path: Path):
        base = tmp_path / "drm" / "card0" / "device"
        base.mkdir(parents=True)
        (base / "vendor").write_text("1002\n")
        # No vram_total file
        with patch("backend.modules.gpu_stats.Path", return_value=base.parent.parent):
            assert get_gpu_stats() == []

    def test_partial_stats(self, tmp_path: Path):
        base = tmp_path / "drm" / "card0" / "device"
        base.mkdir(parents=True)
        (base / "vendor").write_text("1002\n")
        (base / "mem_info_vram_total").write_text("1000\n")
        # No vram_used, gpu_busy, mem_busy
        with patch("backend.modules.gpu_stats.Path", return_value=base.parent.parent):
            result = get_gpu_stats()
        assert result[0]["vram_used"] == 0
        assert result[0]["vram_used_pct"] is None
        assert result[0]["gpu_busy_pct"] is None
        assert result[0]["mem_busy_pct"] is None

    def test_multiple_cards_sorted(self, tmp_path: Path):
        base0 = tmp_path / "drm" / "card0" / "device"
        base1 = tmp_path / "drm" / "card1" / "device"
        base0.mkdir(parents=True)
        base1.mkdir(parents=True)
        (base0 / "vendor").write_text("1002\n")
        (base0 / "mem_info_vram_total").write_text("4000\n")
        (base1 / "vendor").write_text("1002\n")
        (base1 / "mem_info_vram_total").write_text("8000\n")
        with patch("backend.modules.gpu_stats.Path", return_value=tmp_path / "drm"):
            result = get_gpu_stats()
        assert len(result) == 2
        assert result[0]["vram_total"] == 4000
        assert result[1]["vram_total"] == 8000

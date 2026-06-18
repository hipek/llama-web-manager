from __future__ import annotations

import tempfile
from pathlib import Path

from modules.log_reader import read_last_lines


class TestReadLastLines:
    def test_nonexistent_file(self):
        result = read_last_lines("/tmp/nonexistent_file_xyz.log")
        assert result == []

    def test_empty_file(self, tmp_path: Path):
        f = tmp_path / "empty.log"
        f.write_text("")
        result = read_last_lines(str(f))
        assert result == []

    def test_single_line(self, tmp_path: Path):
        f = tmp_path / "single.log"
        f.write_text("hello\n")
        result = read_last_lines(str(f), n=10)
        assert result == ["hello"]

    def test_multiple_lines(self, tmp_path: Path):
        f = tmp_path / "multi.log"
        f.write_text("line1\nline2\nline3\n")
        result = read_last_lines(str(f), n=2)
        assert result == ["line2", "line3"]

    def test_n_larger_than_lines(self, tmp_path: Path):
        f = tmp_path / "few.log"
        f.write_text("a\nb\n")
        result = read_last_lines(str(f), n=100)
        assert result == ["a", "b"]

    def test_large_file(self, tmp_path: Path):
        f = tmp_path / "large.log"
        lines = [f"line{i}\n" for i in range(1000)]
        f.write_text("".join(lines))
        result = read_last_lines(str(f), n=5)
        assert len(result) == 5
        assert result[0] == "line995"
        assert result[-1] == "line999"

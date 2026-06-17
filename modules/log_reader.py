from __future__ import annotations

from pathlib import Path


def read_last_lines(log_path: str, n: int = 10) -> list[str]:
    path = Path(log_path)
    if not path.exists():
        return []
    with open(path, "rb") as f:
        f.seek(0, 2)
        size = f.tell()
        if size == 0:
            return []
        buf = b""
        pos = size
        lines = 0
        while pos > 0 and lines <= n:
            pos -= 1
            f.seek(pos)
            buf = f.read(size - pos) + buf
            if buf.count(b"\n") >= n:
                break
        text = buf.decode("utf-8", errors="replace")
        result = text.splitlines()
        return result[-n:]

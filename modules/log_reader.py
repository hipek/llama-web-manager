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
        chunk = 4096
        while pos > 0:
            read_size = min(chunk, pos)
            pos -= read_size
            f.seek(pos)
            buf = f.read(read_size) + buf
            if buf.count(b"\n") >= n + 1:
                break
        lines = buf.decode("utf-8", errors="replace").splitlines()
        return lines[-n:]

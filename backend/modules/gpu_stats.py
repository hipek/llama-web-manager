"""Read GPU memory stats from sysfs for AMD GPUs."""

from pathlib import Path


def get_gpu_stats() -> list[dict]:
    """Return GPU stats for all AMD cards found in sysfs.

    Reads:
      /sys/class/drm/card*/device/mem_info_vram_total
      /sys/class/drm/card*/device/mem_info_vram_used
      /sys/class/drm/card*/device/gpu_busy_percent
      /sys/class/drm/card*/device/mem_busy_percent

    Returns empty list on non-AMD or missing sysfs.
    """
    base = Path("/sys/class/drm")
    if not base.exists():
        return []

    stats: list[dict] = []

    for card_dir in sorted(base.iterdir()):
        # Only process card0, card1, etc. — skip connectors (card0-DP-1) and render nodes
        if not card_dir.name.startswith("card"):
            continue

        device = card_dir / "device"
        if not device.is_dir():
            continue

        # Skip Intel (vendor 0x8086) — only AMD (0x1002)
        try:
            vendor = int((device / "vendor").read_text().strip(), 16)
        except (FileNotFoundError, ValueError):
            continue

        if vendor != 0x1002:
            continue

        def _read_int(name: str) -> int | None:
            try:
                return int((device / name).read_text().strip())
            except (FileNotFoundError, ValueError):
                return None

        vram_total = _read_int("mem_info_vram_total")
        vram_used = _read_int("mem_info_vram_used")
        gpu_busy = _read_int("gpu_busy_percent")
        mem_busy = _read_int("mem_busy_percent")

        if vram_total is None:
            continue

        vram_used_pct = round(vram_used / vram_total * 100, 1) if vram_total and vram_used is not None else None

        stats.append({
            "vram_total": vram_total,
            "vram_used": vram_used or 0,
            "vram_used_pct": vram_used_pct,
            "gpu_busy_pct": gpu_busy,
            "mem_busy_pct": mem_busy,
        })

    return stats

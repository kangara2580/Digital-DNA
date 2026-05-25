#!/usr/bin/env python3
"""ARA 로고 — 라이트(테두리 없음) / 다크(회색 테두리 유지) 투명 PNG."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
WHITE_REF = BRAND / "ara-logo-on-white-ref.png"
CANVAS = 1024


def is_pink(r: int, g: int, b: int, a: int) -> bool:
    return a > 12 and r > 125 and g < 150 and b > 70 and (r - g) > 55


def is_white_bg(r: int, g: int, b: int, a: int) -> bool:
    return a > 12 and r > 230 and g > 230 and b > 230


def is_gray_border(r: int, g: int, b: int, a: int) -> bool:
    if a < 12 or is_white_bg(r, g, b, a) or is_pink(r, g, b, a):
        return False
    avg = (r + g + b) / 3
    return (
        abs(r - g) < 40
        and abs(g - b) < 40
        and 70 < avg < 220
        and max(r, g, b) - min(r, g, b) < 50
    )


def is_black_fill(r: int, g: int, b: int, a: int) -> bool:
    if a < 12 or is_white_bg(r, g, b, a) or is_pink(r, g, b, a) or is_gray_border(r, g, b, a):
        return False
    return max(r, g, b) < 120


def build_light(ref: Image.Image) -> Image.Image:
    w, h = ref.size
    rp = ref.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = rp[x, y]
            if is_white_bg(r, g, b, a) or is_gray_border(r, g, b, a):
                continue
            if is_pink(r, g, b, a):
                op[x, y] = (r, g, b, a)
            elif is_black_fill(r, g, b, a):
                op[x, y] = (0, 0, 0, 255)

    return out


def build_dark(ref: Image.Image) -> Image.Image:
    w, h = ref.size
    rp = ref.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = rp[x, y]
            if is_white_bg(r, g, b, a):
                continue
            if is_pink(r, g, b, a):
                op[x, y] = (r, g, b, a)
            elif is_gray_border(r, g, b, a):
                op[x, y] = (r, g, b, a)
            elif is_black_fill(r, g, b, a):
                op[x, y] = (r, g, b, a)

    return out


def main() -> None:
    ref = Image.open(WHITE_REF).convert("RGBA")
    ref = ref.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)

    light = build_light(ref)
    dark = build_dark(ref)

    light.save(BRAND / "ara-logo-light.png")
    dark.save(BRAND / "ara-logo-dark.png")
    light.save(BRAND / "ara-logo.png")
    dark.save(BRAND / "rail-home-logo.png")

    print("Saved ara-logo-light.png (no gray border)")
    print("Saved ara-logo-dark.png + rail-home-logo.png (with gray border)")


if __name__ == "__main__":
    main()

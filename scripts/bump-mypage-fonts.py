#!/usr/bin/env python3
"""Bump text-[Npx] (incl. sm: etc.) in account UI by +2px."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    "src/components/MyPageDashboard.tsx",
    "src/components/MyPageSectionShell.tsx",
    "src/components/MyPageSortSelect.tsx",
    "src/lib/mypageOutlineCta.ts",
    "src/components/AccountSettingsDashboard.tsx",
    "src/components/MyPageWishlistSection.tsx",
    "src/components/MyPageLikedVideosSection.tsx",
    "src/components/MyPageAccountOverview.tsx",
    "src/components/MyPagePasswordSection.tsx",
    "src/components/MyPageProfileEditForm.tsx",
    "src/components/MyPageMyListingsSection.tsx",
    "src/components/MyPageSavedDraftsSection.tsx",
    "src/components/MyPageSellerAnalyticsSection.tsx",
    "src/components/FaceProfileUploadSection.tsx",
    "src/components/MyPageStudioSection.tsx",
    "src/components/LocalePreferenceSelect.tsx",
    "src/components/ProfileAvatarPicker.tsx",
]

PX_RE = re.compile(r"(\b(?:[\w\[\]%-]+:)*)(text-)\[(\d+)px\]")


def bump_px(m: re.Match[str]) -> str:
    prefix, text_literal, n_s = m.groups()
    return f"{prefix}{text_literal}[{int(n_s) + 2}px]"


def main() -> None:
    for rel in FILES:
        path = ROOT / rel
        if not path.is_file():
            print("skip missing", rel)
            continue
        old = path.read_text(encoding="utf-8")
        new = PX_RE.sub(bump_px, old)
        if new != old:
            path.write_text(new, encoding="utf-8")
            print("updated", rel)


if __name__ == "__main__":
    main()

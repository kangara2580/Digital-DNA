export const SELL_VIDEO_CATEGORY_OPTIONS = [
  { value: "best", label: "베스트" },
  { value: "recommend", label: "추천" },
  { value: "latest", label: "최신" },
  { value: "daily", label: "일상" },
  { value: "dance", label: "춤" },
  { value: "music", label: "노래" },
  { value: "food", label: "푸드" },
  { value: "travel", label: "여행" },
  { value: "animals", label: "동물" },
  { value: "sports", label: "스포츠" },
  { value: "nature", label: "자연" },
  { value: "business", label: "비즈니스" },
  { value: "comedy", label: "코미디" },
  { value: "cartoon", label: "만화" },
] as const;

export type SellVideoCategory = (typeof SELL_VIDEO_CATEGORY_OPTIONS)[number]["value"];

/** 피드·랭킹용 — 등록/수정 폼에서 사용자가 선택할 수 없음 */
export const SELL_VIDEO_CATEGORY_SYSTEM_SLUGS = ["best", "recommend", "latest"] as const;

const SELL_VIDEO_CATEGORY_SYSTEM_SET = new Set<string>(SELL_VIDEO_CATEGORY_SYSTEM_SLUGS);

export type SellVideoUserSelectableCategory = Exclude<
  SellVideoCategory,
  (typeof SELL_VIDEO_CATEGORY_SYSTEM_SLUGS)[number]
>;

export const SELL_VIDEO_CATEGORY_USER_OPTIONS = SELL_VIDEO_CATEGORY_OPTIONS.filter(
  (item) => !SELL_VIDEO_CATEGORY_SYSTEM_SET.has(item.value),
) as ReadonlyArray<{ value: SellVideoUserSelectableCategory; label: string }>;

const SELL_VIDEO_CATEGORY_SET = new Set<string>(
  SELL_VIDEO_CATEGORY_OPTIONS.map((item) => item.value),
);

export function isSellVideoCategory(value: string): value is SellVideoCategory {
  return SELL_VIDEO_CATEGORY_SET.has(value);
}

/** 판매 영상 등록·수정: 선택 가능한 카테고리만 */
export function coerceSellCategoryForUserForm(
  value: string | null | undefined,
): SellVideoUserSelectableCategory {
  const v = typeof value === "string" ? value.trim() : "";
  if (v && isSellVideoCategory(v) && !SELL_VIDEO_CATEGORY_SYSTEM_SET.has(v)) {
    return v as SellVideoUserSelectableCategory;
  }
  return "daily";
}

const SELL_VIDEO_CATEGORY_LABEL_MAP = new Map<string, string>(
  SELL_VIDEO_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
);

export function getSellVideoCategoryLabel(value: string | undefined): string {
  if (!value) return "카테고리 미지정";
  return SELL_VIDEO_CATEGORY_LABEL_MAP.get(value) ?? "카테고리 미지정";
}

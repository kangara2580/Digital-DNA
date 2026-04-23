export const SELL_VIDEO_CATEGORY_OPTIONS = [
  { value: "daily", label: "일상" },
  { value: "shortform", label: "숏폼·릴스" },
  { value: "dance", label: "춤" },
  { value: "music", label: "노래" },
  { value: "food", label: "푸드" },
  { value: "travel", label: "여행" },
  { value: "animals", label: "동물" },
  { value: "business", label: "비즈니스" },
  { value: "comedy", label: "코미디" },
  { value: "cartoon", label: "만화" },
  { value: "oops", label: "실패와 실수" },
] as const;

export type SellVideoCategory = (typeof SELL_VIDEO_CATEGORY_OPTIONS)[number]["value"];

const SELL_VIDEO_CATEGORY_SET = new Set<string>(
  SELL_VIDEO_CATEGORY_OPTIONS.map((item) => item.value),
);

export function isSellVideoCategory(value: string): value is SellVideoCategory {
  return SELL_VIDEO_CATEGORY_SET.has(value);
}

const SELL_VIDEO_CATEGORY_LABEL_MAP = new Map<string, string>(
  SELL_VIDEO_CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
);

export function getSellVideoCategoryLabel(value: string | undefined): string {
  if (!value) return "카테고리 미지정";
  return SELL_VIDEO_CATEGORY_LABEL_MAP.get(value) ?? "카테고리 미지정";
}

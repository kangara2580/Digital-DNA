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

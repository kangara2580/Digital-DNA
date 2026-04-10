import type { FeedVideo } from "./videos";
import { SAMPLE_VIDEOS } from "./videos";

const videoById = new Map(SAMPLE_VIDEOS.map((v) => [v.id, v]));

export type InspirationCategoryConfig = {
  title: string;
  href: string;
  videoIds: readonly [string, string, string, string];
};

/** 홈 「영감이 필요한 순간」 — 카테고리 3개 × 클립 4개 (mallCategoryNav와 동일 href) */
export const INSPIRATION_CATEGORY_CONFIGS: InspirationCategoryConfig[] = [
  {
    title: "베스트",
    href: "/category/best",
    videoIds: ["1", "2", "3", "4"],
  },
  {
    title: "추천",
    href: "/category/recommend",
    videoIds: ["5", "6", "7", "8"],
  },
  {
    title: "일상",
    href: "/category/daily",
    videoIds: ["9", "10", "11", "12"],
  },
];

export type InspirationCategoryRow = {
  title: string;
  href: string;
  videos: FeedVideo[];
};

export function getInspirationCategories(): InspirationCategoryRow[] {
  return INSPIRATION_CATEGORY_CONFIGS.map((c) => ({
    title: c.title,
    href: c.href,
    videos: c.videoIds.map((id) => {
      const v = videoById.get(id);
      if (!v) {
        throw new Error(`inspirationCategories: missing video id "${id}"`);
      }
      return v;
    }),
  }));
}

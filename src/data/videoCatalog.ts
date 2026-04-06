import type { FeedVideo } from "@/data/videos";
import { FAILURE_OOPS_CLIPS, SAMPLE_VIDEOS } from "@/data/videos";

export type VideoCatalogMeta = {
  categories: string[];
  vibeIds: string[];
  /** ISO 날짜 — 최신순 정렬용 */
  listedAt: string;
};

/** 카테고리 슬러그 ↔ MallTopNav 라벨 */
export const CATEGORY_SLUGS = [
  "best",
  "recommend",
  "daily",
  "shortform",
  "dance",
  "music",
  "food",
  "travel",
  "animals",
  "business",
  "comedy",
  "cartoon",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

export const CATEGORY_LABEL: Record<CategorySlug, string> = {
  best: "베스트",
  recommend: "추천",
  daily: "일상",
  shortform: "숏폼·릴스",
  dance: "춤",
  music: "노래",
  food: "푸드",
  travel: "여행",
  animals: "동물",
  business: "비즈니스",
  comedy: "코미디",
  cartoon: "만화",
};

export const ALL_MARKET_VIDEOS: FeedVideo[] = [
  ...SAMPLE_VIDEOS,
  ...FAILURE_OOPS_CLIPS,
];

const M: Record<string, VideoCatalogMeta> = {
  "1": {
    categories: ["travel", "daily", "recommend"],
    vibeIds: ["coastal_walk", "calm_day"],
    listedAt: "2026-02-12",
  },
  "2": {
    categories: ["daily", "shortform", "best", "business"],
    vibeIds: ["urban_night", "neon_city"],
    listedAt: "2026-03-01",
  },
  "3": {
    categories: ["food", "daily", "recommend"],
    vibeIds: ["cafe_day", "warm_indoor"],
    listedAt: "2026-01-20",
  },
  "4": {
    categories: ["travel", "daily", "animals"],
    vibeIds: ["forest_trail", "green_escape"],
    listedAt: "2026-02-28",
  },
  "5": {
    categories: ["daily", "music", "recommend"],
    vibeIds: ["rainy_window", "rainy_cafe", "cozy_rain"],
    listedAt: "2026-03-10",
  },
  "6": {
    categories: ["travel", "best"],
    vibeIds: ["sunset_beach", "golden_hour"],
    listedAt: "2026-01-05",
  },
  "7": {
    categories: ["food", "daily", "comedy"],
    vibeIds: ["night_market", "street_vibe"],
    listedAt: "2026-02-18",
  },
  "8": {
    categories: ["dance", "shortform", "best", "business"],
    vibeIds: ["studio_energy", "dance_practice"],
    listedAt: "2026-03-05",
  },
  "9": {
    categories: ["daily", "travel", "recommend"],
    vibeIds: ["river_morning", "active_day"],
    listedAt: "2026-02-22",
  },
  "10": {
    categories: ["travel", "daily", "animals"],
    vibeIds: ["snow_peak", "cold_nature"],
    listedAt: "2026-01-28",
  },
  "11": {
    categories: ["music", "daily", "shortform"],
    vibeIds: ["rooftop_party", "urban_fun"],
    listedAt: "2026-02-08",
  },
  "12": {
    categories: ["travel", "daily", "music"],
    vibeIds: ["village_morning", "slow_life"],
    listedAt: "2026-01-15",
  },
  "dna-100-asphalt": {
    categories: ["daily", "shortform", "recommend"],
    vibeIds: ["rainy_cafe", "wet_street", "urban_wet"],
    listedAt: "2026-03-12",
  },
  "dna-300-rain-asmr": {
    categories: ["music", "daily", "recommend"],
    vibeIds: ["rainy_cafe", "asmr_rain", "cozy_rain"],
    listedAt: "2026-03-11",
  },
  "dna-500-window-rain": {
    categories: ["daily", "shortform"],
    vibeIds: ["rainy_window", "rainy_cafe", "cozy_rain"],
    listedAt: "2026-03-09",
  },
  "micro-100-neon-bokeh": {
    categories: ["daily", "shortform", "best"],
    vibeIds: ["urban_night", "neon_city"],
    listedAt: "2026-03-14",
  },
  "micro-150-river-glint": {
    categories: ["daily", "travel", "recommend"],
    vibeIds: ["river_morning", "active_day"],
    listedAt: "2026-03-13",
  },
  "micro-200-forest-mist": {
    categories: ["travel", "daily"],
    vibeIds: ["forest_trail", "green_escape"],
    listedAt: "2026-03-14",
  },
  "micro-200-beach-foam": {
    categories: ["travel", "best"],
    vibeIds: ["sunset_beach", "golden_hour"],
    listedAt: "2026-03-12",
  },
  "micro-250-rooftop-breeze": {
    categories: ["music", "shortform", "daily"],
    vibeIds: ["rooftop_party", "urban_fun"],
    listedAt: "2026-03-13",
  },
  "micro-300-night-market": {
    categories: ["food", "daily", "comedy"],
    vibeIds: ["night_market", "street_vibe"],
    listedAt: "2026-03-15",
  },
  "micro-300-dance-kick": {
    categories: ["dance", "shortform", "best"],
    vibeIds: ["studio_energy", "dance_practice"],
    listedAt: "2026-03-14",
  },
  "micro-100-snow-quiet": {
    categories: ["travel", "daily"],
    vibeIds: ["snow_peak", "cold_nature"],
    listedAt: "2026-03-11",
  },
  "micro-250-village-dawn": {
    categories: ["travel", "daily", "music"],
    vibeIds: ["village_morning", "slow_life"],
    listedAt: "2026-03-10",
  },
  "fail-1": { categories: ["comedy", "food", "daily"], vibeIds: ["kitchen_chaos"], listedAt: "2026-02-14" },
  "fail-2": {
    categories: ["comedy", "daily", "cartoon"],
    vibeIds: ["stumble_moment"],
    listedAt: "2026-02-16",
  },
  "fail-3": {
    categories: ["comedy", "food", "daily"],
    vibeIds: ["cafe_spill", "cafe_day"],
    listedAt: "2026-02-19",
  },
  "fail-4": { categories: ["comedy", "daily", "travel"], vibeIds: ["slip_outdoor"], listedAt: "2026-02-11" },
  "fail-5": { categories: ["comedy", "food"], vibeIds: ["cafe_fail", "street_vibe"], listedAt: "2026-02-25" },
  "fail-6": {
    categories: ["comedy", "music", "cartoon"],
    vibeIds: ["party_oops", "urban_fun"],
    listedAt: "2026-02-27",
  },
  "fail-7": {
    categories: ["comedy", "travel", "daily"],
    vibeIds: ["beach_fail", "golden_hour"],
    listedAt: "2026-03-02",
  },
  "fail-8": {
    categories: ["comedy", "travel", "shortform"],
    vibeIds: ["coastal_walk", "wet_street"],
    listedAt: "2026-03-04",
  },
};

export function getVideoCatalogMeta(id: string): VideoCatalogMeta {
  return (
    M[id] ?? {
      categories: ["daily"],
      vibeIds: [],
      listedAt: "2026-01-01",
    }
  );
}

export function getVideosForCategory(slug: string): FeedVideo[] {
  return ALL_MARKET_VIDEOS.filter((v) =>
    getVideoCatalogMeta(v.id).categories.includes(slug),
  );
}

/** 가격 구간별 12칸 그리드 span (작은 가격 = 작은 타일) */
export function priceGridSpan12(priceWon: number | undefined): number {
  const p = priceWon ?? 0;
  if (p <= 200) return 2;
  if (p <= 600) return 3;
  if (p <= 1500) return 4;
  if (p <= 3500) return 6;
  return 8;
}

export function sortVideosByPrice(list: FeedVideo[], asc: boolean): FeedVideo[] {
  return [...list].sort((a, b) => {
    const pa = a.priceWon ?? 0;
    const pb = b.priceWon ?? 0;
    return asc ? pa - pb : pb - pa;
  });
}

export function sortVideosByNewest(list: FeedVideo[]): FeedVideo[] {
  return [...list].sort(
    (a, b) =>
      getVideoCatalogMeta(b.id).listedAt.localeCompare(
        getVideoCatalogMeta(a.id).listedAt,
      ),
  );
}

/**
 * 같은 Vibe 클러스터를 공유하는 조각들(자기 자신 제외).
 * 저가 조각을 앞에 두어 ‘퀼트’처럼 이어 붙이기 좋게 정렬.
 */
export function getRelatedByVibe(videoId: string, limit = 4): FeedVideo[] {
  const self = getVideoCatalogMeta(videoId);
  if (!self.vibeIds.length) return [];
  const vibeSet = new Set(self.vibeIds);
  const scored: { video: FeedVideo; score: number; price: number }[] = [];

  for (const v of ALL_MARKET_VIDEOS) {
    if (v.id === videoId) continue;
    const m = getVideoCatalogMeta(v.id);
    let score = 0;
    for (const x of m.vibeIds) {
      if (vibeSet.has(x)) score += 1;
    }
    if (score === 0) continue;
    scored.push({
      video: v,
      score,
      price: v.priceWon ?? 1e9,
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.price - b.price;
  });

  return scored.slice(0, limit).map((s) => s.video);
}

export function vibeSummaryLabel(videoId: string): string | null {
  const v = getVideoCatalogMeta(videoId).vibeIds;
  if (v.includes("rainy_cafe")) return "비 오는 날 · 카페 무드";
  if (v.includes("urban_night")) return "야경 · 네온 무드";
  if (v.includes("cafe_day")) return "카페 · 따뜻한 실내";
  if (v.includes("forest_trail")) return "숲 · 산책 무드";
  if (v.includes("coastal_walk")) return "바다 · 산책 무드";
  return v.length ? "비슷한 무드 이어 붙이기" : null;
}

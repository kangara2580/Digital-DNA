import type { FeedVideo } from "@/data/videos";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import {
  FAILURE_OOPS_CLIPS,
  LOCAL_TRENDING_FEED_VIDEOS,
  SAMPLE_VIDEOS,
} from "@/data/videos";

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
  "oops",
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
  oops: "실패와 실수",
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
  ...LOCAL_TRENDING_FEED_VIDEOS,
  ...SAMPLE_VIDEOS,
  ...FAILURE_OOPS_CLIPS,
];

/**
 * 찜한 `video_id` → `FeedVideo` (마켓 카탈로그 + 실시간 TikTok 인기 스트립).
 * 인기순위 카드 id(`tiktok-rank-{순번}-{embedId}`)는 ALL_MARKET_VIDEOS에 없어서 여기서 합칩니다.
 */
export function buildWishlistVideoLookup(): Map<string, FeedVideo> {
  const m = new Map<string, FeedVideo>();
  for (const v of ALL_MARKET_VIDEOS) m.set(v.id, v);
  for (const v of manualTikTokRankingToFeedVideos(getTikTokManualRanking())) {
    m.set(v.id, v);
    if (v.tiktokEmbedId) {
      m.set(`tiktok-${v.tiktokEmbedId}`, { ...v, id: `tiktok-${v.tiktokEmbedId}` });
    }
  }
  return m;
}

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
  "13": {
    categories: ["daily", "travel", "recommend"],
    vibeIds: ["river_morning", "active_day"],
    listedAt: "2026-03-06",
  },
  "14": {
    categories: ["daily", "shortform", "recommend", "best"],
    vibeIds: ["urban_night", "neon_city"],
    listedAt: "2026-03-07",
  },
  "15": {
    categories: ["dance", "music", "recommend", "shortform"],
    vibeIds: ["studio_energy", "urban_fun"],
    listedAt: "2026-03-08",
  },
  "16": {
    categories: ["travel", "daily", "recommend"],
    vibeIds: ["snow_peak", "cold_nature"],
    listedAt: "2026-03-09",
  },
  "17": {
    categories: ["travel", "daily", "recommend", "music"],
    vibeIds: ["sunset_beach", "golden_hour"],
    listedAt: "2026-03-03",
  },
  "18": {
    categories: ["travel", "daily", "recommend"],
    vibeIds: ["village_morning", "slow_life"],
    listedAt: "2026-02-26",
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
  "fail-1": { categories: ["oops", "comedy", "food", "daily"], vibeIds: ["kitchen_chaos"], listedAt: "2026-02-14" },
  "fail-2": {
    categories: ["oops", "comedy", "daily", "cartoon"],
    vibeIds: ["stumble_moment"],
    listedAt: "2026-02-16",
  },
  "fail-3": {
    categories: ["oops", "comedy", "food", "daily"],
    vibeIds: ["cafe_spill", "cafe_day"],
    listedAt: "2026-02-19",
  },
  "fail-4": { categories: ["oops", "comedy", "daily", "travel"], vibeIds: ["slip_outdoor"], listedAt: "2026-02-11" },
  "fail-5": { categories: ["oops", "comedy", "food"], vibeIds: ["cafe_fail", "street_vibe"], listedAt: "2026-02-25" },
  "fail-6": {
    categories: ["oops", "comedy", "music", "cartoon"],
    vibeIds: ["party_oops", "urban_fun"],
    listedAt: "2026-02-27",
  },
  "fail-7": {
    categories: ["oops", "comedy", "travel", "daily"],
    vibeIds: ["beach_fail", "golden_hour"],
    listedAt: "2026-03-02",
  },
  "fail-8": {
    categories: ["oops", "comedy", "travel", "shortform"],
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

export function normalizeSellerHandle(raw: string): string {
  const base = raw.trim().replace(/^@+/, "").toLowerCase();
  const cleaned = base.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "seller";
}

export function getSellerNickname(rawCreator: string): string {
  const base = rawCreator.trim().replace(/^@+/, "");
  return base || "seller";
}

export function getVideosBySellerHandle(handle: string): FeedVideo[] {
  const normalized = normalizeSellerHandle(handle);
  return sortVideosByNewest(
    ALL_MARKET_VIDEOS.filter(
      (video) => normalizeSellerHandle(video.creator) === normalized,
    ),
  );
}

export function getCreatorBySellerHandle(handle: string): string | null {
  const normalized = normalizeSellerHandle(handle);
  const found = ALL_MARKET_VIDEOS.find(
    (video) => normalizeSellerHandle(video.creator) === normalized,
  );
  return found?.creator ?? null;
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

/**
 * 상세 페이지 하단 — 무드 연관 → 같은 카테고리 → 신규 순으로 채워 쇼핑 이어가기.
 */
export function getShopRecommendations(videoId: string, limit = 36): FeedVideo[] {
  const seen = new Set<string>([videoId]);
  const out: FeedVideo[] = [];

  for (const v of getRelatedByVibe(videoId, 120)) {
    if (out.length >= limit) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }

  const meta = getVideoCatalogMeta(videoId);
  for (const slug of meta.categories) {
    for (const v of sortVideosByNewest(getVideosForCategory(slug))) {
      if (out.length >= limit) break;
      if (!seen.has(v.id)) {
        seen.add(v.id);
        out.push(v);
      }
    }
  }

  for (const v of sortVideosByNewest(ALL_MARKET_VIDEOS)) {
    if (out.length >= limit) break;
    if (!seen.has(v.id)) {
      seen.add(v.id);
      out.push(v);
    }
  }

  return out.slice(0, limit);
}

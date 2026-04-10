/** 인기순위 카드 하단 데모 지표 (실서비스는 API로 교체) */
export type TrendingRankMetrics = {
  /** 누적 수익(원) */
  cumulativeRevenueWon: number;
  /** 총 조회수 */
  totalViews: number;
  /** 총 좋아요 */
  totalLikes: number;
  /** 성장률(%) — 양수 상승, 음수 하락 */
  growthPercent: number;
};

export const TRENDING_RANK_METRICS: Record<string, TrendingRankMetrics> = {
  "1": {
    cumulativeRevenueWon: 12_480_000,
    totalViews: 2_842_000,
    totalLikes: 128_400,
    growthPercent: 62,
  },
  "3": {
    cumulativeRevenueWon: 3_960_000,
    totalViews: 891_000,
    totalLikes: 42_100,
    growthPercent: 18,
  },
  "5": {
    cumulativeRevenueWon: 8_020_000,
    totalViews: 1_956_000,
    totalLikes: 96_800,
    growthPercent: -30,
  },
  "7": {
    cumulativeRevenueWon: 5_340_000,
    totalViews: 1_124_000,
    totalLikes: 51_200,
    growthPercent: 44,
  },
  "9": {
    cumulativeRevenueWon: 2_180_000,
    totalViews: 3_405_000,
    totalLikes: 201_000,
    growthPercent: -12,
  },
};

function hashToUnit(h: number, max: number): number {
  return h % max;
}

function deriveMetricsFromRank(videoId: string, rankIndex: number): TrendingRankMetrics {
  const h = Math.imul(31, rankIndex + 1);
  let x = 0;
  for (let i = 0; i < videoId.length; i++) {
    x = Math.imul(31, x) + videoId.charCodeAt(i);
  }
  const seed = Math.abs(h ^ x) | 0;
  const revenue =
    520_000 + hashToUnit(seed, 48_000_000 / 10_000) * 10_000;
  const views = 120_000 + hashToUnit(seed >>> 8, 9_800_000);
  const likes = 2_000 + hashToUnit(seed >>> 16, 380_000);
  const growthRaw = hashToUnit(seed >>> 24, 121) - 35;
  return {
    cumulativeRevenueWon: revenue,
    totalViews: views,
    totalLikes: likes,
    growthPercent: growthRaw,
  };
}

/** rankIndex(0~4): 상위 5 고정 지표. 5~9: 데모 변동 지표(Top 10 나머지 슬롯) */
export function getTrendingMetrics(
  videoId: string,
  rankIndex: number,
): TrendingRankMetrics {
  if (rankIndex < 5) {
    const explicit = TRENDING_RANK_METRICS[videoId];
    if (explicit) return explicit;
  }
  return deriveMetricsFromRank(videoId, rankIndex);
}

/**
 * 조각 상세 등 — `videoId`마다 고정된 데모 지표(인기순위 카드와 동일 필드).
 * `TRENDING_RANK_METRICS`에 있으면 그대로, 없으면 id 기반 시드로 생성합니다.
 */
export function getMetricsForVideoDetail(videoId: string): TrendingRankMetrics {
  const explicit = TRENDING_RANK_METRICS[videoId];
  if (explicit) return explicit;
  let x = 0;
  for (let i = 0; i < videoId.length; i++) {
    x = Math.imul(31, x) + videoId.charCodeAt(i);
  }
  const rankIndex = Math.abs(x) % 10;
  return deriveMetricsFromRank(videoId, rankIndex);
}

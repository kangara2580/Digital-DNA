import {
  getCommerceMeta,
  getMarketVideoById,
} from "@/data/videoCommerce";
import { getMetricsForVideoDetail } from "@/data/trendingStats";

/** 마이페이지 데모: 내가 올린 것으로 간주하는 조각 id (실서비스는 sellerId 필터) */
export const DEMO_MY_LISTING_VIDEO_IDS: readonly string[] = [
  "1",
  "3",
  "5",
  "7",
  "9",
  "11",
  "13",
  "15",
];

export type SellerVideoAnalyticsRow = {
  videoId: string;
  title: string;
  poster: string;
  priceWon: number;
  /** 복제·판매 건수(플랫폼 복제 지수) */
  salesCount: number;
  /** 플랫폼 집계 누적 수익(원) — 상세 페이지 지표와 동일 출처 */
  cumulativeRevenueWon: number;
  totalViews: number;
  totalLikes: number;
  growthPercent: number;
  /** 노출 대비 상세 진입률(데모) */
  ctrPercent: number;
  /** 추정 노출(데모) */
  impressions: number;
  /** 평균 시청 유지(초, 데모) */
  avgWatchSec: number;
  /** 재생 완료율 %(데모) */
  completionRate: number;
};

export type FunnelStage = {
  label: string;
  /** 전 단계 대비 전환율 % */
  stepRatePercent: number;
  /** 퍼널 첫 단계 대비 상대 비율 0~100 */
  funnelPercent: number;
};

export type TrafficChannel = {
  id: string;
  label: string;
  percent: number;
  /** 전주 대비 변화 %p (데모) */
  deltaPercentPoints: number;
};

export type RetentionStep = {
  label: string;
  /** 해당 구간까지 시청한 비율 */
  audiencePercent: number;
};

export type RevenueDayPoint = {
  label: string;
  revenueWon: number;
};

export type SellerAnalyticsSnapshot = {
  periodLabel: string;
  totals: {
    cumulativeRevenueWon: number;
    /** 전 기간 대비 수익 성장률 % */
    revenueGrowthPercent: number;
    totalSalesCount: number;
    salesGrowthPercent: number;
    avgSellingPrice: number;
    totalImpressions: number;
    totalDetailViews: number;
    /** 노출 → 상세 */
    ctrPercent: number;
    /** 상세 → 구매 전환(데모) */
    purchaseConversionPercent: number;
  };
  revenueByDay: RevenueDayPoint[];
  funnel: FunnelStage[];
  channels: TrafficChannel[];
  retention: RetentionStep[];
  videos: SellerVideoAnalyticsRow[];
};

function hashId(videoId: string): number {
  let x = 0;
  for (let i = 0; i < videoId.length; i++) {
    x = Math.imul(31, x) + videoId.charCodeAt(i);
  }
  return Math.abs(x);
}

function deriveCtr(videoId: string): number {
  const h = hashId(videoId);
  return 4.2 + (h % 120) / 10;
}

function deriveAvgWatch(videoId: string): number {
  const h = hashId(videoId);
  return 12 + (h % 38);
}

function deriveCompletion(videoId: string): number {
  const h = hashId(videoId);
  return 28 + (h % 52);
}

export function buildSellerVideoRow(videoId: string): SellerVideoAnalyticsRow | null {
  const video = getMarketVideoById(videoId);
  if (!video) return null;
  const commerce = getCommerceMeta(videoId);
  const m = getMetricsForVideoDetail(videoId);
  const ctr = deriveCtr(videoId);
  const impressions = Math.round(m.totalViews * (1.05 + (hashId(videoId) % 25) / 100));

  return {
    videoId,
    title: video.title,
    poster: video.poster,
    priceWon: video.priceWon ?? 0,
    salesCount: commerce.salesCount,
    cumulativeRevenueWon: m.cumulativeRevenueWon,
    totalViews: m.totalViews,
    totalLikes: m.totalLikes,
    growthPercent: m.growthPercent,
    ctrPercent: ctr,
    impressions,
    avgWatchSec: deriveAvgWatch(videoId),
    completionRate: deriveCompletion(videoId),
  };
}

function buildRevenueSeries(
  totalRevenue: number,
  days: number,
  seed: number,
): RevenueDayPoint[] {
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  const out: RevenueDayPoint[] = [];
  let acc = 0;
  for (let i = 0; i < days; i++) {
    const wobble = 0.65 + ((seed + i * 17) % 70) / 100;
    const v = Math.round((totalRevenue / days) * wobble);
    acc += v;
    out.push({
      label: labels[i] ?? `${i + 1}일`,
      revenueWon: v,
    });
  }
  const diff = totalRevenue - acc;
  if (out.length > 0 && diff !== 0) {
    out[out.length - 1] = {
      ...out[out.length - 1],
      revenueWon: out[out.length - 1].revenueWon + diff,
    };
  }
  return out;
}

/**
 * @param periodDays 7 | 28 | 90 — 라벨·시계열 길이만 조정(데모)
 */
export function buildSellerAnalyticsSnapshot(
  periodDays: 7 | 28 | 90 = 7,
): SellerAnalyticsSnapshot {
  const rows: SellerVideoAnalyticsRow[] = [];
  for (const id of DEMO_MY_LISTING_VIDEO_IDS) {
    const row = buildSellerVideoRow(id);
    if (row) rows.push(row);
  }

  const cumulativeRevenueWon = rows.reduce(
    (s, r) => s + r.cumulativeRevenueWon,
    0,
  );
  const totalSalesCount = rows.reduce((s, r) => s + r.salesCount, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalDetailViews = rows.reduce((s, r) => s + r.totalViews, 0);
  const totalPriceWeighted = rows.reduce(
    (s, r) => s + r.priceWon * r.salesCount,
    0,
  );
  const avgSellingPrice =
    totalSalesCount > 0 ? Math.round(totalPriceWeighted / totalSalesCount) : 0;

  const ctrPercent =
    totalImpressions > 0
      ? (totalDetailViews / totalImpressions) * 100
      : 0;

  const avgListingGrowth =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.growthPercent, 0) / rows.length
      : 0;

  const periodLabel =
    periodDays === 7
      ? "최근 7일"
      : periodDays === 28
        ? "최근 28일"
        : "최근 90일";

  const sliceFactor = periodDays === 7 ? 1 : periodDays === 28 ? 0.92 : 0.85;
  const periodRevenue = Math.round(cumulativeRevenueWon * 0.08 * sliceFactor);

  const revenueByDay = buildRevenueSeries(
    Math.max(periodRevenue, 1),
    periodDays === 7 ? 7 : 7,
    hashId("seller-snapshot"),
  );

  const funnel: FunnelStage[] = [
    { label: "노출", stepRatePercent: 100, funnelPercent: 100 },
    { label: "피드·목록 클릭", stepRatePercent: 24, funnelPercent: 24 },
    { label: "상세 페이지", stepRatePercent: 52, funnelPercent: 12.5 },
    { label: "장바구니·찜", stepRatePercent: 38, funnelPercent: 4.8 },
    { label: "결제·복제 완료", stepRatePercent: 44, funnelPercent: 2.1 },
  ];

  const channels: TrafficChannel[] = [
    { id: "feed", label: "추천·카테고리 피드", percent: 38, deltaPercentPoints: 2.4 },
    { id: "search", label: "검색·태그", percent: 27, deltaPercentPoints: -1.1 },
    { id: "profile", label: "프로필·스토어", percent: 18, deltaPercentPoints: 0.6 },
    { id: "external", label: "외부 링크·임베드", percent: 12, deltaPercentPoints: 0.2 },
    { id: "push", label: "알림·재방문", percent: 5, deltaPercentPoints: -0.4 },
  ];

  const retention: RetentionStep[] = [
    { label: "0–3초 훅", audiencePercent: 92 },
    { label: "3–15초", audiencePercent: 78 },
    { label: "15–30초", audiencePercent: 61 },
    { label: "30초 이상", audiencePercent: 44 },
    { label: "완주·루프", audiencePercent: 31 },
  ];

  return {
    periodLabel,
    totals: {
      cumulativeRevenueWon: periodRevenue,
      revenueGrowthPercent: Math.round(avgListingGrowth * 10) / 10,
      totalSalesCount,
      salesGrowthPercent: 8.2,
      avgSellingPrice,
      totalImpressions,
      totalDetailViews,
      ctrPercent: Math.min(99, Math.max(2, ctrPercent)),
      purchaseConversionPercent: 2.35,
    },
    revenueByDay,
    funnel,
    channels,
    retention,
    videos: rows.sort(
      (a, b) => b.cumulativeRevenueWon - a.cumulativeRevenueWon,
    ),
  };
}

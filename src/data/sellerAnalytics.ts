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

/** 분석 기간(일) — 프리셋·직접 입력 공통 */
export const SELLER_ANALYTICS_MIN_DAYS = 1;
export const SELLER_ANALYTICS_MAX_DAYS = 365;

export type SellerAnalyticsSnapshot = {
  periodLabel: string;
  /** 직접 기간 선택 시에만 채움 */
  dateRange?: { start: string; end: string };
  periodDays: number;
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

function revenueBarLabels(periodDays: number): string[] {
  if (periodDays <= 7) {
    const w = ["월", "화", "수", "목", "금", "토", "일"];
    return Array.from({ length: periodDays }, (_, i) => w[i] ?? `${i + 1}`);
  }
  return Array.from({ length: 7 }, (_, i) => {
    const start = Math.floor((i * periodDays) / 7) + 1;
    const end = Math.floor(((i + 1) * periodDays) / 7);
    return start === end ? `${start}일차` : `${start}–${end}일`;
  });
}

function buildRevenueSeries(
  totalRevenue: number,
  periodDays: number,
  seed: number,
): RevenueDayPoint[] {
  const barCount = periodDays <= 7 ? periodDays : 7;
  const labels = revenueBarLabels(periodDays);
  const out: RevenueDayPoint[] = [];
  let acc = 0;
  for (let i = 0; i < barCount; i++) {
    const wobble = 0.65 + ((seed + i * 17) % 70) / 100;
    const v = Math.round((totalRevenue / barCount) * wobble);
    acc += v;
    out.push({
      label: labels[i] ?? `${i + 1}`,
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

export type SellerVideoDetailSnapshot = {
  videoId: string;
  title: string;
  poster: string;
  periodLabel: string;
  periodDays: number;
  dateRange?: { start: string; end: string };
  row: SellerVideoAnalyticsRow;
  /** 기간 내 이 영상 추정 수익(데모) */
  periodRevenueWon: number;
  revenueByDay: RevenueDayPoint[];
  funnel: FunnelStage[];
  channels: TrafficChannel[];
  retention: RetentionStep[];
  devices: { id: string; label: string; percent: number }[];
  /** 시청 시간대(0–23, 데모) */
  hourlyAttention: { hour: number; weight: number }[];
  searchTerms: { term: string; sharePercent: number }[];
  /** 전 기간 대비 성장(데모) */
  revenueMomPercent: number;
  viewsMomPercent: number;
};

function clampPeriodDays(n: number): number {
  return Math.max(
    SELLER_ANALYTICS_MIN_DAYS,
    Math.min(SELLER_ANALYTICS_MAX_DAYS, Math.floor(n)),
  );
}

/**
 * 단일 영상 — 유튜브 스튜디오 스타일 상세(데모 데이터)
 */
export function buildSellerVideoDetailSnapshot(
  videoId: string,
  periodDaysInput: number,
  dateRange?: { start: string; end: string },
): SellerVideoDetailSnapshot | null {
  const row = buildSellerVideoRow(videoId);
  if (!row) return null;

  let periodDays = clampPeriodDays(periodDaysInput);
  if (dateRange?.start && dateRange?.end) {
    const a = new Date(`${dateRange.start}T12:00:00`);
    const b = new Date(`${dateRange.end}T12:00:00`);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a <= b) {
      const diff =
        Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      periodDays = clampPeriodDays(diff);
    }
  }

  const periodLabel = dateRange
    ? `${dateRange.start.replace(/-/g, ". ")} – ${dateRange.end.replace(/-/g, ". ")}`
    : periodDays === 7
      ? "최근 7일"
      : periodDays === 28
        ? "최근 28일"
        : periodDays === 90
          ? "최근 90일"
          : `최근 ${periodDays}일`;

  const h = hashId(`${videoId}-detail-${periodDays}`);
  const sliceFactor =
    periodDays <= 7 ? 1 : periodDays <= 28 ? 0.92 : periodDays <= 90 ? 0.85 : 0.78;
  const periodRevenueWon = Math.max(
    1,
    Math.round(row.cumulativeRevenueWon * 0.08 * sliceFactor * (0.9 + (h % 20) / 100)),
  );

  const revenueByDay = buildRevenueSeries(
    periodRevenueWon,
    periodDays,
    h,
  );

  const funnel: FunnelStage[] = [
    { label: "노출", stepRatePercent: 100, funnelPercent: 100 },
    { label: "썸네일·제목 클릭", stepRatePercent: 22 + (h % 8), funnelPercent: 22 + (h % 8) },
    { label: "상세·미리보기", stepRatePercent: 48, funnelPercent: 11 },
    { label: "찜·카트", stepRatePercent: 35, funnelPercent: 3.8 },
    { label: "결제·복제", stepRatePercent: 41, funnelPercent: 1.6 },
  ];

  const channels: TrafficChannel[] = [
    { id: "feed", label: "추천·피드", percent: 34 + (h % 6), deltaPercentPoints: 1.2 },
    { id: "search", label: "검색", percent: 26, deltaPercentPoints: -0.8 },
    { id: "related", label: "연관 동영상", percent: 19, deltaPercentPoints: 2.1 },
    { id: "profile", label: "프로필", percent: 14, deltaPercentPoints: 0.4 },
    { id: "ext", label: "외부", percent: 7, deltaPercentPoints: 0 },
  ];

  const retention: RetentionStep[] = [
    { label: "0–3초", audiencePercent: 90 + (h % 8) },
    { label: "3–10초", audiencePercent: 72 + (h % 10) },
    { label: "10–30초", audiencePercent: 58 + (h % 8) },
    { label: "30초+", audiencePercent: 41 + (h % 9) },
    { label: "완주·반복", audiencePercent: 28 + (h % 7) },
  ];

  const devices = [
    { id: "mobile", label: "모바일", percent: 62 + (h % 5) },
    { id: "desktop", label: "데스크톱", percent: 24 + (h % 4) },
    { id: "tablet", label: "태블릿", percent: 10 },
    { id: "tv", label: "TV·기타", percent: 4 },
  ];

  const hourlyAttention = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    weight: 20 + ((h + hour * 13) % 80),
  }));

  const searchTerms = [
    { term: "동영상 배경", sharePercent: 18 + (h % 5) },
    { term: "세로 영상", sharePercent: 14 },
    { term: "무드 클립", sharePercent: 11 },
    { term: "AI 합성", sharePercent: 9 },
  ];

  return {
    videoId,
    title: row.title,
    poster: row.poster,
    periodLabel,
    periodDays,
    dateRange,
    row,
    periodRevenueWon,
    revenueByDay,
    funnel,
    channels,
    retention,
    devices,
    hourlyAttention,
    searchTerms,
    revenueMomPercent: 4 + (h % 12),
    viewsMomPercent: 2 + (h % 15),
  };
}

export type BuildSellerSnapshotOptions = {
  /** 직접 선택 시 시작·끝 (YYYY-MM-DD) */
  dateRange?: { start: string; end: string };
};

/**
 * @param periodDays 분석 일수 (1–365). dateRange가 있으면 그 차이가 우선합니다.
 */
export function buildSellerAnalyticsSnapshot(
  periodDaysInput: number = 7,
  options?: BuildSellerSnapshotOptions,
): SellerAnalyticsSnapshot {
  const rows: SellerVideoAnalyticsRow[] = [];
  for (const id of DEMO_MY_LISTING_VIDEO_IDS) {
    const row = buildSellerVideoRow(id);
    if (row) rows.push(row);
  }

  let periodDays = clampPeriodDays(periodDaysInput);
  let dateRange = options?.dateRange;

  if (dateRange?.start && dateRange?.end) {
    const a = new Date(`${dateRange.start}T12:00:00`);
    const b = new Date(`${dateRange.end}T12:00:00`);
    if (!Number.isNaN(a.getTime()) && !Number.isNaN(b.getTime()) && a <= b) {
      const diff =
        Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      periodDays = clampPeriodDays(diff);
    }
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

  const periodLabel = dateRange
    ? `${dateRange.start.replace(/-/g, ". ")} – ${dateRange.end.replace(/-/g, ". ")}`
    : periodDays === 7
      ? "최근 7일"
      : periodDays === 28
        ? "최근 28일"
        : periodDays === 90
          ? "최근 90일"
          : `최근 ${periodDays}일`;

  const sliceFactor =
    periodDays <= 7 ? 1 : periodDays <= 28 ? 0.92 : periodDays <= 90 ? 0.85 : 0.78;
  const periodRevenue = Math.round(cumulativeRevenueWon * 0.08 * sliceFactor);

  const revenueByDay = buildRevenueSeries(
    Math.max(periodRevenue, 1),
    periodDays,
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
    dateRange: dateRange?.start && dateRange?.end ? dateRange : undefined,
    periodDays,
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

import type { Video } from "@prisma/client";
import { normalizeStoredPurchaseGems, toGemPrice } from "@/lib/gemPrice";
import type {
  FunnelStage,
  RetentionStep,
  RevenueDayPoint,
  SellerAnalyticsSnapshot,
  SellerVideoAnalyticsRow,
  SellerVideoDetailSnapshot,
  TrafficChannel,
} from "@/data/sellerAnalytics";
import {
  SELLER_ANALYTICS_MAX_DAYS,
  SELLER_ANALYTICS_MIN_DAYS,
} from "@/data/sellerAnalytics";

/** 노출은 DB에 없어 조회수 대비 계수로만 추정 */
const IMPRESSION_FACTOR = 1.15;

export type SellerAnalyticsPurchase = {
  videoId: string;
  price: number;
  createdAt: Date;
};

export type SellerAnalyticsLike = {
  videoId: string;
  createdAt: Date;
};

export type BuildSellerAnalyticsOptions = {
  now?: Date;
  purchases?: SellerAnalyticsPurchase[];
  likes?: SellerAnalyticsLike[];
};

function purchaseOnUtcDay(p: SellerAnalyticsPurchase): number {
  return utcDayStart(p.createdAt).getTime();
}

function purchaseInRange(
  p: SellerAnalyticsPurchase,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const t = purchaseOnUtcDay(p);
  return (
    t >= utcDayStart(rangeStart).getTime() && t <= utcDayStart(rangeEnd).getTime()
  );
}

function likeOnUtcDay(like: SellerAnalyticsLike): number {
  return utcDayStart(like.createdAt).getTime();
}

function likeInRange(
  like: SellerAnalyticsLike,
  rangeStart: Date,
  rangeEnd: Date,
): boolean {
  const t = likeOnUtcDay(like);
  return (
    t >= utcDayStart(rangeStart).getTime() && t <= utcDayStart(rangeEnd).getTime()
  );
}

function countLikesInRange(
  likes: SellerAnalyticsLike[],
  videoId: string,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return likes.filter(
    (l) => l.videoId === videoId && likeInRange(l, rangeStart, rangeEnd),
  ).length;
}

function listingPriceByVideoId(videos: Video[]): Map<string, number> {
  return new Map(videos.map((v) => [v.id, v.price]));
}

function purchaseRevenueGems(
  p: SellerAnalyticsPurchase,
  listingPrices: Map<string, number>,
): number {
  return normalizeStoredPurchaseGems(p.price, listingPrices.get(p.videoId) ?? 0);
}

function sumPurchaseRevenue(
  purchases: SellerAnalyticsPurchase[],
  listingPrices: Map<string, number>,
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return purchases
    .filter((p) => purchaseInRange(p, rangeStart, rangeEnd))
    .reduce((sum, p) => sum + purchaseRevenueGems(p, listingPrices), 0);
}

function countPurchasesInRange(
  purchases: SellerAnalyticsPurchase[],
  rangeStart: Date,
  rangeEnd: Date,
): number {
  return purchases.filter((p) => purchaseInRange(p, rangeStart, rangeEnd)).length;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

function chartShortDate(ymd: string): string {
  return ymd.slice(5).replace("-", "/");
}

function chartDayLabel(ymd: string): string {
  const dt = parseYmdToUtcNoon(ymd);
  if (!dt) return chartShortDate(ymd);
  return `${WEEKDAY_KO[dt.getUTCDay()]} ${chartShortDate(ymd)}`;
}

function chartBucketLabel(fromYmd: string, toYmd: string): string {
  const from = chartShortDate(fromYmd);
  const to = chartShortDate(toYmd);
  return from === to ? from : `${from}~${to}`;
}

/** 14일 이하: 일별, 한달: 7구간, 분기: 10, 1년: 12구간 */
function resolveRevenueBucketCount(periodDays: number): number {
  if (periodDays <= 14) return periodDays;
  if (periodDays <= 31) return 7;
  if (periodDays <= 90) return 10;
  return 12;
}

function dailyRevenueFromPurchases(
  purchases: SellerAnalyticsPurchase[],
  listingPrices: Map<string, number>,
  dayYmd: string,
): number {
  const day = parseYmdToUtcNoon(dayYmd);
  if (!day) return 0;
  return purchases
    .filter((p) => purchaseInRange(p, day, day))
    .reduce((sum, p) => sum + purchaseRevenueGems(p, listingPrices), 0);
}

function buildRevenueSeriesFromPurchases(
  purchases: SellerAnalyticsPurchase[],
  listingPrices: Map<string, number>,
  periodStart: Date,
  periodEnd: Date,
  periodDays: number,
): RevenueDayPoint[] {
  const days = enumerateDays(periodStart, periodEnd);
  if (days.length === 0) return [];

  if (periodDays <= 14) {
    return days.map((d) => ({
      label: chartDayLabel(d),
      revenueWon: Math.round(dailyRevenueFromPurchases(purchases, listingPrices, d)),
    }));
  }

  const bucketCount = Math.min(resolveRevenueBucketCount(periodDays), days.length);
  const out: RevenueDayPoint[] = [];
  const chunk = Math.ceil(days.length / bucketCount);
  for (let b = 0; b < bucketCount; b++) {
    const slice = days.slice(b * chunk, (b + 1) * chunk);
    let sub = 0;
    for (const d of slice) {
      sub += dailyRevenueFromPurchases(purchases, listingPrices, d);
    }
    const fromYmd = slice[0] ?? "";
    const toYmd = slice[slice.length - 1] ?? "";
    out.push({
      label: chartBucketLabel(fromYmd, toYmd),
      revenueWon: Math.round(sub),
    });
  }
  return out;
}

function ymd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseYmdToUtcNoon(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, mo, d] = s.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const t = Date.UTC(y, mo - 1, d, 12, 0, 0);
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysInclusive(start: Date, end: Date): number {
  const a = utcDayStart(start).getTime();
  const b = utcDayStart(end).getTime();
  return Math.floor((b - a) / 86_400_000) + 1;
}

function overlapInclusiveDays(
  rangeStart: Date,
  rangeEnd: Date,
  activeStart: Date,
  activeEnd: Date,
): number {
  const lo = Math.max(utcDayStart(rangeStart).getTime(), utcDayStart(activeStart).getTime());
  const hi = Math.min(utcDayStart(rangeEnd).getTime(), utcDayStart(activeEnd).getTime());
  if (lo > hi) return 0;
  return daysInclusive(new Date(lo), new Date(hi));
}

function lifetimeDaysInclusive(video: Video, today: Date): number {
  const created = utcDayStart(video.createdAt);
  const t = utcDayStart(today);
  return Math.max(1, daysInclusive(created, t));
}

function videoLifetimeRevenue(video: Video): number {
  return toGemPrice(video.price) * Math.max(0, video.salesCount);
}

/** 누적 매출·판매를 업로드 이후 일수로 균등 분배해 기간 내 추정치 계산 (이벤트 로그 없을 때) */
function estimatedRevenueInPeriod(
  video: Video,
  periodStart: Date,
  periodEnd: Date,
  today: Date,
): number {
  const life = lifetimeDaysInclusive(video, today);
  const rev = videoLifetimeRevenue(video);
  const overlap = overlapInclusiveDays(periodStart, periodEnd, video.createdAt, today);
  if (overlap <= 0) return 0;
  return rev * (overlap / life);
}

function estimatedSalesInPeriod(
  video: Video,
  periodStart: Date,
  periodEnd: Date,
  today: Date,
): number {
  const life = lifetimeDaysInclusive(video, today);
  const overlap = overlapInclusiveDays(periodStart, periodEnd, video.createdAt, today);
  if (overlap <= 0) return 0;
  return (video.salesCount * overlap) / life;
}

function estimatedViewsInPeriod(
  video: Video,
  periodStart: Date,
  periodEnd: Date,
  today: Date,
): number {
  const life = lifetimeDaysInclusive(video, today);
  const overlap = overlapInclusiveDays(periodStart, periodEnd, video.createdAt, today);
  if (overlap <= 0) return 0;
  return (video.views * overlap) / life;
}

function enumerateDays(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = utcDayStart(start);
  const endT = utcDayStart(end).getTime();
  while (cur.getTime() <= endT) {
    out.push(ymd(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function dailyRevenueForDay(
  videos: Video[],
  dayYmd: string,
  today: Date,
): number {
  const day = parseYmdToUtcNoon(dayYmd);
  if (!day) return 0;
  let sum = 0;
  for (const v of videos) {
    const life = lifetimeDaysInclusive(v, today);
    const rev = videoLifetimeRevenue(v);
    const one = overlapInclusiveDays(day, day, v.createdAt, today);
    if (one > 0) sum += rev / life;
  }
  return sum;
}

function buildRevenueSeries(
  videos: Video[],
  periodStart: Date,
  periodEnd: Date,
  periodDays: number,
  today: Date,
): RevenueDayPoint[] {
  const days = enumerateDays(periodStart, periodEnd);
  if (days.length === 0) return [];

  if (periodDays <= 14) {
    return days.map((d) => ({
      label: chartDayLabel(d),
      revenueWon: Math.round(dailyRevenueForDay(videos, d, today)),
    }));
  }

  const bucketCount = Math.min(resolveRevenueBucketCount(periodDays), days.length);
  const out: RevenueDayPoint[] = [];
  const chunk = Math.ceil(days.length / bucketCount);
  for (let b = 0; b < bucketCount; b++) {
    const slice = days.slice(b * chunk, (b + 1) * chunk);
    let sub = 0;
    for (const d of slice) {
      sub += dailyRevenueForDay(videos, d, today);
    }
    const fromYmd = slice[0] ?? "";
    const toYmd = slice[slice.length - 1] ?? "";
    out.push({
      label: chartBucketLabel(fromYmd, toYmd),
      revenueWon: Math.round(sub),
    });
  }
  return out;
}

function previousPeriod(
  start: Date,
  end: Date,
): { prevStart: Date; prevEnd: Date } {
  const len = daysInclusive(start, end);
  const prevEnd = utcDayStart(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd.getTime());
  prevStart.setUTCDate(prevStart.getUTCDate() - (len - 1));
  return { prevStart, prevEnd };
}

function computeGrowthPercent(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

function buildFunnel(
  totalImpressions: number,
  totalDetailViews: number,
  totalSales: number,
): FunnelStage[] {
  const ctr =
    totalImpressions > 0
      ? Math.min(100, (totalDetailViews / totalImpressions) * 100)
      : 0;
  const pSale =
    totalDetailViews > 0
      ? Math.min(100, (totalSales / totalDetailViews) * 100)
      : 0;
  const mid = Math.min(100, Math.sqrt((ctr / 100) * (pSale / 100)) * 100);
  return [
    { label: "노출", stepRatePercent: 100, funnelPercent: 100 },
    {
      label: "목록·피드 클릭",
      stepRatePercent: Math.round(ctr * 0.96),
      funnelPercent: Math.round(ctr * 0.96),
    },
    {
      label: "상세 보기",
      stepRatePercent: Math.round(ctr * 0.88),
      funnelPercent: Math.round(ctr * 0.9),
    },
    {
      label: "장바구니·찜",
      stepRatePercent: Math.round(mid),
      funnelPercent: Math.round(ctr * 0.42),
    },
    {
      label: "구매 완료",
      stepRatePercent: Math.round(pSale),
      funnelPercent: Math.round((ctr * pSale) / 100),
    },
  ];
}

function buildRetention(totalViews: number, totalSales: number): RetentionStep[] {
  const engagement =
    totalViews > 0
      ? Math.min(
          96,
          52 +
            44 *
              (1 -
                Math.exp(
                  -totalSales / Math.max(400, totalViews / 40),
                )),
        )
      : 40;
  return [
    { label: "처음 3초", audiencePercent: Math.min(100, Math.round(engagement + 6)) },
    { label: "3~15초", audiencePercent: Math.round(engagement) },
    { label: "15~30초", audiencePercent: Math.round(engagement * 0.82) },
    { label: "30초 이상", audiencePercent: Math.round(engagement * 0.64) },
    { label: "끝까지 시청", audiencePercent: Math.round(engagement * 0.45) },
  ];
}

function buildChannels(): TrafficChannel[] {
  return [
    {
      id: "app",
      label: "전체 유입",
      percent: 100,
      deltaPercentPoints: 0,
    },
  ];
}

export type AnalyticsRangeInput =
  | { kind: "preset"; days: number }
  | { kind: "custom"; start: string; end: string };

export function resolveAnalyticsRange(
  input: AnalyticsRangeInput,
  now = new Date(),
): {
  periodStart: Date;
  periodEnd: Date;
  periodDays: number;
  dateRange?: { start: string; end: string };
  periodLabel: string;
} {
  const today = utcDayStart(now);

  if (input.kind === "custom") {
    const a = parseYmdToUtcNoon(input.start);
    const b = parseYmdToUtcNoon(input.end);
    if (!a || !b || a > b) {
      return {
        periodStart: today,
        periodEnd: today,
        periodDays: 1,
        periodLabel: "최근 1일",
      };
    }
    const periodDays = Math.max(
      SELLER_ANALYTICS_MIN_DAYS,
      Math.min(SELLER_ANALYTICS_MAX_DAYS, daysInclusive(a, b)),
    );
    return {
      periodStart: a,
      periodEnd: b,
      periodDays,
      dateRange: { start: input.start, end: input.end },
      periodLabel: `${input.start.replace(/-/g, ". ")} – ${input.end.replace(/-/g, ". ")}`,
    };
  }

  const days = Math.max(
    SELLER_ANALYTICS_MIN_DAYS,
    Math.min(SELLER_ANALYTICS_MAX_DAYS, Math.floor(input.days)),
  );
  const periodEnd = new Date(today.getTime());
  const periodStart = new Date(today.getTime());
  periodStart.setUTCDate(periodStart.getUTCDate() - (days - 1));

  const periodLabel =
    days === 7
      ? "최근 7일"
      : days === 30
        ? "최근 한달"
        : days === 365
          ? "최근 1년"
          : `최근 ${days}일`;

  return { periodStart, periodEnd, periodDays: days, periodLabel };
}

export function buildSellerAnalyticsFromVideos(
  videos: Video[],
  input: AnalyticsRangeInput,
  options: BuildSellerAnalyticsOptions = {},
): SellerAnalyticsSnapshot {
  const now = options.now ?? new Date();
  const purchases = options.purchases ?? [];
  const likes = options.likes ?? [];
  const usePurchases = purchases.length > 0;
  const listingPrices = listingPriceByVideoId(videos);

  const { periodStart, periodEnd, periodDays, dateRange, periodLabel } =
    resolveAnalyticsRange(input, now);
  const { prevStart, prevEnd } = previousPeriod(periodStart, periodEnd);

  let periodRevenue = 0;
  let prevRevenue = 0;
  let periodSales = 0;
  let prevSales = 0;
  let periodViews = 0;
  let totalLifetimeSales = 0;
  let totalLifetimeViews = 0;
  let totalPriceWeight = 0;
  let avgSellingPrice = 0;

  if (usePurchases) {
    periodRevenue = sumPurchaseRevenue(purchases, listingPrices, periodStart, periodEnd);
    prevRevenue = sumPurchaseRevenue(purchases, listingPrices, prevStart, prevEnd);
    periodSales = countPurchasesInRange(purchases, periodStart, periodEnd);
    prevSales = countPurchasesInRange(purchases, prevStart, prevEnd);
    const periodPurchaseRows = purchases.filter((p) =>
      purchaseInRange(p, periodStart, periodEnd),
    );
    for (const v of videos) {
      totalLifetimeSales += v.salesCount;
      totalLifetimeViews += v.views;
    }
    if (periodPurchaseRows.length > 0) {
      const priceSum = periodPurchaseRows.reduce(
        (sum, p) => sum + (listingPrices.get(p.videoId) ?? 0),
        0,
      );
      avgSellingPrice = Math.round(priceSum / periodPurchaseRows.length);
    }
    periodViews = Math.round(periodSales * 95);
  } else {
    for (const v of videos) {
      periodRevenue += estimatedRevenueInPeriod(v, periodStart, periodEnd, now);
      prevRevenue += estimatedRevenueInPeriod(v, prevStart, prevEnd, now);
      periodSales += estimatedSalesInPeriod(v, periodStart, periodEnd, now);
      prevSales += estimatedSalesInPeriod(v, prevStart, prevEnd, now);
      periodViews += estimatedViewsInPeriod(v, periodStart, periodEnd, now);
      totalLifetimeSales += v.salesCount;
      totalLifetimeViews += v.views;
      totalPriceWeight += v.price * v.salesCount;
    }
    avgSellingPrice =
      totalLifetimeSales > 0 ? Math.round(totalPriceWeight / totalLifetimeSales) : 0;
  }

  const totalDetailViews = periodViews;
  const totalImpressions = Math.round(totalDetailViews * IMPRESSION_FACTOR);
  const ctrPercent =
    totalImpressions > 0
      ? Math.min(99.9, (totalDetailViews / totalImpressions) * 100)
      : 0;
  const purchaseConversionPercent =
    totalDetailViews > 0
      ? Math.min(100, (periodSales / totalDetailViews) * 100)
      : 0;

  const revenueByDay = usePurchases
    ? buildRevenueSeriesFromPurchases(
        purchases,
        listingPrices,
        periodStart,
        periodEnd,
        periodDays,
      )
    : buildRevenueSeries(videos, periodStart, periodEnd, periodDays, now);

  const rows: SellerVideoAnalyticsRow[] = videos
    .map((v) =>
      usePurchases
        ? buildSellerVideoRowFromPurchases(
            v,
            purchases,
            likes,
            listingPrices,
            periodStart,
            periodEnd,
            prevStart,
            prevEnd,
          )
        : buildSellerVideoRowFromDb(
            v,
            likes,
            periodStart,
            periodEnd,
            prevStart,
            prevEnd,
            now,
          ),
    )
    .sort((a, b) => b.cumulativeRevenueWon - a.cumulativeRevenueWon);

  return {
    periodLabel,
    dateRange,
    periodDays,
    totals: {
      cumulativeRevenueWon: Math.round(periodRevenue),
      revenueGrowthPercent: computeGrowthPercent(periodRevenue, prevRevenue),
      totalSalesCount: Math.round(periodSales),
      salesGrowthPercent: computeGrowthPercent(periodSales, prevSales),
      avgSellingPrice,
      totalImpressions,
      totalDetailViews: Math.round(totalDetailViews),
      ctrPercent,
      purchaseConversionPercent: Math.round(purchaseConversionPercent * 10) / 10,
    },
    revenueByDay,
    funnel: buildFunnel(totalImpressions, totalDetailViews, periodSales),
    channels: buildChannels(),
    retention: buildRetention(totalDetailViews, periodSales),
    videos: rows,
  };
}

function buildSellerVideoRowFromPurchases(
  v: Video,
  purchases: SellerAnalyticsPurchase[],
  likes: SellerAnalyticsLike[],
  listingPrices: Map<string, number>,
  periodStart: Date,
  periodEnd: Date,
  prevStart: Date,
  prevEnd: Date,
): SellerVideoAnalyticsRow {
  const forVideo = purchases.filter((p) => p.videoId === v.id);
  const pRev = sumPurchaseRevenue(forVideo, listingPrices, periodStart, periodEnd);
  const prevRev = sumPurchaseRevenue(forVideo, listingPrices, prevStart, prevEnd);
  const rowGrowth = computeGrowthPercent(pRev, prevRev);
  const periodSales = countPurchasesInRange(forVideo, periodStart, periodEnd);
  const periodViews = Math.round(periodSales * 95);

  const impressions = Math.round(periodViews * IMPRESSION_FACTOR);
  const ctrPercent =
    impressions > 0 ? Math.min(99.9, (periodViews / impressions) * 100) : 0;

  const avgWatchSec =
    v.durationSec != null && periodViews > 0
      ? Math.min(v.durationSec, Math.round(v.durationSec * 0.52))
      : v.durationSec ?? 0;
  const completionRate =
    periodViews > 0
      ? Math.min(
          99,
          Math.round(
            18 +
              82 *
                (1 -
                  Math.exp(
                    -periodSales / Math.max(30, periodViews / 80),
                  )),
          ),
        )
      : 0;

  return {
    videoId: v.id,
    title: v.title,
    poster: v.poster,
    priceWon: v.price,
    salesCount: periodSales,
    cumulativeRevenueWon: Math.round(pRev),
    totalViews: periodViews,
    totalLikes: countLikesInRange(likes, v.id, periodStart, periodEnd),
    growthPercent: rowGrowth,
    ctrPercent,
    impressions,
    avgWatchSec,
    completionRate,
  };
}

function buildSellerVideoRowFromDb(
  v: Video,
  likes: SellerAnalyticsLike[],
  periodStart: Date,
  periodEnd: Date,
  prevStart: Date,
  prevEnd: Date,
  now: Date,
): SellerVideoAnalyticsRow {
  const pRev = estimatedRevenueInPeriod(v, periodStart, periodEnd, now);
  const prevRev = estimatedRevenueInPeriod(v, prevStart, prevEnd, now);
  const rowGrowth = computeGrowthPercent(pRev, prevRev);
  const periodSales = Math.round(
    estimatedSalesInPeriod(v, periodStart, periodEnd, now),
  );
  const periodViews = Math.round(
    estimatedViewsInPeriod(v, periodStart, periodEnd, now),
  );
  const impressions = Math.round(periodViews * IMPRESSION_FACTOR);
  const ctrPercent =
    impressions > 0 ? Math.min(99.9, (periodViews / impressions) * 100) : 0;

  const avgWatchSec =
    v.durationSec != null && periodViews > 0
      ? Math.min(v.durationSec, Math.round(v.durationSec * 0.52))
      : v.durationSec ?? 0;
  const completionRate =
    periodViews > 0
      ? Math.min(
          99,
          Math.round(
            18 +
              82 *
                (1 -
                  Math.exp(
                    -periodSales / Math.max(30, periodViews / 80),
                  )),
          ),
        )
      : 0;

  return {
    videoId: v.id,
    title: v.title,
    poster: v.poster,
    priceWon: v.price,
    salesCount: periodSales,
    cumulativeRevenueWon: Math.round(pRev),
    totalViews: periodViews,
    totalLikes: countLikesInRange(likes, v.id, periodStart, periodEnd),
    growthPercent: rowGrowth,
    ctrPercent,
    impressions,
    avgWatchSec,
    completionRate,
  };
}

export function buildSellerVideoDetailFromDb(
  video: Video,
  input: AnalyticsRangeInput,
  options: BuildSellerAnalyticsOptions = {},
): SellerVideoDetailSnapshot {
  const now = options.now ?? new Date();
  const purchases = options.purchases ?? [];
  const likes = options.likes ?? [];
  const usePurchases = purchases.length > 0;
  const listingPrices = listingPriceByVideoId([video]);
  const forVideo = purchases.filter((p) => p.videoId === video.id);

  const { periodStart, periodEnd, periodDays, dateRange, periodLabel } =
    resolveAnalyticsRange(input, now);
  const { prevStart, prevEnd } = previousPeriod(periodStart, periodEnd);

  const row = usePurchases
    ? buildSellerVideoRowFromPurchases(
        video,
        forVideo,
        likes,
        listingPrices,
        periodStart,
        periodEnd,
        prevStart,
        prevEnd,
      )
    : buildSellerVideoRowFromDb(
        video,
        likes,
        periodStart,
        periodEnd,
        prevStart,
        prevEnd,
        now,
      );
  const periodRevenueWon = usePurchases
    ? Math.round(
        sumPurchaseRevenue(forVideo, listingPrices, periodStart, periodEnd),
      )
    : Math.round(estimatedRevenueInPeriod(video, periodStart, periodEnd, now));

  const revenueByDay = usePurchases
    ? buildRevenueSeriesFromPurchases(
        forVideo,
        listingPrices,
        periodStart,
        periodEnd,
        periodDays,
      )
    : buildRevenueSeries([video], periodStart, periodEnd, periodDays, now);

  const snap = buildSellerAnalyticsFromVideos([video], input, { now, purchases, likes });
  const pRev = usePurchases
    ? sumPurchaseRevenue(forVideo, listingPrices, periodStart, periodEnd)
    : estimatedRevenueInPeriod(video, periodStart, periodEnd, now);
  const prevRev = usePurchases
    ? sumPurchaseRevenue(forVideo, listingPrices, prevStart, prevEnd)
    : estimatedRevenueInPeriod(video, prevStart, prevEnd, now);

  const h = video.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  const hourlyAttention = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    weight: Math.round(
      12 +
        (row.totalViews / 24) * (0.65 + 0.35 * Math.sin((hour / 24) * Math.PI * 2)) +
        (h % 7),
    ),
  }));

  const m = 62 + (h % 5);
  const d = 24 + (h % 3);
  const t = 8;
  const tv = Math.max(0, 100 - m - d - t);
  const devices = [
    { id: "mobile", label: "모바일", percent: m },
    { id: "desktop", label: "데스크톱", percent: d },
    { id: "tablet", label: "태블릿", percent: t },
    { id: "tv", label: "TV·기타", percent: tv },
  ];

  const hashtagTerms =
    video.hashtags
      ?.split(/[,\s#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6) ?? [];
  const searchTerms = hashtagTerms.map((term, i) => ({
    term,
    sharePercent: Math.max(8, Math.round(28 - i * 4 + (h % 5))),
  }));

  return {
    videoId: video.id,
    title: video.title,
    poster: video.poster,
    periodLabel,
    periodDays,
    dateRange,
    row,
    periodRevenueWon,
    revenueByDay,
    funnel: snap.funnel,
    channels: snap.channels,
    retention: snap.retention,
    devices,
    hourlyAttention,
    searchTerms: searchTerms.length > 0 ? searchTerms : [{ term: "(태그 없음)", sharePercent: 100 }],
    revenueMomPercent: computeGrowthPercent(pRev, prevRev),
    viewsMomPercent: computeGrowthPercent(
      estimatedViewsInPeriod(video, periodStart, periodEnd, now),
      estimatedViewsInPeriod(video, prevStart, prevEnd, now),
    ),
  };
}

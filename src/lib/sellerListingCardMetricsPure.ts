import type { FeedVideo } from "@/data/videos";
import type { TrendingRankMetrics } from "@/data/trendingStats";

/** 카드 하단 지표 — DB·정산 기준(성장률은 시계열 없으면 0). 클라이언트 번들에서도 안전(Prisma 미사용). */
export function metricsForSellerListingCard(
  video: FeedVideo,
  extra: { revenueWon: number; likes: number },
): TrendingRankMetrics {
  const totalViews = Math.max(0, Math.floor(video.listing?.views ?? 0));
  return {
    cumulativeRevenueWon: Math.max(0, Math.floor(extra.revenueWon)),
    totalViews,
    totalLikes: Math.max(0, Math.floor(extra.likes)),
    growthPercent: 0,
  };
}

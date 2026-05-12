import type { FeedVideo } from "@/data/videos";
import type { TrendingRankMetrics } from "@/data/trendingStats";
import { prisma } from "@/lib/prisma";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";
import { metricsForSellerListingCard } from "@/lib/sellerListingCardMetricsPure";

export { metricsForSellerListingCard };

/**
 * 판매자가 올린 목록용: `Video.views` + `SellerEarning` 누적 + Supabase `favorites`(like).
 */
export async function listingMetricsPayloadForFeeds(
  videos: FeedVideo[],
): Promise<Record<string, TrendingRankMetrics>> {
  const out: Record<string, TrendingRankMetrics> = {};
  const ids = [...new Set(videos.map((v) => v.id).filter(Boolean))];
  if (ids.length === 0) return out;

  const revenueByVideo = new Map<string, number>();
  try {
    const grouped = await prisma.sellerEarning.groupBy({
      by: ["videoId"],
      where: { videoId: { in: ids } },
      _sum: { netAmount: true },
    });
    for (const row of grouped) {
      revenueByVideo.set(row.videoId, row._sum.netAmount ?? 0);
    }
  } catch {
    /* DB 미연결 등 */
  }

  const likesByVideo = new Map<string, number>();
  try {
    const admin = getSupabaseServiceRoleClient();
    if (admin) {
      const { data } = await admin
        .from(supabaseTables.favorites)
        .select("video_id")
        .eq("kind", "like")
        .in("video_id", ids);
      for (const row of data ?? []) {
        const vid = typeof (row as { video_id?: unknown }).video_id === "string"
          ? (row as { video_id: string }).video_id
          : "";
        if (!vid) continue;
        likesByVideo.set(vid, (likesByVideo.get(vid) ?? 0) + 1);
      }
    }
  } catch {
    /* Supabase 미설정 */
  }

  for (const v of videos) {
    out[v.id] = metricsForSellerListingCard(v, {
      revenueWon: revenueByVideo.get(v.id) ?? 0,
      likes: likesByVideo.get(v.id) ?? 0,
    });
  }
  return out;
}

import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";
import type { SellerAnalyticsLike } from "@/lib/sellerAnalyticsFromDb";

/**
 * 판매자 영상별 좋아요 이벤트 — Supabase `favorites` (kind = like).
 * 서비스 롤이 없으면 빈 배열(분석 표에는 0).
 */
export async function loadSellerVideoLikes(
  videoIds: string[],
): Promise<SellerAnalyticsLike[]> {
  const ids = [...new Set(videoIds.filter(Boolean))];
  if (ids.length === 0) return [];

  const admin = getSupabaseServiceRoleClient();
  if (!admin) return [];

  try {
    const { data, error } = await admin
      .from(supabaseTables.favorites)
      .select("video_id, created_at")
      .eq("kind", "like")
      .in("video_id", ids);

    if (error) return [];

    return (data ?? [])
      .map((row) => {
        const videoId =
          typeof (row as { video_id?: unknown }).video_id === "string"
            ? (row as { video_id: string }).video_id
            : "";
        const createdRaw = (row as { created_at?: unknown }).created_at;
        const createdAt =
          typeof createdRaw === "string" || createdRaw instanceof Date
            ? new Date(createdRaw)
            : null;
        if (!videoId || !createdAt || Number.isNaN(createdAt.getTime())) return null;
        return { videoId, createdAt };
      })
      .filter((row): row is SellerAnalyticsLike => row != null);
  } catch {
    return [];
  }
}

import type { FeedVideo } from "@/data/videos";
import {
  getSellerNickname,
  getVideosBySellerHandle,
  normalizeSellerHandle,
} from "@/data/videoCatalog";
import { ensureProfileSellerBioColumn } from "@/lib/ensureProfileSellerBioColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { getSupabaseServiceRoleClient } from "@/lib/supabaseServiceRole";
import { supabaseTables } from "@/lib/supabaseTableNames";

function isProbablySellerUserId(key: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    key,
  );
}

/** Display name for seller `<title>` (matches seller page fallbacks). */
export async function resolveSellerDisplayNameForSeo(
  handleRaw: string,
): Promise<string> {
  let sellerKey = handleRaw.trim();
  try {
    sellerKey = decodeURIComponent(handleRaw).trim();
  } catch {
    sellerKey = handleRaw.trim();
  }
  if (!sellerKey) return "ARA";

  let profileNickname: string | null = null;
  try {
    await ensureProfileSellerBioColumn();
    const admin = getSupabaseServiceRoleClient();
    if (admin) {
      const { data } = await admin
        .from(supabaseTables.profiles)
        .select("nickname")
        .eq("user_id", sellerKey)
        .maybeSingle();
      const row = (data ?? null) as { nickname?: string | null } | null;
      profileNickname = row?.nickname?.trim() || null;
    }
  } catch {
    profileNickname = null;
  }

  let videos: FeedVideo[] = [];
  try {
    const rows = await prisma.video.findMany({
      where: { sellerId: sellerKey },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    videos = rows.map(videoRowToFeedVideo);
  } catch {
    videos = [];
  }

  if (videos.length > 0) {
    return profileNickname || getSellerNickname(videos[0].creator);
  }

  const normalized = normalizeSellerHandle(sellerKey);
  const local = getVideosBySellerHandle(normalized);
  if (local.length > 0) {
    return profileNickname || getSellerNickname(local[0].creator);
  }

  if (profileNickname) return profileNickname;
  if (isProbablySellerUserId(sellerKey)) return sellerKey.slice(0, 8);
  return sellerKey;
}

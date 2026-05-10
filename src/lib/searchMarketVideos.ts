import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

function matchesCatalogVideo(v: FeedVideo, needle: string): boolean {
  const n = needle.toLowerCase();
  if (v.title.toLowerCase().includes(n)) return true;
  if (v.creator.toLowerCase().includes(n)) return true;
  if (v.description?.toLowerCase().includes(n)) return true;
  if (v.hashtags?.toLowerCase().includes(n)) return true;
  return false;
}

/**
 * 마켓 카탈로그 + Prisma `videos` 테이블에서 제목·설명·해시태그·크리에이터를 검색합니다.
 */
export async function searchMarketVideos(rawQuery: string): Promise<FeedVideo[]> {
  const q = rawQuery.trim();
  if (!q) return [];

  const catalogMatches = ALL_MARKET_VIDEOS.filter((v) => matchesCatalogVideo(v, q));

  let dbMatches: FeedVideo[] = [];
  try {
    const rows = await prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { hashtags: { contains: q, mode: "insensitive" } },
          { creator: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 80,
      orderBy: { updatedAt: "desc" },
    });
    dbMatches = rows.map(videoRowToFeedVideo);
  } catch {
    /* DB 미설정·연결 실패 시 카탈로그만 */
  }

  const seen = new Set<string>();
  const merged: FeedVideo[] = [];
  for (const v of dbMatches) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    merged.push(v);
  }
  for (const v of catalogMatches) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    merged.push(v);
  }
  return merged;
}

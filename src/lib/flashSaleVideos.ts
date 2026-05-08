import type { Video } from "@prisma/client";
import type { FeedVideo } from "../data/videos";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";
import { prisma } from "./prisma";

export function videoRowToFeedVideo(v: Video): FeedVideo {
  const baseOrientation =
    v.orientation === "landscape" ? "landscape" : "portrait";
  const base: FeedVideo = {
    id: v.id,
    title: v.title,
    creator: v.creator,
    src: v.src,
    poster: v.poster,
    orientation: baseOrientation,
    priceWon: v.price,
    durationSec: v.durationSec ?? undefined,
    isAiGenerated: v.isAiGenerated,
    description: v.description ?? undefined,
    hashtags: v.hashtags ?? undefined,
    category: v.category ?? undefined,
    listing: {
      sellerId: v.sellerId,
      views: v.views,
      salesCount: v.salesCount,
      createdAtMs: v.createdAt.getTime(),
      category: v.category ?? undefined,
    },
    processedVideoUrl: v.processedVideoUrl ?? undefined,
    processedVideoStatus: v.processedVideoStatus ?? undefined,
    processedVideoError: v.processedVideoError ?? undefined,
  };

  const ext = parseExternalMediaUrl(v.src);
  if (!ext) return base;

  const key = ext.canonicalKey;
  const merged: FeedVideo = {
    ...base,
    sourcePageUrl: ext.pageUrl,
    ...(ext.provider === "tiktok"
      ? { tiktokEmbedId: key }
      : ext.provider === "youtube"
        ? { youtubeVideoId: key }
        : { instagramShortcode: key }),
  };

  if (ext.provider === "youtube") {
    merged.poster = `https://img.youtube.com/vi/${key}/maxresdefault.jpg`;
    if (/\/shorts\//i.test(v.src)) merged.orientation = "portrait";
  } else {
    merged.poster = `/api/embed/poster?url=${encodeURIComponent(ext.pageUrl)}`;
    merged.orientation = "portrait";
  }

  return merged;
}

/** 수락 후 끌올·플래시 세일 노출 중인 조각 */
export async function getFlashSaleVideos(limit = 24): Promise<Video[]> {
  const t = new Date();
  return prisma.video.findMany({
    where: { flashSaleUntil: { gt: t } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

/** DB 미설정·경로 오류 시 홈 500 방지 */
export async function getFlashSaleVideosSafe(limit = 24): Promise<Video[]> {
  try {
    return await getFlashSaleVideos(limit);
  } catch {
    return [];
  }
}

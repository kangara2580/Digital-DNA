import type { Video } from "@prisma/client";
import type { FeedVideo } from "../data/videos";
import { prisma } from "./prisma";

export function videoRowToFeedVideo(v: Video): FeedVideo {
  return {
    id: v.id,
    title: v.title,
    creator: v.creator,
    src: v.src,
    poster: v.poster,
    orientation: v.orientation === "landscape" ? "landscape" : "portrait",
    priceWon: v.price,
    durationSec: v.durationSec ?? undefined,
  };
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

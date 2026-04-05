import { prisma } from "./prisma";
import {
  buildPriceSuggestionBody,
  priceSuggestionTitle,
  TYPE_PRICE_SUGGEST,
} from "@/lib/notificationsCopy";
import { computeSuggestedPriceKrw, utcDayKey } from "@/lib/suggestedPrice";

const STALE_DAYS = 7;
const MIN_VIEWS = 100;

export type ScanStaleResult = {
  scanned: number;
  created: number;
  skipped: number;
};

/**
 * 등록 7일 경과 · 조회 100+ · 판매 0건 영상에 대해 미처리 가격 제안 알림을 만듭니다.
 */
export async function scanStaleListings(now = new Date()): Promise<ScanStaleResult> {
  const cutoff = new Date(now.getTime() - STALE_DAYS * 86400000);
  const dayKey = utcDayKey(now);

  const candidates = await prisma.video.findMany({
    where: {
      createdAt: { lt: cutoff },
      views: { gte: MIN_VIEWS },
      salesCount: 0,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const video of candidates) {
    const existing = await prisma.notification.findFirst({
      where: {
        videoId: video.id,
        type: TYPE_PRICE_SUGGEST,
        status: "PENDING",
      },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const newPrice = computeSuggestedPriceKrw(video.price, video.id, dayKey);
    if (newPrice >= video.price) {
      skipped += 1;
      continue;
    }

    await prisma.notification.create({
      data: {
        sellerId: video.sellerId,
        type: TYPE_PRICE_SUGGEST,
        title: priceSuggestionTitle(),
        body: buildPriceSuggestionBody(video, newPrice),
        videoId: video.id,
        oldPrice: video.price,
        newPrice,
        read: false,
        status: "PENDING",
      },
    });
    created += 1;
  }

  return { scanned: candidates.length, created, skipped };
}

import type { Video } from "@prisma/client";
import { getMarketVideoById } from "@/data/videoCommerce";

/** 마켓에서 신규 구매가 가능한 상태(상세·결제 플로우와 동일 기준). */
export function isPurchasableMarketListing(
  videoId: string,
  row: Pick<Video, "status"> | null,
): boolean {
  if (row) return row.status === "approved";
  return Boolean(getMarketVideoById(videoId));
}

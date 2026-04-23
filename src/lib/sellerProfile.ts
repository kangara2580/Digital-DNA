import type { FeedVideo } from "@/data/videos";
import { getSellerNickname, normalizeSellerHandle } from "@/data/videoCatalog";

type SellerSource = Pick<FeedVideo, "creator" | "listing">;

export function sellerHandleFromVideo(video: SellerSource): string {
  const sellerId = video.listing?.sellerId?.trim();
  if (sellerId) return sellerId;
  return normalizeSellerHandle(video.creator);
}

export function sellerProfileHrefFromVideo(video: SellerSource): string {
  const handle = sellerHandleFromVideo(video);
  return `/seller/${encodeURIComponent(handle)}`;
}

export function sellerDisplayNameFromVideo(video: SellerSource): string {
  return getSellerNickname(video.creator);
}

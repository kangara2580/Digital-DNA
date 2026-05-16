import type { FeedVideo } from "@/data/videos";
import { getSellerNickname, normalizeSellerHandle } from "@/data/videoCatalog";
import { buildNotionistsAvatarUrl } from "@/data/reelsAvatarPresets";

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

/** 판매자 피드·카드용 프로필 이미지 URL (업로드 전 Notionists 시드) */
export function sellerAvatarUrlFromVideo(video: SellerSource): string {
  return buildNotionistsAvatarUrl(sellerDisplayNameFromVideo(video));
}

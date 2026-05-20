import type { FeedVideo } from "@/data/videos";
import { getSellerNickname, normalizeSellerHandle } from "@/data/videoCatalog";
import type { AppProfile } from "@/lib/supabaseProfiles";
import {
  profileColorFromSeed,
  resolveStoredProfileColor,
} from "@/lib/profileColorSpectrum";

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

/** 판매자 피드·카드용 프로필 색상(hex) */
export function sellerProfileColorFromVideo(video: SellerSource): string {
  return profileColorFromSeed(sellerHandleFromVideo(video));
}

export function sellerProfileColorFromRecord(
  record: Pick<AppProfile, "avatar_kind" | "avatar_seed" | "user_id"> | null,
  fallbackSeed: string,
): string {
  return resolveStoredProfileColor(
    record?.avatar_kind,
    record?.avatar_seed,
    fallbackSeed || record?.user_id || "reels-market",
  );
}

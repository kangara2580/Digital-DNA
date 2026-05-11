import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import type { FeedVideo } from "@/data/videos";

export type CatalogVideoForSync = FeedVideo & {
  catalogSource: "market_catalog" | "external_rank";
};

export function getAllCatalogVideosForSync(): CatalogVideoForSync[] {
  const merged = new Map<string, CatalogVideoForSync>();

  for (const video of ALL_MARKET_VIDEOS) {
    merged.set(video.id, { ...video, catalogSource: "market_catalog" });
  }

  for (const video of manualTikTokRankingToFeedVideos(getTikTokManualRanking())) {
    merged.set(video.id, { ...video, catalogSource: "external_rank" });
  }

  return [...merged.values()];
}

export function getExternalProvider(video: FeedVideo): string | null {
  if (video.tiktokEmbedId) return "tiktok";
  if (video.youtubeVideoId) return "youtube";
  if (video.instagramShortcode) return "instagram";
  return null;
}

export function getExternalKey(video: FeedVideo): string | null {
  return video.tiktokEmbedId ?? video.youtubeVideoId ?? video.instagramShortcode ?? null;
}

import {
  ALL_MARKET_VIDEOS,
  getVideoCatalogMeta,
  getVideosForCategory,
  type CategorySlug,
} from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { shuffleVideos } from "@/data/videos";
import { ensureVideoCategoryColumn } from "@/lib/ensureVideoCategoryColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";
import { sellUploadRequiresAdminReview } from "@/lib/sellUploadModeration";

const DB_TIMEOUT_MS = 5000;

/** 자동 승인 모드일 때 예전 pending 업로드도 한 번에 approved 로 맞춤 */
async function ensureLegacyPendingVideosApproved(): Promise<void> {
  if (sellUploadRequiresAdminReview()) return;
  try {
    await prisma.video.updateMany({
      where: { status: "pending" },
      data: {
        status: "approved",
        moderationReason: null,
        approvedAt: new Date(),
        approvedBy: "system:auto-legacy",
      },
    });
  } catch {
    /* ignore */
  }
}

export function newestFeedTimestampMs(video: FeedVideo): number {
  const uploadedAt = video.listing?.createdAtMs;
  if (typeof uploadedAt === "number" && Number.isFinite(uploadedAt) && uploadedAt > 0) {
    return uploadedAt;
  }
  const catalogTime = Date.parse(getVideoCatalogMeta(video.id).listedAt);
  return Number.isFinite(catalogTime) ? catalogTime : 0;
}

export function mergeFeedVideosWithDedupe(
  primary: FeedVideo[],
  secondary: FeedVideo[],
): FeedVideo[] {
  const seen = new Set<string>();
  const merged: FeedVideo[] = [];
  for (const video of primary) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  for (const video of secondary) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  return merged;
}

async function withDbTimeout<T>(work: Promise<T>): Promise<T> {
  return await Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("db_timeout")), DB_TIMEOUT_MS);
    }),
  ]);
}

export async function fetchApprovedDbFeedVideos(options?: {
  categorySlug?: CategorySlug;
  take?: number;
}): Promise<FeedVideo[]> {
  const take = options?.take ?? 240;
  await ensureLegacyPendingVideosApproved();
  await withDbTimeout(ensureVideoCategoryColumn());
  const slug = options?.categorySlug;
  const rows = await withDbTimeout(
    prisma.video.findMany({
      where:
        !slug || slug === "latest"
          ? { status: "approved" }
          : { status: "approved", category: slug },
      orderBy: { createdAt: "desc" },
      take,
    }),
  );
  return rows.map(videoRowToFeedVideo);
}

/** 탐색·쇼핑몰 — DB 판매 등록분 + 기존 카탈로그 */
export async function buildExplorePoolAsync(): Promise<FeedVideo[]> {
  const staticBest = getVideosForCategory("best");
  const staticPortrait = staticBest.filter((v) => v.orientation === "portrait");
  const staticBase =
    staticPortrait.length > 0
      ? staticPortrait
      : ALL_MARKET_VIDEOS.filter((v) => v.orientation === "portrait");
  const staticFallback =
    staticBase.length > 0 ? staticBase : [...ALL_MARKET_VIDEOS];

  try {
    const dbVideos = await fetchApprovedDbFeedVideos({ take: 240 });
    const merged = mergeFeedVideosWithDedupe(dbVideos, staticFallback);
    return shuffleVideos(merged);
  } catch {
    return shuffleVideos([...staticFallback]);
  }
}

export async function fetchCategoryFeedVideos(slug: CategorySlug): Promise<FeedVideo[]> {
  const staticVideos =
    slug === "latest" ? [...ALL_MARKET_VIDEOS] : getVideosForCategory(slug);
  try {
    const dbVideos = await fetchApprovedDbFeedVideos({ categorySlug: slug });
    return mergeFeedVideosWithDedupe(dbVideos, staticVideos).sort(
      (a, b) => newestFeedTimestampMs(b) - newestFeedTimestampMs(a),
    );
  } catch {
    return staticVideos;
  }
}

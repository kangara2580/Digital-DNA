import { NextResponse } from "next/server";
import { ALL_MARKET_VIDEOS, getVideoCatalogMeta, sortVideosByNewest } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { ensureVideoCategoryColumn } from "@/lib/ensureVideoCategoryColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function newestTimestampMs(video: FeedVideo): number {
  const uploadedAt = video.listing?.createdAtMs;
  if (typeof uploadedAt === "number" && Number.isFinite(uploadedAt) && uploadedAt > 0) {
    return uploadedAt;
  }
  const catalogTime = Date.parse(getVideoCatalogMeta(video.id).listedAt);
  return Number.isFinite(catalogTime) ? catalogTime : 0;
}

function mergeLatestVideos(dbVideos: FeedVideo[]): FeedVideo[] {
  const seen = new Set<string>();
  const merged: FeedVideo[] = [];

  // DB 업로드를 우선 반영하고, 없는 id만 카탈로그에서 채웁니다.
  for (const video of dbVideos) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  for (const video of ALL_MARKET_VIDEOS) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }

  return merged.sort((a, b) => newestTimestampMs(b) - newestTimestampMs(a));
}

export async function GET() {
  const staticSorted = sortVideosByNewest(ALL_MARKET_VIDEOS);
  try {
    await ensureVideoCategoryColumn();
    const rows = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 240,
    });
    const dbVideos = rows.map(videoRowToFeedVideo);
    return NextResponse.json(
      { ok: true, videos: mergeLatestVideos(dbVideos) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    // DB 장애 시에도 최신 카테고리 자체가 깨지지 않도록 카탈로그 폴백
    return NextResponse.json(
      { ok: true, videos: staticSorted },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

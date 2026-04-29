import { NextRequest, NextResponse } from "next/server";
import {
  ALL_MARKET_VIDEOS,
  CATEGORY_SLUGS,
  getVideoCatalogMeta,
  getVideosForCategory,
} from "@/data/videoCatalog";
import type { CategorySlug } from "@/data/videoCatalog";
import type { FeedVideo } from "@/data/videos";
import { ensureVideoCategoryColumn } from "@/lib/ensureVideoCategoryColumn";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const DB_TIMEOUT_MS = 1200;

function newestTimestampMs(video: FeedVideo): number {
  const uploadedAt = video.listing?.createdAtMs;
  if (typeof uploadedAt === "number" && Number.isFinite(uploadedAt) && uploadedAt > 0) {
    return uploadedAt;
  }
  const catalogTime = Date.parse(getVideoCatalogMeta(video.id).listedAt);
  return Number.isFinite(catalogTime) ? catalogTime : 0;
}

function mergeWithDedupe(dbVideos: FeedVideo[], staticVideos: FeedVideo[]): FeedVideo[] {
  const seen = new Set<string>();
  const merged: FeedVideo[] = [];
  for (const video of dbVideos) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  for (const video of staticVideos) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    merged.push(video);
  }
  return merged;
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    work,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("db_timeout")), timeoutMs);
    }),
  ]);
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() as CategorySlug | undefined;
  if (!slug || !CATEGORY_SLUGS.includes(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  const staticVideos =
    slug === "latest" ? [...ALL_MARKET_VIDEOS] : getVideosForCategory(slug);

  try {
    await withTimeout(ensureVideoCategoryColumn(), DB_TIMEOUT_MS);
    const rows = await withTimeout(
      prisma.video.findMany({
        where:
          slug === "latest"
            ? undefined
            : {
                category: slug,
              },
        orderBy: { createdAt: "desc" },
        take: 240,
      }),
      DB_TIMEOUT_MS,
    );
    const dbVideos = rows.map(videoRowToFeedVideo);
    const videos = mergeWithDedupe(dbVideos, staticVideos).sort(
      (a, b) => newestTimestampMs(b) - newestTimestampMs(a),
    );
    return NextResponse.json(
      { ok: true, videos },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: true, videos: staticVideos },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

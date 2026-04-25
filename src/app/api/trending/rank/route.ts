import { NextRequest, NextResponse } from "next/server";
import {
  FAILURE_OOPS_CLIPS,
  LOCAL_TRENDING_FEED_VIDEOS,
  SAMPLE_VIDEOS,
  type FeedVideo,
} from "@/data/videos";
import {
  getTikTokManualRanking,
  manualTikTokRankingToFeedVideos,
} from "@/data/tiktokData";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 30;

function scoreTrending(video: FeedVideo): number {
  const salesCount = video.listing?.salesCount ?? 0;
  const views = video.listing?.views ?? 0;
  const priceWon = video.priceWon ?? 0;
  const revenueWon = Math.max(0, salesCount * priceWon);
  const createdAtMs = video.listing?.createdAtMs ?? 0;
  const ageDays =
    createdAtMs > 0
      ? Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60 * 24))
      : 180;
  const freshnessBoost = Math.max(0, 14 - ageDays) * 200;
  return revenueWon * 100 + salesCount * 5000 + views * 15 + freshnessBoost;
}

function dedupePush(
  out: FeedVideo[],
  seen: Set<string>,
  list: FeedVideo[],
  limit: number,
) {
  for (const video of list) {
    if (out.length >= limit) return;
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    out.push(video);
  }
}

function fallbackSamples(limit: number): FeedVideo[] {
  const seed = [
    ...manualTikTokRankingToFeedVideos(getTikTokManualRanking()),
    ...LOCAL_TRENDING_FEED_VIDEOS,
    ...SAMPLE_VIDEOS,
    ...FAILURE_OOPS_CLIPS,
  ];
  const out: FeedVideo[] = [];
  const seen = new Set<string>();
  dedupePush(out, seen, seed, limit);
  return out.slice(0, limit);
}

export async function GET(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.max(1, Math.min(MAX_LIMIT, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT));

  const fallback = fallbackSamples(limit);
  try {
    const dbRows = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 240,
    });
    const dbVideos = dbRows
      .map(videoRowToFeedVideo)
      .sort((a, b) => scoreTrending(b) - scoreTrending(a));

    const out: FeedVideo[] = [];
    const seen = new Set<string>();
    dedupePush(out, seen, dbVideos, limit);
    dedupePush(out, seen, fallback, limit);

    return NextResponse.json(
      {
        ok: true,
        items: out.slice(0, limit),
        source: {
          dbCount: dbVideos.length,
          fallbackCount: fallback.length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        ok: true,
        items: fallback,
        source: {
          dbCount: 0,
          fallbackCount: fallback.length,
          fallbackOnly: true,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

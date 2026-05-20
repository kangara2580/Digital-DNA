import { NextResponse } from "next/server";
import { sortVideosByNewest, ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { fetchCategoryFeedVideos } from "@/lib/publicMarketFeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const staticSorted = sortVideosByNewest(ALL_MARKET_VIDEOS);
  try {
    const videos = await fetchCategoryFeedVideos("latest");
    return NextResponse.json(
      { ok: true, videos },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: true, videos: staticSorted },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

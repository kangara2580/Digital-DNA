import { NextRequest, NextResponse } from "next/server";
import { CATEGORY_SLUGS, getVideosForCategory } from "@/data/videoCatalog";
import type { CategorySlug } from "@/data/videoCatalog";
import { fetchCategoryFeedVideos } from "@/lib/publicMarketFeed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() as CategorySlug | undefined;
  if (!slug || !CATEGORY_SLUGS.includes(slug)) {
    return NextResponse.json({ ok: false, error: "invalid_slug" }, { status: 400 });
  }

  try {
    const videos = await fetchCategoryFeedVideos(slug);
    return NextResponse.json(
      { ok: true, videos },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    const staticVideos = getVideosForCategory(slug);
    return NextResponse.json(
      { ok: true, videos: staticVideos },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

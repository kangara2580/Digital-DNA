import { NextRequest, NextResponse } from "next/server";
import {
  searchBackgroundWithFallback,
  type BackgroundSearchMode,
} from "@/lib/videoFetcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 글로벌 검색용 통합 엔드포인트.
 * GET /api/videos?q=...
 * GET /api/videos?theme=...
 * GET /api/videos?mode=image|video
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const theme = request.nextUrl.searchParams.get("theme")?.trim() ?? "";
  const seed = Number(request.nextUrl.searchParams.get("seed") ?? "0") || 0;
  const modeParam = request.nextUrl.searchParams.get("mode");
  const mode: BackgroundSearchMode = modeParam === "image" ? "image" : "video";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "80") || 80;
  const limit = Math.max(10, Math.min(80, limitRaw));
  const keyword = q || theme;

  if (!keyword) {
    return NextResponse.json({ error: "q_or_theme_required" }, { status: 400 });
  }

  try {
    const items = await searchBackgroundWithFallback(keyword, limit, seed, mode);
    return NextResponse.json({ keyword, mode, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "video_search_unknown_error";
    return NextResponse.json(
      { error: "video_search_failed", message },
      { status: 500 },
    );
  }
}

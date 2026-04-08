import { NextRequest, NextResponse } from "next/server";
import {
  searchBackgroundWithFallback,
  type BackgroundSearchMode,
} from "@/lib/videoFetcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/video?q=space
 * GET /api/video?theme=ocean
 *
 * - 클라이언트는 q(자유 검색어) 또는 theme(테마 키워드)를 보낼 수 있습니다.
 * - 서버에서 Pexels를 먼저 조회하고, 실패/결과없음이면 Pixabay로 fallback 합니다.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const theme = request.nextUrl.searchParams.get("theme")?.trim() ?? "";
  const seed = Number(request.nextUrl.searchParams.get("seed") ?? "0") || 0;
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "80") || 80;
  const limit = Math.max(10, Math.min(80, limitRaw));
  const modeParam = request.nextUrl.searchParams.get("mode");
  const mode: BackgroundSearchMode = modeParam === "image" ? "image" : "video";
  const keyword = q || theme;

  if (!keyword) {
    return NextResponse.json({ error: "q_or_theme_required" }, { status: 400 });
  }

  try {
    console.log("[api/video] keyword:", keyword, "seed:", seed, "mode:", mode);
    const items = await searchBackgroundWithFallback(keyword, limit, seed, mode);
    return NextResponse.json({
      keyword,
      mode,
      items,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "video_search_unknown_error";
    return NextResponse.json(
      { error: "video_search_failed", message },
      { status: 500 },
    );
  }
}


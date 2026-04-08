import { NextRequest, NextResponse } from "next/server";
import {
  searchBackgroundWithFallback,
  type BackgroundSearchMode,
} from "@/lib/videoFetcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * /api/pexels/videos 경로와 동일 기능의 별칭(alias) 라우트.
 * 경로 불일치 상황에서도 안전하게 동작하도록 유지합니다.
 */
export async function GET(request: NextRequest) {
  const theme = request.nextUrl.searchParams.get("theme")?.trim() ?? "";
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const seed = Number(request.nextUrl.searchParams.get("seed") ?? "0") || 0;
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "80") || 80;
  const limit = Math.max(10, Math.min(80, limitRaw));
  const modeParam = request.nextUrl.searchParams.get("mode");
  const mode: BackgroundSearchMode = modeParam === "image" ? "image" : "video";
  const keyword = q || theme;
  if (!keyword) {
    return NextResponse.json({ error: "theme_or_q_required" }, { status: 400 });
  }

  try {
    const items = await searchBackgroundWithFallback(keyword, limit, seed, mode);
    return NextResponse.json({ theme: keyword, mode, items });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "video_search_unknown_error";
    return NextResponse.json(
      { error: "video_search_failed", message },
      { status: 500 },
    );
  }
}

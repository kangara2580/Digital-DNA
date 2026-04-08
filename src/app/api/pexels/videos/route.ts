import { NextRequest, NextResponse } from "next/server";
import {
  searchBackgroundWithFallback,
  type BackgroundSearchMode,
} from "@/lib/videoFetcher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/pexels/videos?theme=space
 * - 클라이언트는 이 API만 호출하고,
 * - 서버에서 Pexels -> Pixabay 순으로 fallback 검색합니다.
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
  console.log("[api/pexels/videos] hit", {
    theme,
    q,
    keyword,
    seed,
    mode,
    hasPexels:
      Boolean(process.env.PEXELS_API_KEY?.trim()) ||
      Boolean(process.env.NEXT_PUBLIC_PEXELS_API_KEY?.trim()),
    hasPixabay:
      Boolean(process.env.PIXABAY_API_KEY?.trim()) ||
      Boolean(process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.trim()),
  });
  if (!keyword) {
    return NextResponse.json({ error: "theme_or_q_required" }, { status: 400 });
  }

  try {
    console.log("[api/pexels/videos] keyword:", keyword, "seed:", seed, "limit:", limit);
    const items = await searchBackgroundWithFallback(keyword, limit, seed, mode);
    return NextResponse.json({
      theme: keyword,
      mode,
      items:
        mode === "video"
          ? (items as Array<{ id: string; width: number; height: number; source: string; videoUrl: string }>).map(
              (x) => ({
                ...x,
                videoUrl: x.videoUrl,
              }),
            )
          : (items as Array<{ id: string; width: number; height: number; source: string; imageUrl: string }>).map(
              (x) => ({
                ...x,
                imageUrl: x.imageUrl,
              }),
            ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "pexels_unknown_error";
    return NextResponse.json(
      {
        error: "video_search_failed",
        message,
      },
      { status: 500 },
    );
  }
}

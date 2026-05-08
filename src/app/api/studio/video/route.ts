import { NextResponse } from "next/server";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * 창작 스튜디오(`/create`) — 마켓 비디오 ID(cuid)로 DB에서 피드용 JSON 로드.
 * 정적 카탈로그(`getMarketVideoById`)에 없는 업로드 분량용.
 */
export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("videoId")?.trim();
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "videoId가 필요합니다." }, { status: 400 });
  }

  try {
    const row = await prisma.video.findUnique({ where: { id: videoId } });
    if (!row) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, video: videoRowToFeedVideo(row) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

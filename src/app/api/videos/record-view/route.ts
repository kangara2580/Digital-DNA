import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_VIDEO_ID_LEN = 160;

/**
 * 승인된 마켓 영상 상세 조회 1회당 `videos.views` +1 (세션당 1회는 클라이언트에서 중복 호출 방지).
 * 외부 임베드 ID(`tiktok-` 등)는 DB에 없어 반영되지 않습니다.
 */
export async function POST(req: Request) {
  let body: { videoId?: unknown } = {};
  try {
    body = (await req.json()) as { videoId?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
  if (!videoId || videoId.length > MAX_VIDEO_ID_LEN) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const result = await prisma.video.updateMany({
      where: { id: videoId, status: "approved" },
      data: { views: { increment: 1 } },
    });
    return NextResponse.json({ ok: true, updated: result.count });
  } catch {
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }
}

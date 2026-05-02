import { NextResponse } from "next/server";
import { getVideosBySellerHandle, normalizeSellerHandle } from "@/data/videoCatalog";
import { prisma } from "@/lib/prisma";

/**
 * 판매자 페이지와 동일한 순서(DB: createdAt desc, 로컬: 카탈로그 목록 순)로 id만 반환.
 */
export async function GET(req: Request) {
  const handle = new URL(req.url).searchParams.get("handle")?.trim() ?? "";
  if (!handle) {
    return NextResponse.json({ ok: false, error: "handle_required" }, { status: 400 });
  }

  let videoIds: string[] = [];
  try {
    const rows = await prisma.video.findMany({
      where: { sellerId: handle },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true },
    });
    videoIds = rows.map((r) => r.id);
  } catch {
    videoIds = [];
  }

  if (videoIds.length === 0) {
    videoIds = getVideosBySellerHandle(normalizeSellerHandle(handle)).map((v) => v.id);
  }

  return NextResponse.json({ ok: true, videoIds });
}

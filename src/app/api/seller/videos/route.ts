import { NextResponse } from "next/server";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 1200;

async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

/**
 * GET /api/seller/videos?sellerId=xxx&exclude=videoId
 * 특정 판매자(sellerId)의 공개 판매 영상 목록 (인증 불필요)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get("sellerId")?.trim();
  const exclude = searchParams.get("exclude")?.trim();

  if (!sellerId) {
    return NextResponse.json({ ok: false, error: "missing_sellerId" }, { status: 400 });
  }

  try {
    const rows = await withTimeout(
      prisma.video.findMany({
        where: { sellerId, ...(exclude ? { id: { not: exclude } } : {}) },
        orderBy: { createdAt: "desc" },
        take: 60,
      }),
      DB_TIMEOUT_MS,
    );
    const videos = rows.map(videoRowToFeedVideo);
    return NextResponse.json({ ok: true, videos });
  } catch {
    return NextResponse.json({ ok: false, videos: [] });
  }
}

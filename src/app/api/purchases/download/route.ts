import { NextResponse } from "next/server";
import { getMarketVideoById } from "@/data/videoCommerce";
import { prisma } from "@/lib/prisma";
import { hasPaidPurchase } from "@/lib/purchases";
import { getCurrentUser } from "@/lib/serverSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFilename(title: string, videoId: string): string {
  const base =
    title
      .trim()
      .replace(/[^\w\uac00-\ud7a3.-]+/g, "_")
      .slice(0, 80) || `video-${videoId.slice(0, 12)}`;
  return base.endsWith(".mp4") ? base : `${base}.mp4`;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId")?.trim();
  if (!videoId) {
    return NextResponse.json({ error: "missing_video_id" }, { status: 400 });
  }

  const paid = await hasPaidPurchase({ userId: user.id, videoId });
  if (!paid) {
    return NextResponse.json({ error: "not_purchased" }, { status: 403 });
  }

  const row = await prisma.video.findUnique({
    where: { id: videoId },
    select: { title: true, src: true, processedVideoUrl: true },
  });
  const feed = getMarketVideoById(videoId);
  const downloadUrl =
    (row?.processedVideoUrl && row.processedVideoUrl.trim()) ||
    row?.src?.trim() ||
    (feed?.processedVideoUrl && feed.processedVideoUrl.trim()) ||
    feed?.src?.trim() ||
    "";

  if (!downloadUrl) {
    return NextResponse.json({ error: "no_source" }, { status: 404 });
  }

  try {
    const upstream = await fetch(downloadUrl, { redirect: "follow" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
    }

    const title = row?.title?.trim() || feed?.title || videoId;
    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() || "video/mp4";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename(title, videoId)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}

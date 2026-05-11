import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", videoIds: [] },
      { status: 401 },
    );
  }

  const [entitlements, purchases] = await Promise.all([
    prisma.userEntitlement.findMany({
      where: {
        userId: user.id,
        sourceType: "video",
        status: "active",
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      select: { sourceId: true },
    }),
    prisma.purchase.findMany({
      where: {
        buyerId: user.id,
        status: "paid",
      },
      select: { videoId: true },
    }),
  ]);

  const videoIds = Array.from(
    new Set([
      ...entitlements.map((item) => item.sourceId),
      ...purchases.map((item) => item.videoId),
    ]),
  );

  const videos =
    videoIds.length === 0
      ? []
      : await prisma.video.findMany({
          where: { id: { in: videoIds } },
          select: { id: true, title: true },
        });
  const titleById = new Map(videos.map((v) => [v.id, v.title]));

  const items = videoIds.map((videoId) => ({
    videoId,
    title: titleById.get(videoId) ?? videoId,
  }));
  items.sort((a, b) => a.title.localeCompare(b.title, "ko"));

  return NextResponse.json({ ok: true, videoIds, items });
}

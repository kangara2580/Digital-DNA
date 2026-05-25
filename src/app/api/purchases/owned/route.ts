import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import { getMarketVideoById } from "@/data/videoCommerce";
import type { FeedVideo } from "@/data/videos";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { isPurchasableMarketListing } from "@/lib/purchasedListingAvailability";

export const dynamic = "force-dynamic";

function placeholderFeed(videoId: string, title: string): FeedVideo {
  return {
    id: videoId,
    title,
    creator: "—",
    src: "/videos/sample1.mp4",
    poster: `https://picsum.photos/seed/${encodeURIComponent(videoId)}/720/1280`,
    orientation: "portrait",
    priceWon: 0,
    listing: { sellerId: "unknown", views: 0, salesCount: 0 },
  };
}

export async function GET() {
  try {
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
      select: { sourceId: true, createdAt: true },
    }),
    prisma.purchase.findMany({
      where: {
        buyerId: user.id,
        status: "paid",
      },
      select: { videoId: true, createdAt: true, price: true },
    }),
  ]);

  const videoIds = Array.from(
    new Set([
      ...entitlements.map((item) => item.sourceId),
      ...purchases.map((item) => item.videoId),
    ]),
  );

  const acquiredAtMs = new Map<string, number>();
  const bump = (videoId: string, at: Date) => {
    const t = at.getTime();
    const prev = acquiredAtMs.get(videoId);
    if (prev === undefined || t > prev) acquiredAtMs.set(videoId, t);
  };
  for (const row of purchases) bump(row.videoId, row.createdAt);
  for (const row of entitlements) bump(row.sourceId, row.createdAt);

  const paidLatest = new Map<string, { price: number; at: number }>();
  for (const p of purchases) {
    const t = p.createdAt.getTime();
    const prev = paidLatest.get(p.videoId);
    if (!prev || t > prev.at) {
      paidLatest.set(p.videoId, { price: p.price, at: t });
    }
  }

  const videoRows =
    videoIds.length === 0
      ? []
      : await prisma.video.findMany({
          where: { id: { in: videoIds } },
        });
  const rowById = new Map(videoRows.map((r) => [r.id, r]));

  const items = videoIds.map((videoId) => {
    const row = rowById.get(videoId) ?? null;
    const catalog = getMarketVideoById(videoId);
    const feed: FeedVideo = row
      ? videoRowToFeedVideo(row)
      : catalog
        ? { ...catalog }
        : placeholderFeed(videoId, videoId);

    const listPriceWon = row?.price ?? feed.priceWon ?? 0;
    const paidPriceWon = paidLatest.get(videoId)?.price ?? listPriceWon;
    const listedForSale = isPurchasableMarketListing(videoId, row);

    return {
      videoId,
      title: feed.title,
      acquiredAt: acquiredAtMs.get(videoId) ?? 0,
      paidPriceWon,
      listPriceWon,
      listedForSale,
      feed,
    };
  });

    return NextResponse.json({ ok: true, videoIds, items });
  } catch (err) {
    console.error("[purchases/owned]", err);
    return NextResponse.json({ ok: false, error: "internal_server_error" }, { status: 500 });
  }
}

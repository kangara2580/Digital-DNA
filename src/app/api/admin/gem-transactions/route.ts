import { NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getAdminAccess();
  if (!access.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    // Recent credit ledger entries (all types: purchase, spend, seller_earning, refund)
    const ledger = await prisma.creditLedger.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        balanceAfter: true,
        reason: true,
        metadataJson: true,
        createdAt: true,
      },
    });

    // Recent purchases with video and buyer info
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        videoId: true,
        price: true,
        status: true,
        createdAt: true,
      },
    });

    // Resolve user identities
    const allUserIds = [
      ...new Set([
        ...ledger.map((l) => l.userId),
        ...purchases.map((p) => p.buyerId),
        ...purchases.map((p) => p.sellerId),
      ]),
    ];

    const profiles =
      allUserIds.length > 0
        ? await prisma.$queryRaw<
            { user_id: string; email: string | null; nickname: string | null }[]
          >`
            SELECT user_id::text, email, nickname
            FROM public.profiles
            WHERE user_id::text = ANY(${allUserIds})
          `.catch(() => [])
        : [];

    const profileMap = new Map(
      profiles.map((p) => [p.user_id, { email: p.email, nickname: p.nickname }]),
    );

    // Resolve video titles
    const videoIds = [...new Set(purchases.map((p) => p.videoId))];
    const videos =
      videoIds.length > 0
        ? await prisma.video
            .findMany({
              where: { id: { in: videoIds } },
              select: { id: true, title: true },
            })
            .catch(() => [])
        : [];
    const videoMap = new Map(videos.map((v) => [v.id, v.title]));

    // Seller earnings summary
    const earningsSummary = await prisma.sellerEarning.groupBy({
      by: ["status"],
      _sum: { netAmount: true, grossAmount: true, platformFee: true },
      _count: { _all: true },
    });

    return NextResponse.json({
      ledger: ledger.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        userLabel:
          profileMap.get(l.userId)?.nickname ??
          profileMap.get(l.userId)?.email ??
          l.userId.slice(0, 8),
      })),
      purchases: purchases.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        buyerLabel:
          profileMap.get(p.buyerId)?.nickname ??
          profileMap.get(p.buyerId)?.email ??
          p.buyerId.slice(0, 8),
        sellerLabel:
          profileMap.get(p.sellerId)?.nickname ??
          profileMap.get(p.sellerId)?.email ??
          p.sellerId.slice(0, 8),
        videoTitle: videoMap.get(p.videoId) ?? p.videoId,
      })),
      earningsSummary: earningsSummary.map((e) => ({
        status: e.status,
        count: e._count._all,
        netAmount: e._sum.netAmount ?? 0,
        grossAmount: e._sum.grossAmount ?? 0,
        platformFee: e._sum.platformFee ?? 0,
      })),
    });
  } catch (err) {
    console.error("[admin/gem-transactions]", err);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

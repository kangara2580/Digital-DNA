import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import { getUserCreditBalance } from "@/lib/credits";
import { toGemPrice, PLATFORM_FEE_BPS } from "@/lib/gemPrice";
import { settlementHoldDays } from "@/lib/tossConfig";

export const dynamic = "force-dynamic";

type Body = {
  videoIds?: string[];
};

function availableAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + settlementHoldDays());
  return date;
}

/**
 * POST /api/videos/purchase-batch
 * Cart batch purchase — atomically purchase multiple videos with gems.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "login_required", loginUrl: "/login" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as Body | null;
    const videoIds = body?.videoIds;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "video_ids_required" },
        { status: 400 },
      );
    }

    if (videoIds.length > 50) {
      return NextResponse.json(
        { ok: false, error: "too_many_items" },
        { status: 400 },
      );
    }

    // Deduplicate
    const uniqueIds = [...new Set(videoIds.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: "video_ids_required" },
        { status: 400 },
      );
    }

    // Fetch all videos
    const videos = await prisma.video.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        status: true,
      },
    });

    const videoMap = new Map(videos.map((v) => [v.id, v]));

    // Validate all videos
    const errors: Array<{ videoId: string; error: string }> = [];
    for (const id of uniqueIds) {
      const video = videoMap.get(id);
      if (!video) {
        errors.push({ videoId: id, error: "not_found" });
        continue;
      }
      if (video.status !== "approved") {
        errors.push({ videoId: id, error: "not_available" });
        continue;
      }
      if (video.sellerId === user.id) {
        errors.push({ videoId: id, error: "own_video" });
        continue;
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { ok: false, error: "validation_failed", details: errors },
        { status: 400 },
      );
    }

    // Check already purchased
    const existingPurchases = await prisma.purchase.findMany({
      where: {
        buyerId: user.id,
        videoId: { in: uniqueIds },
        status: "paid",
      },
      select: { videoId: true },
    });
    const alreadyOwned = new Set(existingPurchases.map((p) => p.videoId));

    // Filter out already owned — skip them silently
    const toBuy = uniqueIds.filter((id) => !alreadyOwned.has(id));
    if (toBuy.length === 0) {
      return NextResponse.json({
        ok: true,
        purchased: [],
        skipped: uniqueIds.map((id) => ({ videoId: id, reason: "already_owned" })),
        totalGems: 0,
        message: "all_already_purchased",
      });
    }

    // Calculate total gem cost
    const purchaseItems = toBuy.map((id) => {
      const video = videoMap.get(id)!;
      const gemPrice = toGemPrice(video.price);
      const platformFee = Math.floor((gemPrice * PLATFORM_FEE_BPS) / 10000);
      const sellerNet = Math.max(0, gemPrice - platformFee);
      return { video, gemPrice, platformFee, sellerNet };
    });

    const totalGems = purchaseItems.reduce((sum, item) => sum + item.gemPrice, 0);

    // Check buyer balance
    const balance = await getUserCreditBalance(user.id);
    if (balance < totalGems) {
      return NextResponse.json(
        {
          ok: false,
          error: "insufficient_credits",
          required: totalGems,
          balance,
          itemCount: purchaseItems.length,
        },
        { status: 402 },
      );
    }

    // Execute all purchases in a single atomic transaction
    const holdDate = availableAt();
    const result = await prisma.$transaction(async (tx) => {
      // Verify balance inside transaction
      const balanceRow = await tx.userCreditBalance.findUnique({
        where: { userId: user.id },
        select: { balance: true },
      });
      const currentBalance = balanceRow?.balance ?? 0;
      if (currentBalance < totalGems) {
        throw new Error("insufficient_credits");
      }

      const purchaseResults: Array<{
        purchaseId: string;
        videoId: string;
        videoTitle: string;
        gemPrice: number;
        platformFee: number;
        sellerNet: number;
      }> = [];

      // Deduct total from buyer at once
      const updatedBuyer = await tx.userCreditBalance.update({
        where: { userId: user.id },
        data: { balance: { decrement: totalGems } },
        select: { balance: true },
      });

      // Create buyer ledger entry for total spend
      await tx.creditLedger.create({
        data: {
          userId: user.id,
          type: "spend",
          amount: -totalGems,
          balanceAfter: updatedBuyer.balance,
          reason: `장바구니 일괄 구매 (${purchaseItems.length}건)`,
          metadataJson: {
            batchPurchase: true,
            itemCount: purchaseItems.length,
            totalGems,
            videoIds: purchaseItems.map((item) => item.video.id),
          },
        },
      });

      // Process each video purchase
      for (const item of purchaseItems) {
        const { video, gemPrice, platformFee, sellerNet } = item;

        // Create purchase record
        const purchase = await tx.purchase.create({
          data: {
            buyerId: user.id,
            sellerId: video.sellerId,
            videoId: video.id,
            price: gemPrice,
            status: "paid",
          },
        });

        // Create entitlement
        await tx.userEntitlement.upsert({
          where: {
            userId_sourceType_sourceId: {
              userId: user.id,
              sourceType: "video",
              sourceId: video.id,
            },
          },
          create: {
            userId: user.id,
            sourceType: "video",
            sourceId: video.id,
            purchaseId: purchase.id,
            status: "active",
          },
          update: {
            purchaseId: purchase.id,
            status: "active",
            revokedAt: null,
          },
        });

        // Increment sales count
        await tx.video.update({
          where: { id: video.id },
          data: { salesCount: { increment: 1 } },
        });

        // Record seller earning
        await tx.sellerEarning.create({
          data: {
            sellerId: video.sellerId,
            buyerId: user.id,
            purchaseId: purchase.id,
            videoId: video.id,
            grossAmount: gemPrice,
            platformFee,
            netAmount: sellerNet,
            feeRateBps: PLATFORM_FEE_BPS,
            status: "pending",
            availableAt: holdDate,
          },
        });

        // Record platform fee
        await tx.platformFee.create({
          data: {
            purchaseId: purchase.id,
            sellerId: video.sellerId,
            amount: platformFee,
            currency: "GEM",
            feeRateBps: PLATFORM_FEE_BPS,
            status: "earned",
          },
        });

        // Add seller credits
        const updatedSeller = await tx.userCreditBalance.upsert({
          where: { userId: video.sellerId },
          create: { userId: video.sellerId, balance: sellerNet },
          update: { balance: { increment: sellerNet } },
          select: { balance: true },
        });

        // Seller ledger entry
        await tx.creditLedger.create({
          data: {
            userId: video.sellerId,
            type: "seller_earning",
            amount: sellerNet,
            balanceAfter: updatedSeller.balance,
            reason: `판매 수익: ${video.title}`,
            metadataJson: {
              purchaseId: purchase.id,
              videoId: video.id,
              videoTitle: video.title,
              buyerId: user.id,
              grossAmount: gemPrice,
              platformFee,
              netAmount: sellerNet,
              batchPurchase: true,
            },
          },
        });

        purchaseResults.push({
          purchaseId: purchase.id,
          videoId: video.id,
          videoTitle: video.title,
          gemPrice,
          platformFee,
          sellerNet,
        });
      }

      return {
        purchases: purchaseResults,
        buyerBalance: updatedBuyer.balance,
      };
    });

    return NextResponse.json({
      ok: true,
      purchased: result.purchases,
      skipped: [...alreadyOwned].map((id) => ({ videoId: id, reason: "already_owned" })),
      totalGems,
      balance: result.buyerBalance,
      itemCount: result.purchases.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown_error";

    if (message === "insufficient_credits") {
      return NextResponse.json(
        { ok: false, error: "insufficient_credits" },
        { status: 402 },
      );
    }

    console.error("[videos/purchase-batch]", err);
    return NextResponse.json(
      { ok: false, error: "internal_server_error" },
      { status: 500 },
    );
  }
}

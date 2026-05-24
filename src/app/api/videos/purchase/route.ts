import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import { getUserCreditBalance, spendCreditsForPurchase, addSellerCredits } from "@/lib/credits";
import { toGemPrice, PLATFORM_FEE_BPS } from "@/lib/gemPrice";
import { calculatePlatformFee } from "@/lib/commerceLedger";
import { settlementHoldDays } from "@/lib/tossConfig";

export const dynamic = "force-dynamic";

type Body = {
  videoId?: string;
};

function availableAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + settlementHoldDays());
  return date;
}

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
    const videoId = body?.videoId?.trim();

    if (!videoId) {
      return NextResponse.json(
        { ok: false, error: "video_id_required" },
        { status: 400 },
      );
    }

    // Find the video
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        id: true,
        title: true,
        price: true,
        sellerId: true,
        status: true,
        salesCount: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { ok: false, error: "video_not_found" },
        { status: 404 },
      );
    }

    if (video.status !== "approved") {
      return NextResponse.json(
        { ok: false, error: "video_not_available" },
        { status: 400 },
      );
    }

    // Can't buy your own video
    if (video.sellerId === user.id) {
      return NextResponse.json(
        { ok: false, error: "cannot_buy_own_video" },
        { status: 400 },
      );
    }

    // Check if already purchased
    const existing = await prisma.purchase.findFirst({
      where: {
        buyerId: user.id,
        videoId: video.id,
        status: "paid",
      },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "already_purchased" },
        { status: 409 },
      );
    }

    // Calculate gem price
    const gemPrice = toGemPrice(video.price);
    if (gemPrice <= 0) {
      return NextResponse.json(
        { ok: false, error: "invalid_price" },
        { status: 400 },
      );
    }

    // Check balance
    const balance = await getUserCreditBalance(user.id);
    if (balance < gemPrice) {
      return NextResponse.json(
        {
          ok: false,
          error: "insufficient_credits",
          required: gemPrice,
          balance,
        },
        { status: 402 },
      );
    }

    // Execute purchase in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          buyerId: user.id,
          sellerId: video.sellerId,
          videoId: video.id,
          price: gemPrice,
          status: "paid",
        },
      });

      // 2. Create entitlement
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

      // 3. Increment sales count
      await tx.video.update({
        where: { id: video.id },
        data: { salesCount: { increment: 1 } },
      });

      // 4. Calculate fees (in gems)
      const feeRateBps = PLATFORM_FEE_BPS;
      const platformFee = Math.floor((gemPrice * feeRateBps) / 10000);
      const sellerNet = Math.max(0, gemPrice - platformFee);

      // 5. Record seller earning (in gems)
      await tx.sellerEarning.create({
        data: {
          sellerId: video.sellerId,
          buyerId: user.id,
          purchaseId: purchase.id,
          videoId: video.id,
          grossAmount: gemPrice,
          platformFee,
          netAmount: sellerNet,
          feeRateBps,
          status: "pending",
          availableAt: availableAt(),
        },
      });

      // 6. Record platform fee (in gems)
      await tx.platformFee.create({
        data: {
          purchaseId: purchase.id,
          sellerId: video.sellerId,
          amount: platformFee,
          currency: "GEM",
          feeRateBps,
          status: "earned",
        },
      });

      // 7. Deduct buyer credits
      const balanceRow = await tx.userCreditBalance.findUnique({
        where: { userId: user.id },
        select: { balance: true },
      });
      const currentBalance = balanceRow?.balance ?? 0;
      if (currentBalance < gemPrice) {
        throw new Error("insufficient_credits");
      }

      const updatedBuyer = await tx.userCreditBalance.update({
        where: { userId: user.id },
        data: { balance: { decrement: gemPrice } },
        select: { balance: true },
      });

      await tx.creditLedger.create({
        data: {
          userId: user.id,
          type: "spend",
          amount: -gemPrice,
          balanceAfter: updatedBuyer.balance,
          reason: `영상 구매: ${video.title}`,
          metadataJson: {
            purchaseId: purchase.id,
            videoId: video.id,
            videoTitle: video.title,
            sellerId: video.sellerId,
            gemPrice,
            platformFee,
            sellerNet,
          },
        },
      });

      // 8. Add seller credits (net after platform fee)
      const updatedSeller = await tx.userCreditBalance.upsert({
        where: { userId: video.sellerId },
        create: { userId: video.sellerId, balance: sellerNet },
        update: { balance: { increment: sellerNet } },
        select: { balance: true },
      });

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
          },
        },
      });

      return {
        purchaseId: purchase.id,
        gemPrice,
        platformFee,
        sellerNet,
        buyerBalance: updatedBuyer.balance,
      };
    });

    return NextResponse.json({
      ok: true,
      purchaseId: result.purchaseId,
      gemPrice: result.gemPrice,
      platformFee: result.platformFee,
      sellerNet: result.sellerNet,
      balance: result.buyerBalance,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown_error";

    if (message === "insufficient_credits") {
      return NextResponse.json(
        { ok: false, error: "insufficient_credits" },
        { status: 402 },
      );
    }

    console.error("[videos/purchase]", err);
    return NextResponse.json(
      { ok: false, error: "internal_server_error" },
      { status: 500 },
    );
  }
}

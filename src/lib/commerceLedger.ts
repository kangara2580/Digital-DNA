import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { settlementHoldDays, platformFeeRateBps } from "@/lib/tossConfig";
import type { TossConfirmResponse } from "@/lib/tossPayments";
import { toJsonValue } from "@/lib/tossPayments";

export function calculatePlatformFee(grossAmount: number): {
  feeRateBps: number;
  platformFee: number;
  netAmount: number;
} {
  const feeRateBps = platformFeeRateBps();
  const platformFee = Math.floor((grossAmount * feeRateBps) / 10000);
  return {
    feeRateBps,
    platformFee,
    netAmount: Math.max(0, grossAmount - platformFee),
  };
}

function availableAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + settlementHoldDays());
  return date;
}

export async function createPendingPayment(params: {
  userId: string;
  userEmail: string | null;
  orderId: string;
  orderName: string;
  productType: "credits" | "video" | "cart";
  productKey: string;
  amount: number;
  credits?: number;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.payment.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      provider: "toss",
      providerOrderId: params.orderId,
      orderName: params.orderName,
      productType: params.productType,
      productKey: params.productKey,
      status: "pending",
      amountCents: params.amount,
      currency: "KRW",
      credits: params.credits ?? 0,
      targetId: params.targetId,
      metadataJson: params.metadata ?? Prisma.JsonNull,
    },
  });
}

export async function applyTossConfirmedPayment(params: {
  orderId: string;
  paymentKey: string;
  amount: number;
  tossPayment: TossConfirmResponse;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { providerOrderId: params.orderId },
    });

    if (!payment) {
      throw new Error(`Payment order not found: ${params.orderId}`);
    }
    if (payment.provider !== "toss") {
      throw new Error(`Payment provider mismatch: ${payment.provider}`);
    }
    if (payment.amountCents !== params.amount) {
      throw new Error(
        `Payment amount mismatch. expected=${payment.amountCents} actual=${params.amount}`,
      );
    }

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        provider: "toss",
        eventType: "confirm",
        orderId: params.orderId,
        paymentKey: params.paymentKey,
        status: params.tossPayment.status,
        rawJson: toJsonValue(params.tossPayment),
      },
    });

    if (payment.status === "paid") {
      return tx.payment.findUniqueOrThrow({ where: { id: payment.id } });
    }

    const paidPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentKey: params.paymentKey,
        status: "paid",
        amountCents: params.tossPayment.totalAmount ?? payment.amountCents,
        currency: params.tossPayment.currency ?? "KRW",
        providerRawJson: toJsonValue(params.tossPayment),
        paidAt: params.tossPayment.approvedAt
          ? new Date(params.tossPayment.approvedAt)
          : new Date(),
      },
    });

    if (paidPayment.productType === "credits") {
      const existingCredit = await tx.creditLedger.findUnique({
        where: {
          paymentId_type: {
            paymentId: paidPayment.id,
            type: "purchase",
          },
        },
      });

      if (!existingCredit && paidPayment.credits > 0) {
        const balance = await tx.userCreditBalance.upsert({
          where: { userId: paidPayment.userId },
          create: { userId: paidPayment.userId, balance: paidPayment.credits },
          update: { balance: { increment: paidPayment.credits } },
          select: { balance: true },
        });

        await tx.creditLedger.create({
          data: {
            userId: paidPayment.userId,
            paymentId: paidPayment.id,
            type: "purchase",
            amount: paidPayment.credits,
            balanceAfter: balance.balance,
            reason: `Toss ${paidPayment.productKey} credit pack`,
            metadataJson: {
              provider: "toss",
              orderId: params.orderId,
              paymentKey: params.paymentKey,
            },
          },
        });
      }
    }

    async function grantVideoPurchase(videoId: string, amount: number) {
      const video = await tx.video.findUnique({
        where: { id: videoId },
        select: { id: true, sellerId: true, price: true },
      });

      if (!video) {
        throw new Error(`Video not found for payment target: ${videoId}`);
      }

      let purchase = await tx.purchase.findFirst({
        where: {
          buyerId: paidPayment.userId,
          videoId: video.id,
          status: "paid",
        },
      });

      if (!purchase) {
        purchase = await tx.purchase.create({
          data: {
            buyerId: paidPayment.userId,
            sellerId: video.sellerId,
            videoId: video.id,
            price: amount,
            status: "paid",
          },
        });

        await tx.video.update({
          where: { id: video.id },
          data: {
            salesCount: { increment: 1 },
          },
        });
      }

      await tx.userEntitlement.upsert({
        where: {
          userId_sourceType_sourceId: {
            userId: paidPayment.userId,
            sourceType: "video",
            sourceId: video.id,
          },
        },
        create: {
          userId: paidPayment.userId,
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

      const existingEarning = await tx.sellerEarning.findUnique({
        where: { purchaseId: purchase.id },
      });

      if (!existingEarning) {
        const fee = calculatePlatformFee(amount);
        await tx.sellerEarning.create({
          data: {
            sellerId: video.sellerId,
            buyerId: paidPayment.userId,
            purchaseId: purchase.id,
            paymentId: paidPayment.id,
            videoId: video.id,
            grossAmount: amount,
            platformFee: fee.platformFee,
            netAmount: fee.netAmount,
            feeRateBps: fee.feeRateBps,
            status: "pending",
            availableAt: availableAt(),
          },
        });

        await tx.platformFee.create({
          data: {
            paymentId: paidPayment.id,
            purchaseId: purchase.id,
            sellerId: video.sellerId,
            amount: fee.platformFee,
            currency: "KRW",
            feeRateBps: fee.feeRateBps,
            status: "earned",
          },
        });
      }
    }

    if (paidPayment.productType === "video" && paidPayment.targetId) {
      await grantVideoPurchase(paidPayment.targetId, paidPayment.amountCents);
    }

    if (paidPayment.productType === "cart") {
      const metadata =
        paidPayment.metadataJson && typeof paidPayment.metadataJson === "object"
          ? (paidPayment.metadataJson as Record<string, unknown>)
          : {};
      const items = Array.isArray(metadata.items)
        ? metadata.items
            .map((item) => {
              if (!item || typeof item !== "object") return null;
              const row = item as { videoId?: unknown; price?: unknown };
              const videoId = typeof row.videoId === "string" ? row.videoId : "";
              const price = Number(row.price);
              if (!videoId || !Number.isFinite(price) || price <= 0) return null;
              return { videoId, price };
            })
            .filter((item): item is { videoId: string; price: number } => item != null)
        : [];

      if (items.length === 0) {
        throw new Error(`Cart payment has no payable items: ${paidPayment.id}`);
      }

      for (const item of items) {
        await grantVideoPurchase(item.videoId, item.price);
      }
    }

    return paidPayment;
  });
}

export async function getSellerSettlementSummary(sellerId: string) {
  const [available, pending, requested, paid] = await Promise.all([
    prisma.sellerEarning.aggregate({
      where: { sellerId, status: "pending", availableAt: { lte: new Date() } },
      _sum: { netAmount: true },
    }),
    prisma.sellerEarning.aggregate({
      where: { sellerId, status: "pending", availableAt: { gt: new Date() } },
      _sum: { netAmount: true },
    }),
    prisma.sellerEarning.aggregate({
      where: { sellerId, status: "settlement_requested" },
      _sum: { netAmount: true },
    }),
    prisma.sellerEarning.aggregate({
      where: { sellerId, status: "paid" },
      _sum: { netAmount: true },
    }),
  ]);

  return {
    availableAmount: available._sum.netAmount ?? 0,
    pendingAmount: pending._sum.netAmount ?? 0,
    requestedAmount: requested._sum.netAmount ?? 0,
    paidAmount: paid._sum.netAmount ?? 0,
  };
}

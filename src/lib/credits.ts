import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getUserCreditBalance(userId: string): Promise<number> {
  const row = await prisma.userCreditBalance.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return row?.balance ?? 0;
}

export async function getUserCreditSummary(userId: string) {
  const [balanceRow, ledger, payments] = await Promise.all([
    prisma.userCreditBalance.findUnique({
      where: { userId },
      select: { balance: true, updatedAt: true },
    }),
    prisma.creditLedger.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        reason: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        provider: true,
        productKey: true,
        status: true,
        amountCents: true,
        currency: true,
        credits: true,
        createdAt: true,
        paidAt: true,
      },
    }),
  ]);

  const balance = balanceRow?.balance ?? 0;

  return {
    balance,
    balanceUpdatedAt: balanceRow?.updatedAt ?? null,
    ledger,
    payments,
  };
}

/**
 * Spend credits for a video purchase.
 * Deducts from buyer, records ledger entry.
 * Returns the new balance and ledger entry.
 */
export async function spendCreditsForPurchase(params: {
  userId: string;
  amount: number;
  purchaseId: string;
  videoId: string;
  videoTitle: string;
  sellerId: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (params.amount <= 0) {
    throw new Error("Spend amount must be positive.");
  }

  return prisma.$transaction(async (tx) => {
    // Check current balance
    const balanceRow = await tx.userCreditBalance.findUnique({
      where: { userId: params.userId },
      select: { balance: true },
    });

    const currentBalance = balanceRow?.balance ?? 0;
    if (currentBalance < params.amount) {
      throw new Error(
        `Insufficient credits: has ${currentBalance}, needs ${params.amount}`,
      );
    }

    // Deduct balance
    const updated = await tx.userCreditBalance.update({
      where: { userId: params.userId },
      data: { balance: { decrement: params.amount } },
      select: { balance: true },
    });

    // Record ledger
    const ledger = await tx.creditLedger.create({
      data: {
        userId: params.userId,
        type: "spend",
        amount: -params.amount,
        balanceAfter: updated.balance,
        reason: `영상 구매: ${params.videoTitle}`,
        metadataJson: params.metadata ?? {
          purchaseId: params.purchaseId,
          videoId: params.videoId,
          sellerId: params.sellerId,
        },
      },
      select: { id: true, balanceAfter: true },
    });

    return { balance: updated.balance, ledgerId: ledger.id };
  });
}

/**
 * Add credits to a seller's balance (earned from a sale).
 */
export async function addSellerCredits(params: {
  sellerId: string;
  amount: number;
  purchaseId: string;
  videoId: string;
  videoTitle: string;
  buyerId: string;
}) {
  if (params.amount <= 0) return;

  return prisma.$transaction(async (tx) => {
    const balance = await tx.userCreditBalance.upsert({
      where: { userId: params.sellerId },
      create: { userId: params.sellerId, balance: params.amount },
      update: { balance: { increment: params.amount } },
      select: { balance: true },
    });

    await tx.creditLedger.create({
      data: {
        userId: params.sellerId,
        type: "seller_earning",
        amount: params.amount,
        balanceAfter: balance.balance,
        reason: `판매 수익: ${params.videoTitle}`,
        metadataJson: {
          purchaseId: params.purchaseId,
          videoId: params.videoId,
          buyerId: params.buyerId,
        },
      },
    });

    return { balance: balance.balance };
  });
}

export async function grantCreditsForPayment(params: {
  paymentId: string;
  userId: string;
  credits: number;
  reason: string;
  metadata?: Prisma.InputJsonValue;
}) {
  if (params.credits <= 0) {
    throw new Error("Credit grant amount must be positive.");
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.creditLedger.findUnique({
      where: {
        paymentId_type: {
          paymentId: params.paymentId,
          type: "purchase",
        },
      },
      select: { id: true, balanceAfter: true },
    });

    if (existing) {
      return existing;
    }

    const balance = await tx.userCreditBalance.upsert({
      where: { userId: params.userId },
      create: {
        userId: params.userId,
        balance: params.credits,
      },
      update: {
        balance: { increment: params.credits },
      },
      select: { balance: true },
    });

    return tx.creditLedger.create({
      data: {
        userId: params.userId,
        paymentId: params.paymentId,
        type: "purchase",
        amount: params.credits,
        balanceAfter: balance.balance,
        reason: params.reason,
        metadataJson: params.metadata ?? Prisma.JsonNull,
      },
      select: { id: true, balanceAfter: true },
    });
  });
}

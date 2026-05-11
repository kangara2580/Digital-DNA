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
  const [balance, ledger, payments] = await Promise.all([
    getUserCreditBalance(userId),
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

  return { balance, ledger, payments };
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

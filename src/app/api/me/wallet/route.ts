import { NextResponse } from "next/server";
import { getSellerSettlementSummary } from "@/lib/commerceLedger";
import { getUserCreditSummary } from "@/lib/credits";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import { getTossEnvStatus, platformFeeRateBps, settlementHoldDays } from "@/lib/tossConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", loginUrl: "/login" },
      { status: 401 },
    );
  }

  const [credit, settlement, settlementRequests, payoutAccount] = await Promise.all([
    getUserCreditSummary(user.id),
    getSellerSettlementSummary(user.id),
    prisma.sellerSettlementRequest.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        status: true,
        bankName: true,
        accountNo: true,
        accountHolder: true,
        createdAt: true,
      },
    }),
    prisma.sellerPayoutAccount.findUnique({
      where: { sellerId: user.id },
      select: {
        bankName: true,
        accountNo: true,
        accountHolder: true,
        updatedAt: true,
      },
    }),
  ]);

  const toss = getTossEnvStatus();

  return NextResponse.json({
    ok: true,
    balance: credit.balance,
    balanceUpdatedAt: credit.balanceUpdatedAt?.toISOString() ?? null,
    ledger: credit.ledger.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    payments: credit.payments.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      paidAt: p.paidAt?.toISOString() ?? null,
    })),
    settlement,
    settlementRequests: settlementRequests.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    payoutAccount: payoutAccount
      ? {
          bankName: payoutAccount.bankName,
          accountNo: payoutAccount.accountNo,
          accountHolder: payoutAccount.accountHolder,
          updatedAt: payoutAccount.updatedAt.toISOString(),
        }
      : null,
    toss,
    policy: {
      settlementHoldDays: settlementHoldDays(),
      platformFeeRateBps: platformFeeRateBps(),
    },
  });
}

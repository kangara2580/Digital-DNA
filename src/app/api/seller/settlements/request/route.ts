import { NextResponse } from "next/server";
import { getSellerSettlementSummary } from "@/lib/commerceLedger";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    amount?: number | string;
    bankName?: string;
    accountNo?: string;
    accountHolder?: string;
  } | null;

  const requestedAmount = Number(body?.amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return NextResponse.json({ ok: false, error: "invalid_amount" }, { status: 400 });
  }

  const summary = await getSellerSettlementSummary(user.id);
  if (requestedAmount > summary.availableAmount) {
    return NextResponse.json(
      {
        ok: false,
        error: "amount_exceeds_available",
        availableAmount: summary.availableAmount,
      },
      { status: 409 },
    );
  }

  const requestRow = await prisma.$transaction(async (tx) => {
    const row = await tx.sellerSettlementRequest.create({
      data: {
        sellerId: user.id,
        amount: requestedAmount,
        currency: "GEM",
        bankName: body?.bankName?.trim() || null,
        accountNo: body?.accountNo?.trim() || null,
        accountHolder: body?.accountHolder?.trim() || null,
        status: "requested",
      },
    });

    const earnings = await tx.sellerEarning.findMany({
      where: {
        sellerId: user.id,
        status: "pending",
        availableAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, netAmount: true },
    });

    let remaining = requestedAmount;
    for (const earning of earnings) {
      if (remaining <= 0) break;
      if (earning.netAmount > remaining) continue;
      await tx.sellerEarning.update({
        where: { id: earning.id },
        data: { status: "settlement_requested" },
      });
      remaining -= earning.netAmount;
    }

    return row;
  });

  return NextResponse.json({ ok: true, settlementRequestId: requestRow.id });
}

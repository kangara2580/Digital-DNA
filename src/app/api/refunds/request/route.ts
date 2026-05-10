import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    paymentId?: string;
    purchaseId?: string;
    reason?: string;
    detail?: string;
  } | null;

  const paymentId = body?.paymentId?.trim();
  const purchaseId = body?.purchaseId?.trim();
  const reason = body?.reason?.trim();

  if (!reason || (!paymentId && !purchaseId)) {
    return NextResponse.json({ ok: false, error: "invalid_refund_request" }, { status: 400 });
  }

  const payment = paymentId
    ? await prisma.payment.findFirst({ where: { id: paymentId, userId: user.id } })
    : null;
  const purchase = purchaseId
    ? await prisma.purchase.findFirst({ where: { id: purchaseId, buyerId: user.id } })
    : null;

  if ((paymentId && !payment) || (purchaseId && !purchase)) {
    return NextResponse.json({ ok: false, error: "target_not_found" }, { status: 404 });
  }

  const requestRow = await prisma.refundRequest.create({
    data: {
      requesterId: user.id,
      paymentId: payment?.id ?? paymentId ?? null,
      purchaseId: purchase?.id ?? purchaseId ?? null,
      reason,
      detail: body?.detail?.trim() || null,
      status: "requested",
    },
  });

  return NextResponse.json({ ok: true, refundRequestId: requestRow.id });
}

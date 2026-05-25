import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/purchases
 * Returns the logged-in user's purchase history with refund request status.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  try {
    // Fetch purchases
    const purchases = await prisma.purchase.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Fetch payments for this user
    const payments = await prisma.payment.findMany({
      where: { userId: user.id, status: { in: ["paid", "refunded"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        orderName: true,
        productType: true,
        productKey: true,
        status: true,
        amountCents: true,
        currency: true,
        credits: true,
        paidAt: true,
        createdAt: true,
      },
    });

    // Fetch existing refund requests for this user
    const refundRequests = await prisma.refundRequest.findMany({
      where: { requesterId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        paymentId: true,
        purchaseId: true,
        reason: true,
        status: true,
        adminMemo: true,
        createdAt: true,
      },
    });

    // Build a lookup for refund status by paymentId and purchaseId
    const refundByPayment = new Map<string, (typeof refundRequests)[number]>();
    const refundByPurchase = new Map<string, (typeof refundRequests)[number]>();
    for (const rr of refundRequests) {
      if (rr.paymentId) refundByPayment.set(rr.paymentId, rr);
      if (rr.purchaseId) refundByPurchase.set(rr.purchaseId, rr);
    }

    return NextResponse.json({
      ok: true,
      purchases: purchases.map((p) => {
        const rr = refundByPurchase.get(p.id);
        return {
          id: p.id,
          videoId: p.videoId,
          price: p.price,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          refundRequest: rr
            ? {
                id: rr.id,
                status: rr.status,
                reason: rr.reason,
                adminMemo: rr.adminMemo,
                createdAt: rr.createdAt.toISOString(),
              }
            : null,
        };
      }),
      payments: payments.map((p) => {
        const rr = refundByPayment.get(p.id);
        return {
          ...p,
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
          refundRequest: rr
            ? {
                id: rr.id,
                status: rr.status,
                reason: rr.reason,
                adminMemo: rr.adminMemo,
                createdAt: rr.createdAt.toISOString(),
              }
            : null,
        };
      }),
    });
  } catch (err) {
    console.error("[me/purchases]", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 },
    );
  }
}

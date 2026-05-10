"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAccess } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { cancelTossPayment, toJsonValue } from "@/lib/tossPayments";

export async function rejectRefundRequest(formData: FormData) {
  const admin = await requireAdminAccess();
  const id = String(formData.get("id") ?? "");
  const adminMemo = String(formData.get("adminMemo") ?? "");
  if (!id) throw new Error("refund request id is required");

  await prisma.refundRequest.update({
    where: { id },
    data: {
      status: "rejected",
      adminMemo,
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: admin.id,
      actorEmail: admin.email,
      action: "refund.reject",
      targetType: "refund_request",
      targetId: id,
      afterJson: { adminMemo },
    },
  });

  revalidatePath("/admin/refunds");
}

export async function approveRefundRequest(formData: FormData) {
  const admin = await requireAdminAccess();
  const id = String(formData.get("id") ?? "");
  const adminMemo = String(formData.get("adminMemo") ?? "");
  if (!id) throw new Error("refund request id is required");

  const request = await prisma.refundRequest.findUnique({ where: { id } });
  if (!request) throw new Error("refund request not found");
  if (request.status === "refunded") return;

  const payment = request.paymentId
    ? await prisma.payment.findUnique({ where: { id: request.paymentId } })
    : request.purchaseId
      ? await prisma.payment.findFirst({
          where: {
            productType: "video",
            status: "paid",
            targetId: {
              not: null,
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : null;

  if (!payment) throw new Error("payment not found for refund");
  if (!payment.providerPaymentKey) throw new Error("Toss paymentKey is missing");
  if (payment.status === "refunded") return;

  const tossCancel = await cancelTossPayment({
    paymentKey: payment.providerPaymentKey,
    cancelReason: request.reason || "관리자 환불 승인",
  });

  await prisma.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        paymentId: payment.id,
        refundRequestId: request.id,
        provider: "toss",
        amountCents: payment.amountCents,
        currency: payment.currency,
        reason: request.reason,
        status: "succeeded",
        providerRawJson: toJsonValue(tossCancel),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "refunded",
        providerRawJson: toJsonValue(tossCancel),
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        provider: "toss",
        eventType: "cancel",
        orderId: payment.providerOrderId,
        paymentKey: payment.providerPaymentKey,
        status: "refunded",
        rawJson: toJsonValue(tossCancel),
      },
    });

    await tx.refundRequest.update({
      where: { id: request.id },
      data: {
        status: "refunded",
        adminMemo,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    if (payment.productType === "credits" && payment.credits > 0) {
      const balance = await tx.userCreditBalance.upsert({
        where: { userId: payment.userId },
        create: { userId: payment.userId, balance: -payment.credits },
        update: { balance: { decrement: payment.credits } },
        select: { balance: true },
      });

      await tx.creditLedger.create({
        data: {
          userId: payment.userId,
          paymentId: payment.id,
          type: "refund",
          amount: -payment.credits,
          balanceAfter: balance.balance,
          reason: "Toss refund",
          metadataJson: { refundRequestId: request.id },
        },
      });
    }

    if (request.purchaseId) {
      const purchase = await tx.purchase.update({
        where: { id: request.purchaseId },
        data: { status: "refunded" },
      });

      await tx.userEntitlement.updateMany({
        where: { purchaseId: purchase.id },
        data: { status: "revoked", revokedAt: new Date() },
      });

      await tx.sellerEarning.updateMany({
        where: { purchaseId: purchase.id },
        data: { status: "reversed" },
      });

      await tx.platformFee.updateMany({
        where: { purchaseId: purchase.id },
        data: { status: "reversed" },
      });

      await tx.video.update({
        where: { id: purchase.videoId },
        data: { salesCount: { decrement: 1 } },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "refund.approve",
        targetType: "refund_request",
        targetId: request.id,
        afterJson: { paymentId: payment.id, adminMemo },
      },
    });
  });

  revalidatePath("/admin/refunds");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/settlements");
}

export async function approveSettlementRequest(formData: FormData) {
  const admin = await requireAdminAccess();
  const id = String(formData.get("id") ?? "");
  const adminMemo = String(formData.get("adminMemo") ?? "");
  if (!id) throw new Error("settlement request id is required");

  const request = await prisma.sellerSettlementRequest.findUnique({ where: { id } });
  if (!request) throw new Error("settlement request not found");

  const settlement = await prisma.sellerSettlement.create({
    data: {
      sellerId: request.sellerId,
      settlementRequestId: request.id,
      amount: request.amount,
      currency: request.currency,
      status: "approved",
      method: "manual",
      adminMemo,
      processedBy: admin.id,
    },
  });

  await prisma.$transaction([
    prisma.sellerSettlementRequest.update({
      where: { id },
      data: {
        status: "approved",
        adminMemo,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.sellerEarning.updateMany({
      where: {
        sellerId: request.sellerId,
        status: "settlement_requested",
      },
      data: {
        settlementId: settlement.id,
        status: "settling",
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "settlement.approve",
        targetType: "seller_settlement_request",
        targetId: id,
        afterJson: { settlementId: settlement.id, adminMemo },
      },
    }),
  ]);

  revalidatePath("/admin/settlements");
}

export async function markSettlementPaid(formData: FormData) {
  const admin = await requireAdminAccess();
  const settlementId = String(formData.get("settlementId") ?? "");
  if (!settlementId) throw new Error("settlement id is required");

  const settlement = await prisma.sellerSettlement.findUnique({ where: { id: settlementId } });
  if (!settlement) throw new Error("settlement not found");

  await prisma.$transaction([
    prisma.sellerSettlement.update({
      where: { id: settlementId },
      data: {
        status: "paid",
        processedBy: admin.id,
        processedAt: new Date(),
      },
    }),
    prisma.sellerSettlementRequest.updateMany({
      where: { id: settlement.settlementRequestId ?? "" },
      data: {
        status: "paid",
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.sellerEarning.updateMany({
      where: { settlementId },
      data: { status: "paid" },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: "settlement.paid",
        targetType: "seller_settlement",
        targetId: settlementId,
        afterJson: { amount: settlement.amount },
      },
    }),
  ]);

  revalidatePath("/admin/settlements");
}

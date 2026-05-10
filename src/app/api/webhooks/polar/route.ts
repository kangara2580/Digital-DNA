import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@polar-sh/nextjs";
import type { WebhookOrderPaidPayload } from "@polar-sh/sdk/models/components/webhookorderpaidpayload";
import type { WebhookOrderRefundedPayload } from "@polar-sh/sdk/models/components/webhookorderrefundedpayload";
import { Prisma } from "@prisma/client";
import { grantCreditsForPayment } from "@/lib/credits";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function textMetadata(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

async function handleOrderPaid(payload: WebhookOrderPaidPayload) {
  const order = payload.data;
  const metadata = order.metadata ?? {};
  const araPaymentId = textMetadata(metadata.araPaymentId);
  const metadataUserId = textMetadata(metadata.userId);
  const metadataCredits = Number(textMetadata(metadata.credits) ?? "0");

  const orderLookup = [
    ...(order.checkoutId ? [{ providerCheckoutId: order.checkoutId }] : []),
    { providerOrderId: order.id },
  ];

  const payment = araPaymentId
    ? await prisma.payment.findUnique({ where: { id: araPaymentId } })
    : await prisma.payment.findFirst({
        where: {
          OR: orderLookup,
        },
      });

  if (!payment) {
    console.error("[polar.webhook] order.paid without local payment", {
      orderId: order.id,
      checkoutId: order.checkoutId,
      metadata,
    });
    return;
  }

  const credits = metadataCredits > 0 ? metadataCredits : payment.credits;
  const userId = metadataUserId || payment.userId;

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "paid",
      providerOrderId: order.id,
      providerCheckoutId: order.checkoutId ?? payment.providerCheckoutId,
      amountCents: order.totalAmount,
      currency: order.currency.toUpperCase(),
      credits,
      providerRawJson: toJsonValue(order),
      paidAt: new Date(),
    },
  });

  const ledger = await grantCreditsForPayment({
    paymentId: updatedPayment.id,
    userId,
    credits,
    reason: `Polar ${updatedPayment.productKey} credit pack`,
    metadata: {
      provider: "polar",
      orderId: order.id,
      checkoutId: order.checkoutId,
      amountCents: order.totalAmount,
      currency: order.currency,
    },
  });

  console.log("[polar.webhook] order.paid applied", {
    paymentId: updatedPayment.id,
    orderId: order.id,
    userId,
    credits,
    balanceAfter: ledger.balanceAfter,
  });
}

async function handleOrderRefunded(payload: WebhookOrderRefundedPayload) {
  const order = payload.data;
  const orderLookup = [
    ...(order.checkoutId ? [{ providerCheckoutId: order.checkoutId }] : []),
    { providerOrderId: order.id },
  ];
  const payment = await prisma.payment.findFirst({
    where: {
      OR: orderLookup,
    },
  });

  if (!payment) {
    console.error("[polar.webhook] order.refunded without local payment", {
      orderId: order.id,
      checkoutId: order.checkoutId,
    });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "refunded",
        providerRawJson: toJsonValue(order),
      },
    });

    const existing = await tx.creditLedger.findUnique({
      where: {
        paymentId_type: {
          paymentId: payment.id,
          type: "refund",
        },
      },
    });
    if (existing) return;

    const balance = await tx.userCreditBalance.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        balance: -payment.credits,
      },
      update: {
        balance: { decrement: payment.credits },
      },
      select: { balance: true },
    });

    await tx.creditLedger.create({
      data: {
        userId: payment.userId,
        paymentId: payment.id,
        type: "refund",
        amount: -payment.credits,
        balanceAfter: balance.balance,
        reason: "Polar refund",
        metadataJson: {
          provider: "polar",
          orderId: order.id,
          refundedAmount: order.refundedAmount,
          currency: order.currency,
        },
      },
    });
  });

  console.log("[polar.webhook] order.refunded applied", {
    paymentId: payment.id,
    orderId: order.id,
    userId: payment.userId,
    credits: payment.credits,
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[polar.webhook] Missing POLAR_WEBHOOK_SECRET");
    return NextResponse.json({ received: false, error: "not_configured" }, { status: 503 });
  }

  const handler = Webhooks({
    webhookSecret,
    onOrderPaid: handleOrderPaid,
    onOrderRefunded: handleOrderRefunded,
    onPayload: async (payload) => {
      console.log("[polar.webhook] received", { type: payload.type });
    },
  });

  return handler(request);
}

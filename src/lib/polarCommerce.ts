/**
 * Polar-specific commerce helpers.
 * Mirrors the Toss flow in commerceLedger.ts but for Polar (USD, global).
 */

import { prisma } from "@/lib/prisma";
import { getCreditPack, getCreditPackProductId, getSiteUrl, type CreditPackKey } from "@/lib/polarConfig";
import { grantCreditsForPayment } from "@/lib/credits";
import { sendPurchaseReceipt } from "@/lib/email/send";

/**
 * Polar API base URL per server mode.
 */
function polarApiBase(): string {
  const server = process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
  return server === "production"
    ? "https://api.polar.sh"
    : "https://sandbox-api.polar.sh";
}

/**
 * Create a Polar checkout session via direct REST call.
 * We avoid the SDK's built-in fetch because Next.js patches global fetch
 * which can cause "expected non-null body source" errors with the SDK.
 */
async function createPolarCheckoutSession(params: {
  productId: string;
  successUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<{ id: string; url: string }> {
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim();
  if (!accessToken) throw new Error("POLAR_ACCESS_TOKEN is required.");

  const apiBase = polarApiBase();
  const body: Record<string, unknown> = {
    products: [params.productId],
    success_url: params.successUrl,
  };
  if (params.customerEmail) body.customer_email = params.customerEmail;
  if (params.metadata) body.metadata = params.metadata;

  const res = await fetch(`${apiBase}/v1/checkouts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Polar API returned non-JSON (${res.status}): ${text.substring(0, 200)}`);
  }

  if (!res.ok) {
    const errorDesc =
      (data as any).error_description ??
      (data as any).detail ??
      (data as any).error ??
      text.substring(0, 200);
    throw new Error(`Polar API ${res.status}: ${errorDesc}`);
  }

  const id = data.id as string;
  const url = data.url as string;
  if (!id || !url) {
    throw new Error(`Polar checkout response missing id or url: ${JSON.stringify(data).substring(0, 300)}`);
  }

  return { id, url };
}

/**
 * Create a Polar checkout session and a pending Payment row.
 * Returns the checkout URL to redirect the user.
 */
export async function createPolarCheckout(params: {
  userId: string;
  userEmail: string | null;
  packKey: CreditPackKey;
}): Promise<{ checkoutUrl: string; paymentId: string }> {
  const pack = getCreditPack(params.packKey);
  if (!pack) {
    throw new Error(`Invalid credit pack key: ${params.packKey}`);
  }

  const productId = getCreditPackProductId(pack);
  if (!productId) {
    throw new Error(
      `Polar product ID not configured for pack "${params.packKey}". Set ${pack.productEnvName} in env.`,
    );
  }

  const siteUrl = getSiteUrl();

  const checkout = await createPolarCheckoutSession({
    productId,
    successUrl: `${siteUrl}/payments/polar/success?checkout_id={CHECKOUT_ID}`,
    customerEmail: params.userEmail ?? undefined,
    metadata: {
      userId: params.userId,
      packKey: params.packKey,
      credits: String(pack.credits),
    },
  });

  // Create pending Payment row
  const orderId = `polar_${checkout.id}`;
  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      userEmail: params.userEmail,
      provider: "polar",
      providerCheckoutId: checkout.id,
      providerOrderId: orderId,
      orderName: `${pack.name} Credit Pack`,
      productType: "credits",
      productKey: params.packKey,
      status: "pending",
      amountCents: Math.round(pack.priceUsd * 100), // store in USD cents
      currency: "USD",
      credits: pack.credits,
    },
  });

  return {
    checkoutUrl: checkout.url,
    paymentId: payment.id,
  };
}

/**
 * Apply a confirmed Polar webhook event.
 * Called from the webhook handler when checkout.updated status === "succeeded".
 */
export async function applyPolarConfirmedPayment(params: {
  checkoutId: string;
  eventId: string;
  rawPayload: Record<string, unknown>;
}): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { providerCheckoutId: params.checkoutId },
  });

  if (!payment) {
    console.warn("[polar-commerce] Payment not found for checkout:", params.checkoutId);
    return;
  }

  // Record the event
  await prisma.paymentEvent.create({
    data: {
      paymentId: payment.id,
      provider: "polar",
      eventType: "checkout.updated",
      providerEventId: params.eventId,
      orderId: payment.providerOrderId,
      status: "succeeded",
      rawJson: params.rawPayload as any,
    },
  });

  // Already processed?
  if (payment.status === "paid") {
    return;
  }

  // Update payment to paid
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "paid",
      paidAt: new Date(),
      providerRawJson: params.rawPayload as any,
    },
  });

  // Grant credits
  if (payment.productType === "credits" && payment.credits > 0) {
    await grantCreditsForPayment({
      paymentId: payment.id,
      userId: payment.userId,
      credits: payment.credits,
      reason: `Polar ${payment.productKey} credit pack`,
      metadata: {
        provider: "polar",
        checkoutId: params.checkoutId,
      },
    });
  }

  // Send receipt email
  if (payment.userEmail) {
    sendPurchaseReceipt({
      to: payment.userEmail,
      orderName: payment.orderName ?? payment.productKey,
      amount: payment.amountCents,
      currency: payment.currency,
      credits: payment.credits > 0 ? payment.credits : undefined,
    }).catch(() => {});
  }
}

/**
 * Apply a Polar refund webhook event.
 */
export async function applyPolarRefund(params: {
  checkoutId: string;
  eventId: string;
  rawPayload: Record<string, unknown>;
}): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { providerCheckoutId: params.checkoutId },
  });

  if (!payment || payment.status === "refunded") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        provider: "polar",
        eventType: "order.refunded",
        providerEventId: params.eventId,
        orderId: payment.providerOrderId,
        status: "refunded",
        rawJson: params.rawPayload as any,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "refunded" },
    });

    await tx.refund.create({
      data: {
        paymentId: payment.id,
        provider: "polar",
        amountCents: payment.amountCents,
        currency: payment.currency,
        reason: "Polar refund",
        status: "succeeded",
        providerRawJson: params.rawPayload as any,
      },
    });

    // Reverse credits if applicable
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
          reason: "Polar refund",
          metadataJson: { eventId: params.eventId },
        },
      });
    }
  });
}

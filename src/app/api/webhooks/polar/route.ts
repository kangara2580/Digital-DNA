import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { applyPolarConfirmedPayment, applyPolarRefund } from "@/lib/polarCommerce";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/polar
 *
 * Handles Polar webhook events using the official SDK webhook validator.
 * - checkout.updated (succeeded) → confirm payment, grant credits
 * - order.refunded → reverse payment + credits
 */
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "webhook_not_configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();

  // Collect headers into a plain object for the SDK
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(rawBody, headers, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.warn("[polar-webhook] Verification failed:", err.message);
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
    throw err;
  }

  // The validated event has a `type` field and typed `data`
  const eventType = (event as { type?: string }).type ?? "unknown";
  const data = (event as { data?: Record<string, unknown> }).data ?? {};

  console.log("[polar-webhook] Received:", eventType, data.id);

  try {
    if (eventType === "checkout.updated") {
      const status = data.status as string | undefined;
      const checkoutId = data.id as string | undefined;
      if (status === "succeeded" && checkoutId) {
        await applyPolarConfirmedPayment({
          checkoutId,
          eventId: `${eventType}_${checkoutId}`,
          rawPayload: data,
        });
      }
    } else if (eventType === "order.refunded") {
      const checkoutId =
        (data.checkout_id as string) ?? (data.id as string) ?? "";
      if (checkoutId) {
        await applyPolarRefund({
          checkoutId,
          eventId: `${eventType}_${(data.id as string) ?? "unknown"}`,
          rawPayload: data,
        });
      }
    }
    // Other event types: acknowledged but not processed
  } catch (err) {
    console.error("[polar-webhook] Processing error:", err);
    // Return 200 to prevent Polar from retrying indefinitely
  }

  return NextResponse.json({ received: true });
}

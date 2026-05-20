import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/serverSession";
import { getPolarEnvStatus, type CreditPackKey } from "@/lib/polarConfig";
import { createPolarCheckout } from "@/lib/polarCommerce";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const VALID_PACKS: CreditPackKey[] = ["starter", "creator", "studio"];

/**
 * POST /api/payments/polar/checkout
 * Body: { packKey: "starter" | "creator" | "studio" }
 *
 * Creates a Polar checkout session and returns the URL.
 */
export async function POST(request: NextRequest) {
  // Rate limit
  const rl = checkRateLimit(request, {
    windowMs: 60_000,
    maxRequests: 10,
    prefix: "polar-checkout",
  });
  if (!rl.ok) return rl.response;

  // Check Polar config
  const envStatus = getPolarEnvStatus();
  if (!envStatus.hasAccessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "polar_not_configured",
        message: "POLAR_ACCESS_TOKEN is not set. Contact admin.",
      },
      { status: 503 },
    );
  }

  // Auth
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required" },
      { status: 401 },
    );
  }

  // Parse body
  let body: { packKey?: string } | null = null;
  try {
    body = (await request.json()) as { packKey?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const packKey = body?.packKey as CreditPackKey | undefined;
  if (!packKey || !VALID_PACKS.includes(packKey)) {
    return NextResponse.json(
      { ok: false, error: "invalid_pack_key", validKeys: VALID_PACKS },
      { status: 400 },
    );
  }

  try {
    const { checkoutUrl, paymentId } = await createPolarCheckout({
      userId: user.id,
      userEmail: user.email,
      packKey,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      paymentId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "checkout_failed";
    console.error("[polar/checkout]", err);
    return NextResponse.json(
      { ok: false, error: "checkout_failed", message },
      { status: 500 },
    );
  }
}

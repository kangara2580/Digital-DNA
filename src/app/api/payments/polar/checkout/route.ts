import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  createPolarClient,
  getCreditPack,
  getCreditPackProductId,
  getPolarEnvStatus,
  getSiteUrl,
} from "@/lib/polarConfig";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";

export const dynamic = "force-dynamic";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", loginUrl: "/login" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    productType?: string;
    productKey?: string;
  } | null;

  if (body?.productType !== "credits") {
    return NextResponse.json(
      { ok: false, error: "unsupported_product_type" },
      { status: 400 },
    );
  }

  const pack = getCreditPack(body.productKey);
  if (!pack) {
    return NextResponse.json({ ok: false, error: "unknown_credit_pack" }, { status: 400 });
  }

  const productId = getCreditPackProductId(pack);
  const envStatus = getPolarEnvStatus();
  if (!envStatus.hasAccessToken || !productId) {
    console.error("[polar.checkout] Missing Polar configuration", {
      hasAccessToken: envStatus.hasAccessToken,
      productEnvName: pack.productEnvName,
      hasProductId: Boolean(productId),
      server: envStatus.server,
    });
    return NextResponse.json(
      {
        ok: false,
        error: "polar_not_configured",
        missing: {
          POLAR_ACCESS_TOKEN: !envStatus.hasAccessToken,
          [pack.productEnvName]: !productId,
        },
      },
      { status: 503 },
    );
  }

  const siteUrl = getSiteUrl();
  const successUrl = `${siteUrl}/billing/success`;
  const returnUrl = `${siteUrl}/credits`;

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      provider: "polar",
      productType: "credits",
      productKey: pack.key,
      status: "pending",
      amountCents: Math.round(pack.priceUsd * 100),
      currency: "USD",
      credits: pack.credits,
      metadataJson: {
        packName: pack.name,
        estimatedUses: pack.estimatedUses,
      },
    },
  });

  const metadata = {
    araPaymentId: payment.id,
    productType: "credits",
    productKey: pack.key,
    userId: user.id,
    credits: String(pack.credits),
  };

  const polar = createPolarClient();
  const checkout = await polar.checkouts.create({
    products: [productId],
    externalCustomerId: user.id,
    customerEmail: user.email ?? undefined,
    customerName: user.name ?? undefined,
    successUrl,
    returnUrl,
    metadata,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerCheckoutId: checkout.id,
      amountCents: checkout.totalAmount || payment.amountCents,
      currency: checkout.currency?.toUpperCase() || payment.currency,
      providerRawJson: toJsonValue(checkout),
    },
  });

  console.log("[polar.checkout] Created checkout", {
    paymentId: payment.id,
    userId: user.id,
    productKey: pack.key,
    checkoutId: checkout.id,
    amountCents: checkout.totalAmount,
    currency: checkout.currency,
    returnUrl,
    successUrl,
    generatedUrl: checkout.url,
  });

  return NextResponse.json({
    ok: true,
    checkoutUrl: checkout.url,
    paymentId: payment.id,
  });
}

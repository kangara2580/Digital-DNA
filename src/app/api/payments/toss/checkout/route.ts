import { NextResponse } from "next/server";
import { getMarketVideoById } from "@/data/videoCommerce";
import { createPendingPayment } from "@/lib/commerceLedger";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/serverSession";
import {
  createTossOrderId,
  getSiteUrl,
  getTossClientKey,
  getTossCreditPack,
  getTossEnvStatus,
} from "@/lib/tossConfig";

export const dynamic = "force-dynamic";

type CheckoutBody = {
  productType?: "credits" | "video" | "cart";
  productKey?: string;
  videoId?: string;
  items?: { videoId?: string; expectedPriceWon?: number }[];
};

type PayableCartItem = {
  videoId: string;
  title: string;
  price: number;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "login_required", loginUrl: "/login" },
      { status: 401 },
    );
  }

  const env = getTossEnvStatus();
  const clientKey = getTossClientKey();
  if (!env.hasClientKey || !env.hasSecretKey || !clientKey) {
    console.error("[toss.checkout] Missing Toss configuration", env);
    return NextResponse.json(
      { ok: false, error: "toss_not_configured", missing: env },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as CheckoutBody | null;
  if (!body?.productType) {
    return NextResponse.json({ ok: false, error: "product_type_required" }, { status: 400 });
  }

  let amount = 0;
  let orderName = "";
  let productKey = body.productKey ?? "";
  let credits = 0;
  let targetId: string | null = null;
  let cartItems: { videoId: string; price: number }[] | undefined;

  if (body.productType === "credits") {
    const pack = getTossCreditPack(body.productKey);
    if (!pack) {
      return NextResponse.json({ ok: false, error: "unknown_credit_pack" }, { status: 400 });
    }
    amount = pack.priceKrw;
    orderName = `ARA ${pack.name} 크레딧 ${pack.credits.toLocaleString("ko-KR")}개`;
    productKey = pack.key;
    credits = pack.credits;
  } else if (body.productType === "video") {
    const videoId = body.videoId?.trim();
    if (!videoId) {
      return NextResponse.json({ ok: false, error: "video_id_required" }, { status: 400 });
    }

    const item = await resolvePayableVideo(videoId);
    if (!item.ok) return item.response;

    amount = item.video.price;
    orderName = `ARA 릴스 구매 - ${item.video.title}`.slice(0, 100);
    productKey = "video_license";
    targetId = videoId;
  } else if (body.productType === "cart") {
    const videoIds = Array.from(
      new Set(
        (body.items ?? [])
          .map((item) => item.videoId?.trim())
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (videoIds.length === 0) {
      return NextResponse.json({ ok: false, error: "cart_items_required" }, { status: 400 });
    }

    const resolved = await Promise.all(videoIds.map((videoId) => resolvePayableVideo(videoId)));
    const failed = resolved.find((item) => !item.ok);
    if (failed && !failed.ok) return failed.response;

    const payableItems = resolved
      .filter((item): item is { ok: true; video: PayableCartItem } => item.ok)
      .map((item) => item.video);

    amount = payableItems.reduce((sum, item) => sum + item.price, 0);
    orderName =
      payableItems.length === 1
        ? `ARA 릴스 구매 - ${payableItems[0].title}`.slice(0, 100)
        : `ARA 릴스 ${payableItems.length}개 묶음 구매`;
    productKey = "cart_video_bundle";
    cartItems = payableItems.map((item) => ({
      videoId: item.videoId,
      price: item.price,
    }));
  } else {
    return NextResponse.json({ ok: false, error: "unsupported_product_type" }, { status: 400 });
  }

  const orderId = createTossOrderId(body.productType);
  await createPendingPayment({
    userId: user.id,
    userEmail: user.email,
    orderId,
    orderName,
    productType: body.productType,
    productKey,
    amount,
    credits,
    targetId,
    metadata: {
      provider: "toss",
      productType: body.productType,
      productKey,
      targetId,
      items: cartItems,
    },
  });

  const siteUrl = getSiteUrl();

  return NextResponse.json({
    ok: true,
    clientKey,
    orderId,
    orderName,
    amount,
    customerEmail: user.email,
    customerName: user.name,
    successUrl: `${siteUrl}/payments/toss/success`,
    failUrl: `${siteUrl}/payments/toss/fail`,
  });
}

async function resolvePayableVideo(
  videoId: string,
): Promise<
  | { ok: true; video: PayableCartItem }
  | { ok: false; response: NextResponse }
> {
  const dbVideo = await prisma.video.findUnique({
    where: { id: videoId },
    select: { id: true, title: true, price: true, status: true },
  });
  const fallbackVideo = getMarketVideoById(videoId);
  const price = dbVideo?.price ?? fallbackVideo?.priceWon ?? 0;
  const title = dbVideo?.title ?? fallbackVideo?.title ?? `ARA 영상 ${videoId}`;

  if (price <= 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "video_price_invalid", videoId },
        { status: 400 },
      ),
    };
  }
  if (dbVideo && dbVideo.status !== "approved") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "video_not_available", videoId },
        { status: 409 },
      ),
    };
  }

  return { ok: true, video: { videoId, title, price } };
}

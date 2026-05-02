import { NextResponse } from "next/server";
import { getMarketVideoById } from "@/data/videoCommerce";
import { requireBearerUser } from "@/lib/serverAuth";
import { upsertDemoPurchase } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  videoId?: string;
};

export async function POST(request: Request) {
  const auth = await requireBearerUser(request);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const videoId = body.videoId?.trim();
  if (!videoId) {
    return NextResponse.json({ ok: false, error: "videoId_required" }, { status: 400 });
  }

  const video = getMarketVideoById(videoId);
  if (!video) {
    return NextResponse.json({ ok: false, error: "video_not_found" }, { status: 404 });
  }

  await upsertDemoPurchase({
    buyerId: auth.user.id,
    sellerId: video.listing?.sellerId ?? video.creator,
    videoId,
    price: video.priceWon ?? 0,
  });

  return NextResponse.json({ ok: true });
}

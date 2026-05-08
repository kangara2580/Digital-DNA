import { NextResponse } from "next/server";
import { ALL_MARKET_VIDEOS } from "@/data/videoCatalog";
import { canonicalFavoriteVideoId } from "@/lib/favoriteVideoId";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ValidateItem = {
  videoId: string;
  expectedPriceWon: number;
};

function toFiniteInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const itemsRaw = (body as { items?: unknown })?.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    return NextResponse.json({ ok: false, error: "items_required" }, { status: 400 });
  }
  if (itemsRaw.length > 100) {
    return NextResponse.json({ ok: false, error: "too_many_items" }, { status: 400 });
  }

  const items: ValidateItem[] = [];
  for (const entry of itemsRaw) {
    const row = entry as { videoId?: unknown; expectedPriceWon?: unknown };
    const videoId = typeof row.videoId === "string" ? row.videoId.trim() : "";
    const expected = toFiniteInt(row.expectedPriceWon);
    if (!videoId || expected == null || expected < 0) {
      return NextResponse.json({ ok: false, error: "invalid_item" }, { status: 400 });
    }
    items.push({ videoId, expectedPriceWon: expected });
  }

  const staticPriceMap = new Map<string, number>();
  for (const video of ALL_MARKET_VIDEOS) {
    if (typeof video.priceWon !== "number") continue;
    staticPriceMap.set(canonicalFavoriteVideoId(video.id), video.priceWon);
  }

  const canonIds = Array.from(new Set(items.map((x) => canonicalFavoriteVideoId(x.videoId))));
  const dbRows = await prisma.video.findMany({
    where: { id: { in: canonIds } },
    select: { id: true, price: true, updatedAt: true },
  });
  const dbPriceMap = new Map(
    dbRows.map((row) => [canonicalFavoriteVideoId(row.id), { price: row.price, updatedAt: row.updatedAt }]),
  );

  const mismatches: Array<{
    videoId: string;
    expectedPriceWon: number;
    actualPriceWon: number | null;
    reason: "not_found" | "price_unavailable" | "changed";
  }> = [];

  const validatedItems = items.map((item) => {
    const canonId = canonicalFavoriteVideoId(item.videoId);
    const db = dbPriceMap.get(canonId);
    const actualPriceWon = db?.price ?? staticPriceMap.get(canonId) ?? null;
    if (actualPriceWon == null) {
      mismatches.push({
        videoId: item.videoId,
        expectedPriceWon: item.expectedPriceWon,
        actualPriceWon: null,
        reason: db ? "price_unavailable" : "not_found",
      });
    } else if (actualPriceWon !== item.expectedPriceWon) {
      mismatches.push({
        videoId: item.videoId,
        expectedPriceWon: item.expectedPriceWon,
        actualPriceWon,
        reason: "changed",
      });
    }
    return {
      videoId: item.videoId,
      expectedPriceWon: item.expectedPriceWon,
      actualPriceWon,
      validatedAt: new Date().toISOString(),
      source: db ? "db" : "catalog",
      updatedAt: db?.updatedAt?.toISOString() ?? null,
    };
  });

  const totalExpectedWon = items.reduce((sum, item) => sum + item.expectedPriceWon, 0);
  const totalValidatedWon = validatedItems.reduce(
    (sum, item) => sum + (typeof item.actualPriceWon === "number" ? item.actualPriceWon : 0),
    0,
  );

  return NextResponse.json({
    ok: true,
    canCheckout: mismatches.length === 0,
    totalExpectedWon,
    totalValidatedWon,
    mismatches,
    validatedItems,
  });
}

import { NextResponse } from "next/server";
import { hasPaidPurchase } from "@/lib/purchases";
import { prisma } from "@/lib/prisma";
import { requireBearerUser } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 1200;

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  try {
    const rows = await withTimeout(
      prisma.$queryRaw<
        {
          id: string;
          user_id: string;
          nickname: string;
          rating: number;
          body: string;
          created_at: Date;
        }[]
      >`
        SELECT id, user_id, nickname, rating, body, created_at
        FROM video_reviews
        WHERE video_id = ${videoId}
        ORDER BY created_at DESC
        LIMIT 100
      `,
      DB_TIMEOUT_MS,
    );

    return NextResponse.json({ ok: true, reviews: rows });
  } catch {
    return NextResponse.json({ ok: false, reviews: [] });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const auth = await requireBearerUser(req);

  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    rating?: number;
    body?: string;
    nickname?: string;
  } | null;

  const rating =
    typeof body?.rating === "number"
      ? Math.min(5, Math.max(1, Math.round(body.rating)))
      : 0;
  const reviewBody = typeof body?.body === "string" ? body.body.trim() : "";
  const fallbackNickname = auth.user.email?.split("@")[0] ?? "guest";
  const nickname =
    typeof body?.nickname === "string"
      ? body.nickname.trim().slice(0, 30)
      : fallbackNickname;

  if (!rating || !reviewBody || reviewBody.length < 5) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (reviewBody.length > 500) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  try {
    const purchased = await withTimeout(
      hasPaidPurchase({ userId: auth.user.id, videoId }),
      DB_TIMEOUT_MS,
    );

    if (!purchased) {
      return NextResponse.json(
        { ok: false, error: "purchase_required" },
        { status: 403 },
      );
    }

    await withTimeout(
      prisma.$executeRaw`
        INSERT INTO video_reviews (id, video_id, user_id, nickname, rating, body)
        VALUES (gen_random_uuid()::text, ${videoId}, ${auth.user.id}, ${nickname}, ${rating}, ${reviewBody})
        ON CONFLICT (video_id, user_id) DO UPDATE
          SET rating = EXCLUDED.rating,
              body = EXCLUDED.body,
              nickname = EXCLUDED.nickname
      `,
      DB_TIMEOUT_MS,
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

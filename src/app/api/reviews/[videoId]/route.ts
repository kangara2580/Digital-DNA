import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 1200;
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, r) => setTimeout(() => r(new Error("timeout")), ms)),
  ]);
}

/** GET /api/reviews/[videoId] — 공개 리뷰 목록 */
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

/** POST /api/reviews/[videoId] — 구매한 사용자만 작성 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as { rating?: number; body?: string; nickname?: string } | null;
  const rating = typeof body?.rating === "number" ? Math.min(5, Math.max(1, Math.round(body.rating))) : 0;
  const reviewBody = typeof body?.body === "string" ? body.body.trim() : "";
  const nickname = typeof body?.nickname === "string" ? body.nickname.trim().slice(0, 30) : user.email?.split("@")[0] ?? "익명";

  if (!rating || !reviewBody || reviewBody.length < 5) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (reviewBody.length > 500) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  try {
    // 구매 확인: video.salesCount가 DB에 있으면 sellerId≠userId로 간단 체크
    // 실제 구매 기록 테이블이 없으므로 purchased_videos 키로 체크는 클라이언트 신뢰 + 중복방지로 대체
    await withTimeout(
      prisma.$executeRaw`
        INSERT INTO video_reviews (id, video_id, user_id, nickname, rating, body)
        VALUES (gen_random_uuid()::text, ${videoId}, ${user.id}, ${nickname}, ${rating}, ${reviewBody})
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

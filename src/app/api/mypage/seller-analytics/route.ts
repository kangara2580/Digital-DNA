import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  SELLER_ANALYTICS_MAX_DAYS,
  SELLER_ANALYTICS_MIN_DAYS,
} from "@/data/sellerAnalytics";
import {
  buildSellerAnalyticsFromVideos,
  type AnalyticsRangeInput,
} from "@/lib/sellerAnalyticsFromDb";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseRange(searchParams: URLSearchParams): AnalyticsRangeInput {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (
    typeof from === "string" &&
    typeof to === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(from) &&
    /^\d{4}-\d{2}-\d{2}$/.test(to)
  ) {
    return { kind: "custom", start: from, end: to };
  }
  const daysRaw = Number.parseInt(searchParams.get("days") ?? "7", 10);
  const days = Number.isFinite(daysRaw)
    ? Math.max(
        SELLER_ANALYTICS_MIN_DAYS,
        Math.min(SELLER_ANALYTICS_MAX_DAYS, Math.floor(daysRaw)),
      )
    : 7;
  return { kind: "preset", days };
}

/**
 * GET /api/mypage/seller-analytics?days=7 | ?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Authorization: Bearer — 로그인 판매자 본인 `videos` 집계
 */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.length || !anonKey?.length) {
    return NextResponse.json(
      { ok: false, error: "not_configured" },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
  if (!token) {
    return NextResponse.json({ ok: false, error: "login_required" }, { status: 401 });
  }

  const supabaseAuth = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userErr,
  } = await supabaseAuth.auth.getUser(token);
  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "invalid_session" }, { status: 401 });
  }

  const range = parseRange(new URL(request.url).searchParams);

  try {
    const videos = await prisma.video.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const snapshot = buildSellerAnalyticsFromVideos(videos, range);
    return NextResponse.json({ ok: true, snapshot });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

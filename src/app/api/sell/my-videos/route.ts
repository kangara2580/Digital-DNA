import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { videoRowToFeedVideo } from "@/lib/flashSaleVideos";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sell/my-videos
 * 로그인한 판매자가 Prisma `videos`에 등록한 영상 목록 (seller_id = auth.uid)
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

  try {
    const rows = await prisma.video.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const videos = rows.map(videoRowToFeedVideo);
    return NextResponse.json({ ok: true, videos });
  } catch {
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }
}

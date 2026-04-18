import { NextRequest, NextResponse } from "next/server";
import { searchMarketVideos } from "@/lib/searchMarketVideos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/search?q= — JSON 결과(클라이언트·외부 연동용). 페이지는 동일 로직을 서버에서 직접 호출합니다. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  try {
    const videos = await searchMarketVideos(q);
    return NextResponse.json({ ok: true, q, videos });
  } catch {
    return NextResponse.json({ ok: false, error: "search_failed" }, { status: 500 });
  }
}

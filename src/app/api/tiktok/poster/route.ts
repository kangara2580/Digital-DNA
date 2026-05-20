import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated 선호: `/api/embed/poster?url=...` (TikTok·YouTube·Instagram 공통)
 */
export async function GET(request: NextRequest) {
  try {
    const u = request.nextUrl;
    const q = u.searchParams.toString();
    const target = new URL(`/api/embed/poster${q ? `?${q}` : ""}`, u.origin);
    return NextResponse.redirect(target, 307);
  } catch (err) {
    console.error("[tiktok/poster]", err);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

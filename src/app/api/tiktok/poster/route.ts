import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated 선호: `/api/embed/poster?url=...` (TikTok·YouTube·Instagram 공통)
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl;
  const q = u.searchParams.toString();
  const target = new URL(`/api/embed/poster${q ? `?${q}` : ""}`, u.origin);
  return NextResponse.redirect(target, 307);
}

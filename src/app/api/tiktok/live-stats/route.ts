import { NextRequest, NextResponse } from "next/server";

/**
 * @deprecated 선호: `/api/embed/live-stats?url=...` (공통)
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl;
  const q = u.searchParams.toString();
  const target = new URL(`/api/embed/live-stats${q ? `?${q}` : ""}`, u.origin);
  const res = await fetch(target, { cache: "no-store" });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store, max-age=0",
    },
  });
}

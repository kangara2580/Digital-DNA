import { NextRequest, NextResponse } from "next/server";
import { clearTikTokSessionCookie } from "@/lib/tiktokSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("next") || "/";
  const url = new URL(to, req.nextUrl.origin);
  const res = NextResponse.redirect(url);
  clearTikTokSessionCookie(res);
  return res;
}

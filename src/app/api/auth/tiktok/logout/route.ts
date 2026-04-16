import { NextRequest, NextResponse } from "next/server";
import { clearTikTokSessionCookie, readTikTokSid } from "@/lib/tiktokSession";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("next") || "/";
  const url = new URL(to, req.nextUrl.origin);
  const res = NextResponse.redirect(url);

  const sid = readTikTokSid(req);
  if (sid) {
    try {
      await prisma.tikTokAuthSession.delete({
        where: { sessionId: sid },
      });
    } catch {
      
    }
  }

  clearTikTokSessionCookie(res);
  return res;
}


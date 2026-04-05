import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cronAuth";
import { scanStaleListings } from "@/lib/staleListingScanner";

/** Vercel Cron은 UTC 기준 — vercel.json의 0 15 * * * 는 한국 자정에 가깝게 맞춘 예시입니다. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await scanStaleListings();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}

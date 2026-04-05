import { NextResponse } from "next/server";
import { getFlashSaleVideos, videoRowToFeedVideo } from "@/lib/flashSaleVideos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const rows = await getFlashSaleVideos(48);
  return NextResponse.json({
    videos: rows.map(videoRowToFeedVideo),
  });
}

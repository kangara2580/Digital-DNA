import { NextResponse } from "next/server";
import { getFlashSaleVideos, videoRowToFeedVideo } from "@/lib/flashSaleVideos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getFlashSaleVideos(48);
    return NextResponse.json({
      videos: rows.map(videoRowToFeedVideo),
    });
  } catch (err) {
    console.error("[videos/flash-sale]", err);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}

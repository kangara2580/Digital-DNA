import { NextRequest, NextResponse } from "next/server";
import {
  getBehaviorSummary,
  pushBehaviorEvent,
} from "@/lib/behaviorAnalyticsStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EventType =
  | "background_preview_applied"
  | "font_selected"
  | "draft_saved";

type Payload = {
  type?: EventType;
  keyword?: string;
  mode?: "video" | "image";
  fontFamily?: string;
  videoId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    if (!body?.type) {
      return NextResponse.json({ error: "type_required" }, { status: 400 });
    }
    pushBehaviorEvent({
      type: body.type,
      keyword: typeof body.keyword === "string" ? body.keyword : undefined,
      mode: body.mode === "image" ? "image" : body.mode === "video" ? "video" : undefined,
      fontFamily:
        typeof body.fontFamily === "string" ? body.fontFamily : undefined,
      videoId: typeof body.videoId === "string" ? body.videoId : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json(getBehaviorSummary());
}

import { NextRequest, NextResponse } from "next/server";
import { fetchExternalLiveStats } from "@/lib/externalEmbed/liveStatsServer";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";
import type { ExternalProvider } from "@/lib/externalEmbed/types";

/**
 * 외부 미디어 URL로 조회수·좋아요(플랫폼별 최대한 근접) 조회.
 * TikTok 레거시: `videoId` 숫자만 넘기면 TikTok으로 처리합니다.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  const rawVideoId = request.nextUrl.searchParams.get("videoId")?.trim();

  let provider: ExternalProvider;
  let canonicalKey: string;

  const parsed = rawUrl ? parseExternalMediaUrl(rawUrl) : null;
  if (parsed) {
    provider = parsed.provider;
    canonicalKey = parsed.canonicalKey;
  } else if (rawVideoId && /^\d{10,20}$/.test(rawVideoId)) {
    provider = "tiktok";
    canonicalKey = rawVideoId;
  } else {
    return NextResponse.json(
      { error: "missing or invalid url (or legacy videoId)" },
      { status: 400 },
    );
  }

  const stats = await fetchExternalLiveStats(provider, canonicalKey);
  if (!stats) {
    return NextResponse.json({ error: "stats unavailable" }, { status: 502 });
  }

  return NextResponse.json(
    {
      ...stats,
      /** @deprecated 하위 호환 — TikTok embed id 등 */
      videoId: stats.canonicalKey,
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}

import { NextRequest, NextResponse } from "next/server";
import { extractTikTokVideoIdFromUrl } from "@/lib/tiktokUrlParse";

type TikTokLiveStats = {
  videoId: string;
  authorUniqueId: string | null;
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
};

function parseFirstInt(html: string, key: string): number | null {
  const re = new RegExp(`"${key}":(\\d+)`);
  const m = html.match(re);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * TikTok 공식 embed HTML에 포함된 공개 수치를 읽습니다.
 * (별도 OAuth 없이 조회 가능한 필드: 조회/좋아요/댓글/공유)
 */
function parseLiveStatsFromEmbedHtml(html: string, videoId: string): TikTokLiveStats | null {
  const playCount = parseFirstInt(html, "playCount");
  const diggCount = parseFirstInt(html, "diggCount");
  const commentCount = parseFirstInt(html, "commentCount");
  const shareCount = parseFirstInt(html, "shareCount");
  if (
    playCount == null ||
    diggCount == null ||
    commentCount == null ||
    shareCount == null
  ) {
    return null;
  }

  const uidMatch = html.match(/"uniqueId":"([^"]+)"/);
  return {
    videoId,
    authorUniqueId: uidMatch?.[1] ?? null,
    playCount,
    diggCount,
    commentCount,
    shareCount,
  };
}

export async function GET(request: NextRequest) {
  const rawVideoId = request.nextUrl.searchParams.get("videoId")?.trim();
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();

  let videoId: string;
  if (rawVideoId && /^\d{10,20}$/.test(rawVideoId)) {
    videoId = rawVideoId;
  } else {
    if (!rawUrl) {
      return NextResponse.json({ error: "missing url or videoId" }, { status: 400 });
    }
    try {
      videoId = extractTikTokVideoIdFromUrl(rawUrl);
    } catch {
      return NextResponse.json({ error: "invalid tiktok video url" }, { status: 400 });
    }
  }

  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
  const res = await fetch(embedUrl, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "embed fetch failed" }, { status: 502 });
  }

  const html = await res.text();
  const parsed = parseLiveStatsFromEmbedHtml(html, videoId);
  if (!parsed) {
    return NextResponse.json({ error: "stats not found in embed html" }, { status: 502 });
  }

  return NextResponse.json(parsed, {
    headers: {
      "cache-control": "no-store, max-age=0",
    },
  });
}

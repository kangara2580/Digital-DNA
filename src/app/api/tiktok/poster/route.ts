import { NextRequest, NextResponse } from "next/server";
import { tryExtractTikTokVideoIdFromUrl } from "@/lib/tiktokUrlParse";

/**
 * TikTok `api/img?itemId=` 는 브라우저·서버 모두 403이 나는 경우가 많아,
 * 공개 oEmbed JSON의 `thumbnail_url`(CDN)으로 302 리다이렉트합니다.
 * `<img src="/api/tiktok/poster?url=...">` 로 사용합니다.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();
  if (!raw) {
    return NextResponse.json({ error: "missing url" }, { status: 400 });
  }

  let pageUrl: URL;
  try {
    pageUrl = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (pageUrl.protocol !== "https:") {
    return NextResponse.json({ error: "https only" }, { status: 400 });
  }
  const host = pageUrl.hostname.toLowerCase();
  if (!host.endsWith("tiktok.com")) {
    return NextResponse.json({ error: "not tiktok" }, { status: 400 });
  }
  if (!tryExtractTikTokVideoIdFromUrl(pageUrl.toString())) {
    return NextResponse.json({ error: "not a tiktok video url" }, { status: 400 });
  }

  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
    pageUrl.toString(),
  )}`;

  const res = await fetch(oembedUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "oembed failed" }, { status: 502 });
  }

  const data = (await res.json()) as { thumbnail_url?: string };
  const thumb = data.thumbnail_url?.trim();
  if (!thumb?.startsWith("https://")) {
    return NextResponse.json({ error: "no thumbnail" }, { status: 404 });
  }

  return NextResponse.redirect(thumb, 302);
}

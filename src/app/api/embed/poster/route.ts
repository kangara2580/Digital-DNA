import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedExternalMediaHost,
  parseExternalMediaUrl,
} from "@/lib/externalEmbed/parseUrl";
import { resolvePosterThumbnailHttpsUrl } from "@/lib/externalEmbed/posterServer";

/**
 * 외부 릴스 URL(TikTok·YouTube·Instagram) → 썸네일 HTTPS 로 302.
 * `<img src="/api/embed/poster?url=...">` 형태로 사용합니다.
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
  if (!isAllowedExternalMediaHost(pageUrl.hostname)) {
    return NextResponse.json({ error: "unsupported host" }, { status: 400 });
  }

  const parsed = parseExternalMediaUrl(pageUrl.toString());
  if (!parsed) {
    return NextResponse.json(
      { error: "unsupported or invalid media url" },
      { status: 400 },
    );
  }

  const thumb = await resolvePosterThumbnailHttpsUrl(parsed);
  if (!thumb?.startsWith("https://")) {
    return NextResponse.json({ error: "no thumbnail" }, { status: 404 });
  }

  return NextResponse.redirect(thumb, 302);
}

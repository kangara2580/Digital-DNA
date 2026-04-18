import type { ParsedExternalMediaUrl } from "./types";

async function fetchJsonOembedThumb(
  oembedUrl: string,
): Promise<string | null> {
  const res = await fetch(oembedUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { thumbnail_url?: string };
  const thumb = data.thumbnail_url?.trim();
  return thumb?.startsWith("https://") ? thumb : null;
}

async function tiktokPosterFromPageUrl(pageUrl: string): Promise<string | null> {
  const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(pageUrl)}`;
  return fetchJsonOembedThumb(oembedUrl);
}

async function youtubePosterFromPageUrl(pageUrl: string): Promise<string | null> {
  const oembedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(pageUrl)}`;
  return fetchJsonOembedThumb(oembedUrl);
}

/**
 * Instagram: 공식 oEmbed는 토큰·제한이 잦아 embed HTML의 og:image를 우선 시도합니다.
 */
async function instagramPosterFromShortcode(
  shortcode: string,
  pageUrl: string,
): Promise<string | null> {
  const tryUrls = [
    `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/`,
    `https://www.instagram.com/reel/${encodeURIComponent(shortcode)}/embed/captioned/`,
    pageUrl.endsWith("/") ? pageUrl : `${pageUrl}/`,
  ];

  for (const embedPage of tryUrls) {
    try {
      const res = await fetch(embedPage, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        next: { revalidate: 600 },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const og =
        html.match(/property="og:image"\s+content="([^"]+)"/i) ??
        html.match(/content="([^"]+)"\s+property="og:image"/i);
      const u = og?.[1]?.trim();
      if (u?.startsWith("https://")) return u;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function resolvePosterThumbnailHttpsUrl(
  parsed: ParsedExternalMediaUrl,
): Promise<string | null> {
  switch (parsed.provider) {
    case "tiktok":
      return tiktokPosterFromPageUrl(parsed.pageUrl);
    case "youtube":
      return youtubePosterFromPageUrl(parsed.pageUrl);
    case "instagram":
      return instagramPosterFromShortcode(parsed.canonicalKey, parsed.pageUrl);
    default:
      return null;
  }
}

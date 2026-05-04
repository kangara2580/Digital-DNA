import {
  extractTikTokVideoIdFromUrl,
  TikTokUrlParseError,
} from "@/lib/tiktokUrlParse";
import type { ExternalProvider, ParsedExternalMediaUrl } from "./types";

const YT_ID_RE = /^[\w-]{11}$/;

function normalizePageUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

/** youtu.be, youtube.com/watch, /shorts/, /embed/, music.youtube.com */
export function tryExtractYoutubeVideoId(raw: string): string | null {
  const u = normalizePageUrl(raw);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = u.pathname.replace(/^\//, "").split("/")[0] ?? "";
    return YT_ID_RE.test(id) ? id : null;
  }
  if (
    !host.endsWith("youtube.com") &&
    !host.endsWith("youtube-nocookie.com")
  ) {
    return null;
  }
  const v = u.searchParams.get("v");
  if (v && YT_ID_RE.test(v)) return v;
  const pathMatch = u.pathname.match(
    /\/(?:shorts|embed|live|v)\/([\w-]{11})(?:\/|$)/,
  );
  if (pathMatch?.[1] && YT_ID_RE.test(pathMatch[1])) return pathMatch[1];
  return null;
}

/** /reel/, /p/, /tv/ — shortcode */
export function tryExtractInstagramShortcode(raw: string): string | null {
  const u = normalizePageUrl(raw);
  if (!u) return null;
  const host = u.hostname.toLowerCase();
  if (!host.endsWith("instagram.com") && !host.endsWith("instagr.am")) {
    return null;
  }
  const m = u.pathname.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  const code = m?.[1];
  if (!code || code.length < 5) return null;
  return code;
}

/**
 * 지원: TikTok 영상 페이지, YouTube watch/shorts, Instagram 동영상·게시물.
 * 단축 URL(vm.tiktok 등)은 id 추출 전 리다이렉트가 필요해 여기서는 제외됩니다.
 */
export function parseExternalMediaUrl(raw: string): ParsedExternalMediaUrl | null {
  const u = normalizePageUrl(raw);
  if (!u) return null;
  const host = u.hostname.toLowerCase();

  if (host.endsWith("tiktok.com")) {
    try {
      const canonicalKey = extractTikTokVideoIdFromUrl(u.toString());
      return {
        provider: "tiktok",
        pageUrl: u.toString(),
        canonicalKey,
      };
    } catch (e) {
      if (process.env.NODE_ENV === "development" && e instanceof TikTokUrlParseError) {
        console.warn("[externalEmbed] TikTok URL 파싱 실패:", raw, e.message);
      }
      return null;
    }
  }

  const yt = tryExtractYoutubeVideoId(u.toString());
  if (yt) {
    const pageUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(yt)}`;
    return { provider: "youtube", pageUrl, canonicalKey: yt };
  }

  const ig = tryExtractInstagramShortcode(u.toString());
  if (ig) {
    return {
      provider: "instagram",
      pageUrl: u.toString(),
      canonicalKey: ig,
    };
  }

  return null;
}

/** @internal 빠른 호스트 검사(라우트 검증용) */
export function isAllowedExternalMediaHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h.endsWith("tiktok.com") ||
    h.endsWith("youtube.com") ||
    h.endsWith("youtube-nocookie.com") ||
    h === "youtu.be" ||
    h.endsWith("instagram.com") ||
    h.endsWith("instagr.am")
  );
}

export function liveStatsMapKey(
  provider: ExternalProvider,
  canonicalKey: string,
): string {
  return `${provider}:${canonicalKey}`;
}

/** FeedVideo 기준 실시간 통계 캐시 키 */
export function liveStatsKeyFromFeedVideo(v: {
  tiktokEmbedId?: string;
  youtubeVideoId?: string;
  instagramShortcode?: string;
}): string | null {
  if (v.tiktokEmbedId) return liveStatsMapKey("tiktok", v.tiktokEmbedId);
  if (v.youtubeVideoId) return liveStatsMapKey("youtube", v.youtubeVideoId);
  if (v.instagramShortcode)
    return liveStatsMapKey("instagram", v.instagramShortcode);
  return null;
}

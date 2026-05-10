import type { FeedVideo } from "@/data/videos";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";

/** 영상 콘텐츠 출처 — 외부 3플랫폼 링크 vs 사이트 직접 업로드(MP4 등) */
export type VideoContentSource = "tiktok" | "youtube" | "instagram" | "upload";

function inferFromUrlSubstring(raw?: string | null): VideoContentSource | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (
    v.includes("tiktok.com/") ||
    v.includes("vm.tiktok.com/") ||
    v.includes("vt.tiktok.com/")
  ) {
    return "tiktok";
  }
  if (v.includes("youtube.com/") || v.includes("youtu.be/")) return "youtube";
  if (v.includes("instagram.com/") || v.includes("instagr.am/")) return "instagram";
  return null;
}

/** 임베드 URL(`youtube-nocookie.com/embed` 등) 전용 휴리스틱 */
function inferFromHostPath(raw?: string | null): VideoContentSource | null {
  if (!raw?.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (v.includes("tiktok.com")) return "tiktok";
  if (v.includes("youtube.com") || v.includes("youtube-nocookie.com") || v.includes("youtu.be"))
    return "youtube";
  if (v.includes("instagram.com")) return "instagram";
  return null;
}

function tryStructured(raw?: string | null): VideoContentSource | null {
  if (!raw?.trim()) return null;
  const p = parseExternalMediaUrl(raw);
  return p?.provider ?? null;
}

/**
 * URL·임베드 id 필드를 종합해 출처 판별.
 * 판매 등록 시 소셜 URL이면 DB `src`에 임베드 주소가 들어가도 호스트로 판별 가능합니다.
 */
export function getVideoContentSource(video: FeedVideo): VideoContentSource {
  if (video.tiktokEmbedId) return "tiktok";
  if (video.youtubeVideoId) return "youtube";
  if (video.instagramShortcode) return "instagram";

  const urls = [video.sourcePageUrl, video.src, video.previewSrc];
  for (const url of urls) {
    const s = tryStructured(url);
    if (s) return s;
  }
  for (const url of urls) {
    const s = inferFromUrlSubstring(url);
    if (s) return s;
  }
  for (const url of urls) {
    const s = inferFromHostPath(url);
    if (s) return s;
  }
  return "upload";
}

export function videoContentSourceAriaLabel(source: VideoContentSource): string {
  switch (source) {
    case "tiktok":
      return "TikTok 출처 영상";
    case "youtube":
      return "YouTube 출처 영상";
    case "instagram":
      return "Instagram 출처 영상";
    default:
      return "직접 업로드 영상";
  }
}

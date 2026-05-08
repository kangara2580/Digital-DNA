import type { FeedVideo } from "@/data/videos";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";

/**
 * Kling motion-control 등에 넘길 참조 영상 URL.
 * 우선순위: 배경 오버라이드 → 서버 추출 MP4 → 직접 MP4/로컬 경로 → 마지막으로 src(페이지 URL이면 API 실패 가능).
 */
export function resolveKlingMotionVideoUrl(
  v: FeedVideo,
  bgOverride: string | null | undefined,
): string {
  const o = bgOverride?.trim();
  if (o) return o;
  const p = v.processedVideoUrl?.trim();
  if (p) return p;
  const s = v.src.trim();
  if (s.startsWith("/")) return s;
  if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(s.split("?")[0] ?? "")) return s;
  try {
    const u = new URL(s);
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(u.pathname)) return s;
  } catch {
    /* noop */
  }
  return s;
}

/** 소셜 페이지 URL만 있고 아직 MP4를 뽑지 않은 경우 */
export function needsServerMp4Extraction(v: FeedVideo): boolean {
  if (v.processedVideoUrl?.trim()) return false;
  if (v.processedVideoStatus === "failed" || v.processedVideoStatus === "skipped") {
    return false;
  }
  if (v.processedVideoStatus === "ready" && !v.processedVideoUrl) return false;
  const s = v.src.trim();
  if (s.startsWith("/")) return false;
  if (/^https?:\/\//i.test(s) && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(s.split("?")[0] ?? "")) {
    return false;
  }
  return Boolean(parseExternalMediaUrl(s));
}

import type { FeedVideo } from "@/data/videos";

/** 카드용 — TikTok player v1 (최소 UI) */
export function buildTikTokCardPlayerUrl(videoId: string): string {
  const u = new URL(`https://www.tiktok.com/player/v1/${videoId}`);
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("muted", "1");
  u.searchParams.set("loop", "1");
  u.searchParams.set("controls", "0");
  u.searchParams.set("progress_bar", "0");
  u.searchParams.set("play_button", "0");
  u.searchParams.set("volume_control", "0");
  u.searchParams.set("fullscreen_button", "0");
  u.searchParams.set("timestamp", "0");
  u.searchParams.set("description", "0");
  u.searchParams.set("music_info", "0");
  u.searchParams.set("rel", "0");
  u.searchParams.set("native_context_menu", "0");
  return u.toString();
}

/** 상세용 — 컨트롤 일부 노출 */
export function buildTikTokDetailPlayerUrl(videoId: string): string {
  const u = new URL(`https://www.tiktok.com/player/v1/${videoId}`);
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("muted", "1");
  u.searchParams.set("loop", "1");
  u.searchParams.set("controls", "1");
  u.searchParams.set("progress_bar", "1");
  u.searchParams.set("play_button", "1");
  u.searchParams.set("volume_control", "1");
  u.searchParams.set("fullscreen_button", "0");
  u.searchParams.set("timestamp", "0");
  u.searchParams.set("description", "0");
  u.searchParams.set("music_info", "0");
  u.searchParams.set("rel", "0");
  u.searchParams.set("native_context_menu", "0");
  return u.toString();
}

export function buildYoutubeCardEmbedUrl(videoId: string): string {
  const u = new URL(`https://www.youtube.com/embed/${videoId}`);
  u.searchParams.set("playsinline", "1");
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("mute", "1");
  u.searchParams.set("loop", "1");
  u.searchParams.set("playlist", videoId);
  u.searchParams.set("controls", "0");
  u.searchParams.set("modestbranding", "1");
  u.searchParams.set("rel", "0");
  return u.toString();
}

export function buildYoutubeDetailEmbedUrl(videoId: string): string {
  const u = new URL(`https://www.youtube.com/embed/${videoId}`);
  u.searchParams.set("playsinline", "1");
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("mute", "0");
  u.searchParams.set("controls", "1");
  u.searchParams.set("modestbranding", "1");
  u.searchParams.set("rel", "0");
  return u.toString();
}

/** Instagram — /p/ shortcode 가 릴·피드 공통으로 embed 지원 */
export function buildInstagramEmbedUrl(shortcode: string): string {
  return `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/?cr=1&v=14`;
}

export type ExternalIframeKind = "tiktok" | "youtube" | "instagram";

export function getExternalIframeForCard(
  v: FeedVideo,
): { kind: ExternalIframeKind; src: string } | null {
  if (v.tiktokEmbedId) {
    return { kind: "tiktok", src: buildTikTokCardPlayerUrl(v.tiktokEmbedId) };
  }
  if (v.youtubeVideoId) {
    return {
      kind: "youtube",
      src: buildYoutubeCardEmbedUrl(v.youtubeVideoId),
    };
  }
  if (v.instagramShortcode) {
    return {
      kind: "instagram",
      src: buildInstagramEmbedUrl(v.instagramShortcode),
    };
  }
  return null;
}

export function getExternalIframeForDetail(
  v: FeedVideo,
): { kind: ExternalIframeKind; src: string } | null {
  if (v.tiktokEmbedId) {
    return { kind: "tiktok", src: buildTikTokDetailPlayerUrl(v.tiktokEmbedId) };
  }
  if (v.youtubeVideoId) {
    return {
      kind: "youtube",
      src: buildYoutubeDetailEmbedUrl(v.youtubeVideoId),
    };
  }
  if (v.instagramShortcode) {
    return {
      kind: "instagram",
      src: buildInstagramEmbedUrl(v.instagramShortcode),
    };
  }
  return null;
}

/** 실시간 지표 API에 넘길 정규 페이지 URL (없으면 id로 복원) */
export function getExternalLiveStatsPageUrl(v: FeedVideo): string | null {
  const s = v.sourcePageUrl?.trim();
  if (s) return s;
  if (v.tiktokEmbedId) {
    return `https://www.tiktok.com/@reels/video/${encodeURIComponent(v.tiktokEmbedId)}`;
  }
  if (v.youtubeVideoId) {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeVideoId)}`;
  }
  if (v.instagramShortcode) {
    return `https://www.instagram.com/reel/${encodeURIComponent(v.instagramShortcode)}/`;
  }
  return null;
}

import type { FeedVideo } from "@/data/videos";
import { getMarketVideoById } from "@/data/videoCommerce";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";
import { sanitizePosterSrc } from "@/lib/videoPoster";

/** 카드·장바구니 공통 — id 기반 SVG 그라데이션(404 방지) */
export function feedVideoGradientPosterDataUrl(videoId: string): string {
  const hash = Array.from(videoId).reduce(
    (acc, ch) => (acc * 33 + ch.charCodeAt(0)) >>> 0,
    11,
  );
  const hueA = hash % 360;
  const hueB = (hueA + 64) % 360;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='1280' viewBox='0 0 720 1280'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='hsl(${hueA},82%,44%)'/><stop offset='100%' stop-color='hsl(${hueB},88%,55%)'/></linearGradient></defs><rect width='720' height='1280' fill='#050505'/><rect x='24' y='24' width='672' height='1232' rx='42' fill='url(#g)' opacity='0.86'/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function pickDisplayPoster(raw?: string | null): string | undefined {
  const t = raw?.trim();
  if (!t) return undefined;
  const sanitized = sanitizePosterSrc(t);
  if (sanitized) return sanitized;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("/api/")) return t;
  if (t.startsWith("data:image/")) return t;
  return undefined;
}

function posterFromExternalSrc(src: string): string | undefined {
  const ext = parseExternalMediaUrl(src);
  if (!ext) return undefined;
  if (ext.provider === "youtube") {
    return `https://img.youtube.com/vi/${ext.canonicalKey}/hqdefault.jpg`;
  }
  return `/api/embed/poster?url=${encodeURIComponent(ext.pageUrl)}`;
}

/** Supabase 장바구니 JSON이 poster를 비운 경우 카탈로그·외부 URL로 보강 */
export function enrichCartFeedVideo(video: FeedVideo): FeedVideo {
  const catalog = getMarketVideoById(video.id);
  const merged: FeedVideo = catalog
    ? {
        ...catalog,
        ...video,
        poster: pickDisplayPoster(video.poster) ?? catalog.poster,
        src: video.src?.trim() || catalog.src,
        title: video.title?.trim() || catalog.title,
        creator: video.creator?.trim() || catalog.creator,
        orientation: video.orientation || catalog.orientation,
        priceWon: video.priceWon ?? catalog.priceWon,
        listing: video.listing ?? catalog.listing,
        sourcePageUrl: video.sourcePageUrl ?? catalog.sourcePageUrl,
        previewSrc: video.previewSrc ?? catalog.previewSrc,
      }
    : { ...video };

  if (!pickDisplayPoster(merged.poster)) {
    const fromPage = merged.sourcePageUrl?.trim();
    if (fromPage?.startsWith("http")) {
      merged.poster = `/api/embed/poster?url=${encodeURIComponent(fromPage)}`;
    } else {
      const fromSrc = posterFromExternalSrc(merged.src);
      if (fromSrc) merged.poster = fromSrc;
    }
  }

  return merged;
}

/** `<img src>` — 항상 유효한 문자열(빈 src·없는 sample jpg 방지) */
export function resolveFeedVideoThumbnailSrc(video: FeedVideo): string {
  const v = enrichCartFeedVideo(video);

  const poster = pickDisplayPoster(v.poster);
  if (poster) return poster;

  const preview = pickDisplayPoster(v.previewSrc);
  if (preview) return preview;

  const fromPage = v.sourcePageUrl?.trim();
  if (fromPage?.startsWith("http")) {
    return `/api/embed/poster?url=${encodeURIComponent(fromPage)}`;
  }

  const fromSrc = posterFromExternalSrc(v.src);
  if (fromSrc) return fromSrc;

  const src = v.src?.trim() ?? "";
  if (/\.(webp|jpg|jpeg|png|gif|avif)(\?|$)/i.test(src) && src.startsWith("http")) {
    return src;
  }

  return feedVideoGradientPosterDataUrl(v.id);
}

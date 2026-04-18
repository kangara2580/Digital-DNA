import type { ExternalLiveStats, ExternalProvider } from "./types";

function parseHumanNumberView(raw: string): number | null {
  const s = raw
    .replace(/조회수|views|view|회|시청/gi, "")
    .replace(/,/g, "")
    .trim();
  const m = s.match(/^([\d.]+)\s*([KMkm억만]?)/);
  if (!m) {
    const n = Number.parseInt(s.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  const base = Number.parseFloat(m[1]);
  if (!Number.isFinite(base)) return null;
  const unit = (m[2] || "").toUpperCase();
  if (unit === "K") return Math.round(base * 1_000);
  if (unit === "M") return Math.round(base * 1_000_000);
  if (unit === "억") return Math.round(base * 100_000_000);
  if (unit === "만") return Math.round(base * 10_000);
  return Math.round(base);
}

function parseHumanNumberLike(raw: string): number | null {
  const s = raw
    .replace(/likes|like|좋아요|개/gi, "")
    .replace(/,/g, "")
    .trim();
  const m = s.match(/^([\d.]+)\s*([KMkm억만]?)/);
  if (!m) {
    const n = Number.parseInt(s.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }
  const base = Number.parseFloat(m[1]);
  if (!Number.isFinite(base)) return null;
  const unit = (m[2] || "").toUpperCase();
  if (unit === "K") return Math.round(base * 1_000);
  if (unit === "M") return Math.round(base * 1_000_000);
  if (unit === "억") return Math.round(base * 100_000_000);
  if (unit === "만") return Math.round(base * 10_000);
  return Math.round(base);
}

async function tiktokLiveStatsFromEmbed(
  videoId: string,
): Promise<ExternalLiveStats | null> {
  const embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
  const res = await fetch(embedUrl, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();

  function parseFirstInt(key: string): number | null {
    const re = new RegExp(`"${key}":(\\d+)`);
    const m = html.match(re);
    if (!m?.[1]) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }

  const playCount = parseFirstInt("playCount");
  const diggCount = parseFirstInt("diggCount");
  const commentCount = parseFirstInt("commentCount");
  const shareCount = parseFirstInt("shareCount");
  if (
    playCount == null ||
    diggCount == null ||
    commentCount == null ||
    shareCount == null
  ) {
    return null;
  }

  return {
    provider: "tiktok",
    canonicalKey: videoId,
    playCount,
    diggCount,
  };
}

async function youtubeLiveStatsFromWatchPage(
  videoId: string,
): Promise<ExternalLiveStats | null> {
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();

  let playCount: number | null = null;
  let diggCount: number | null = null;

  const vcSimple = html.match(
    /"viewCount":\{"simpleText":"([^"]+)"/,
  );
  if (vcSimple?.[1]) {
    playCount = parseHumanNumberView(vcSimple[1]);
  }
  if (playCount == null) {
    const vcAlt = html.match(/"shortViewCount":\{"simpleText":"([^"]+)"/);
    if (vcAlt?.[1]) playCount = parseHumanNumberView(vcAlt[1]);
  }
  if (playCount == null) {
    const m = html.match(/"viewCount":"(\d+)"/);
    if (m?.[1]) playCount = Number(m[1]);
  }

  const likePatterns = [
    /"likeCount":(\d+)/,
    /"likeCount":"(\d+)"/,
    /"videoLikeCountRenderer"[\s\S]{0,800}?"simpleText":"([^"]+)"/,
  ];
  for (const re of likePatterns) {
    const m = html.match(re);
    if (m?.[1]) {
      diggCount = m[1].includes(",")
        ? Number.parseInt(m[1].replace(/,/g, ""), 10)
        : parseHumanNumberLike(m[1]);
      if (diggCount != null && Number.isFinite(diggCount)) break;
    }
  }

  if (playCount == null || !Number.isFinite(playCount)) return null;

  return {
    provider: "youtube",
    canonicalKey: videoId,
    playCount,
    diggCount: diggCount != null && Number.isFinite(diggCount) ? diggCount : 0,
    partial: diggCount == null || !Number.isFinite(diggCount),
  };
}

async function instagramLiveStatsFromEmbed(
  shortcode: string,
): Promise<ExternalLiveStats | null> {
  const embedUrl = `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    cache: "no-store",
    headers: {
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return null;
  const html = await res.text();

  let playCount: number | null = null;
  let diggCount: number | null = null;

  const vc = html.match(/"video_view_count":(\d+)/);
  if (vc?.[1]) playCount = Number(vc[1]);

  const edge = html.match(/"edge_media_preview_like":\{"count":(\d+)/);
  if (edge?.[1]) diggCount = Number(edge[1]);

  if (diggCount == null) {
    const alt = html.match(/"like_count":(\d+)/);
    if (alt?.[1]) diggCount = Number(alt[1]);
  }

  if (playCount == null && diggCount == null) return null;

  return {
    provider: "instagram",
    canonicalKey: shortcode,
    playCount: playCount ?? 0,
    diggCount: diggCount ?? 0,
    partial: playCount == null || diggCount == null,
  };
}

export async function fetchExternalLiveStats(
  provider: ExternalProvider,
  canonicalKey: string,
): Promise<ExternalLiveStats | null> {
  switch (provider) {
    case "tiktok":
      return tiktokLiveStatsFromEmbed(canonicalKey);
    case "youtube":
      return youtubeLiveStatsFromWatchPage(canonicalKey);
    case "instagram":
      return instagramLiveStatsFromEmbed(canonicalKey);
    default:
      return null;
  }
}

import type { FeedVideo } from "@/data/videos";
import type { ExternalProvider } from "@/lib/externalEmbed/types";
import { parseExternalMediaUrl } from "@/lib/externalEmbed/parseUrl";

/** 수동 랭킹 한 줄 — TikTok·YouTube·Instagram 공유 URL */
export type TikTokManualRankItem = {
  id: number;
  url: string;
  provider: ExternalProvider;
  /** 플랫폼별 콘텐츠 키 (TikTok 숫자 id / YouTube 11자 / IG shortcode) */
  canonicalKey: string;
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Vercel 환경변수: `NEXT_PUBLIC_TRENDING_TIKTOK_URLS`
 * (이름은 TikTok 시절 호환용이며, 값은 TikTok·YouTube·Instagram URL을 섞어 넣을 수 있습니다.)
 *
 * 예시:
 * [{"id":1,"url":"https://www.tiktok.com/@u/video/123..."},
 *  {"id":2,"url":"https://www.youtube.com/watch?v=..."},
 *  {"id":3,"url":"https://www.instagram.com/reel/.../"}]
 *
 * 썸네일: `/api/embed/poster?url=...` (플랫폼별 oEmbed·og:image)
 * 실시간 지표: `/api/embed/live-stats?url=...`
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/** 파일 기본 랭킹 — TikTok URL (YouTube·IG 테스트 시 env 또는 여기에 URL 교체) */
export const FILE_RAW_MANUAL_TIKTOK_URLS: { id: number; url: string }[] = [
  {
    id: 1,
    url: "https://www.tiktok.com/@d.xye03/video/7628586216069418261?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 2,
    url: "https://www.tiktok.com/@mika1130_4/video/7617745412262300936?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 3,
    url: "https://www.tiktok.com/@flowater_0414/video/7627546963080416520?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 4,
    url: "https://www.tiktok.com/@_marioi0/video/7628867375286324488?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 5,
    url: "https://www.tiktok.com/@dkssudwkendi5/video/7626765688992156936?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 6,
    url: "https://www.tiktok.com/@dkssudwkendi5/video/7626765688992156936?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 7,
    url: "https://www.tiktok.com/@oezxcn/video/7627723496013024519?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 8,
    url: "https://www.tiktok.com/@yerin01231/video/7618544826010651925?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 9,
    url: "https://www.tiktok.com/@funny88.88/video/7625163845547363606?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
  {
    id: 10,
    url: "https://www.tiktok.com/@sunn416/video/7617020596823592212?is_from_webapp=1&sender_device=pc&web_id=7629249308466775570",
  },
];

function buildItemsFromFileRaw(): TikTokManualRankItem[] {
  const out: TikTokManualRankItem[] = [];
  for (const row of FILE_RAW_MANUAL_TIKTOK_URLS) {
    const parsed = parseExternalMediaUrl(row.url);
    if (!parsed) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[tiktokData] URL 건너뜀 (지원하지 않는 형식):", row.url);
      }
      continue;
    }
    out.push({
      id: row.id,
      url: parsed.pageUrl,
      provider: parsed.provider,
      canonicalKey: parsed.canonicalKey,
    });
  }
  return out.sort((a, b) => a.id - b.id);
}

function parseRankingFromEnv(): TikTokManualRankItem[] | null {
  const raw = process.env.NEXT_PUBLIC_TRENDING_TIKTOK_URLS?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const out: TikTokManualRankItem[] = [];
    for (const row of parsed) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof (row as { id?: unknown }).id !== "number" ||
        typeof (row as { url?: unknown }).url !== "string"
      ) {
        continue;
      }
      const id = (row as { id: number }).id;
      const url = (row as { url: string }).url;
      const hit = parseExternalMediaUrl(url);
      if (!hit) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[tiktokData] env 항목 건너뜀 (URL 파싱 실패):", url);
        }
        continue;
      }
      out.push({
        id,
        url: hit.pageUrl,
        provider: hit.provider,
        canonicalKey: hit.canonicalKey,
      });
    }
    return out.length ? out.sort((a, b) => a.id - b.id) : null;
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn("[tiktokData] NEXT_PUBLIC_TRENDING_TIKTOK_URLS JSON 파싱 실패");
    }
    return null;
  }
}

export function getTikTokManualRanking(): TikTokManualRankItem[] {
  const fromEnv = parseRankingFromEnv();
  if (fromEnv?.length) return fromEnv;
  return buildItemsFromFileRaw();
}

function rankDemoPriceWon(rankId: number): number {
  return 900 + (rankId % 5) * 300;
}

function feedVideoFromRankItem(item: TikTokManualRankItem): FeedVideo {
  const poster = `/api/embed/poster?url=${encodeURIComponent(item.url)}`;
  const priceWon = rankDemoPriceWon(item.id);
  const title = `${item.id}위`;

  switch (item.provider) {
    case "tiktok":
      return {
        id: `tiktok-rank-${item.id}-${item.canonicalKey}`,
        title,
        creator: "TikTok",
        src: `https://www.tiktok.com/embed/v2/${item.canonicalKey}`,
        poster,
        orientation: "portrait",
        tiktokEmbedId: item.canonicalKey,
        sourcePageUrl: item.url,
        priceWon,
      };
    case "youtube":
      return {
        id: `youtube-rank-${item.id}-${item.canonicalKey}`,
        title,
        creator: "YouTube",
        src: `https://www.youtube.com/embed/${item.canonicalKey}`,
        poster,
        orientation: "portrait",
        youtubeVideoId: item.canonicalKey,
        sourcePageUrl: item.url,
        priceWon,
      };
    case "instagram":
      return {
        id: `instagram-rank-${item.id}-${item.canonicalKey}`,
        title,
        creator: "Instagram",
        src: `https://www.instagram.com/p/${item.canonicalKey}/embed`,
        poster,
        orientation: "portrait",
        instagramShortcode: item.canonicalKey,
        sourcePageUrl: item.url,
        priceWon,
      };
    default: {
      const _exhaustive: never = item.provider;
      return _exhaustive;
    }
  }
}

export function manualTikTokRankingToFeedVideos(
  items: TikTokManualRankItem[],
): FeedVideo[] {
  return items
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((item) => feedVideoFromRankItem(item));
}

/** 상세·스튜디오 — TikTok embed id 로 데모 판매가 */
export function getManualTikTokPriceWonByVideoId(videoId: string): number | undefined {
  const item = getTikTokManualRanking().find(
    (row) => row.provider === "tiktok" && row.canonicalKey === videoId,
  );
  if (!item) return undefined;
  return rankDemoPriceWon(item.id);
}

export function getExternalRankDemoPriceWonByCanonical(
  provider: ExternalProvider,
  canonicalKey: string,
): number | undefined {
  const item = getTikTokManualRanking().find(
    (row) => row.provider === provider && row.canonicalKey === canonicalKey,
  );
  if (!item) return undefined;
  return rankDemoPriceWon(item.id);
}

/**
 * 스튜디오·찜 복원 — `tiktok-…`, `youtube-…`, `instagram-…`, `*-rank-…` id
 */
export function resolveManualTikTokVideoForStudio(videoId: string): FeedVideo | undefined {
  const normalized = videoId.trim();
  if (!normalized) return undefined;

  const pool = manualTikTokRankingToFeedVideos(getTikTokManualRanking());
  if (!pool.length) return undefined;

  const byExact = pool.find((v) => v.id === normalized);
  if (byExact) return byExact;

  if (normalized.startsWith("tiktok-")) {
    const key = normalized.slice("tiktok-".length);
    const v = pool.find((p) => p.tiktokEmbedId === key);
    return v ? { ...v, id: normalized } : undefined;
  }
  if (normalized.startsWith("youtube-")) {
    const key = normalized.slice("youtube-".length);
    const v = pool.find((p) => p.youtubeVideoId === key);
    return v ? { ...v, id: normalized } : undefined;
  }
  if (normalized.startsWith("instagram-")) {
    const key = normalized.slice("instagram-".length);
    const v = pool.find((p) => p.instagramShortcode === key);
    return v ? { ...v, id: normalized } : undefined;
  }
  if (/^\d{10,20}$/.test(normalized)) {
    const v = pool.find((p) => p.tiktokEmbedId === normalized);
    return v ? { ...v, id: normalized } : undefined;
  }
  return undefined;
}

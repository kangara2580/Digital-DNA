import type { FeedVideo } from "@/data/videos";
import {
  extractTikTokVideoIdFromUrl,
  tryExtractTikTokVideoIdFromUrl,
  TikTokUrlParseError,
} from "@/lib/tiktokUrlParse";

/** 수동 랭킹 한 줄 (순위·원본 URL·추출된 video id) */
export type TikTokManualRankItem = {
  id: number;
  originalUrl: string;
  videoId: string;
};

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Vercel 환경변수로 옮길 때 (수동)
 *
 * 1) Vercel → Project → Settings → Environment Variables 에 추가:
 *    이름: NEXT_PUBLIC_TRENDING_TIKTOK_URLS
 *    값:   JSON 배열 문자열 (아래 형식). 한 줄로 넣기 어렵면 Base64로 감싸는 방식은
 *          이 파일에 `getTikTokManualRanking()` 안에서 디코딩 분기만 추가하면 됨.
 *
 *    예시 값:
 *    [{"id":1,"originalUrl":"https://www.tiktok.com/@user/video/123..."},{"id":2,"originalUrl":"..."}]
 *
 * 2) 이 파일의 `FILE_RAW_MANUAL_TIKTOK_URLS` 는 비우거나 유지.
 *    `getTikTokManualRanking()` 에서 `process.env.NEXT_PUBLIC_TRENDING_TIKTOK_URLS` 를
 *    먼저 `JSON.parse` 하고, 비어 있을 때만 파일 배열을 쓰도록 이미 분기함.
 *
 * 3) 서버 전용으로 숨기려면 NEXT_PUBLIC_ 없이 이름을 바꾸고, 랭킹 데이터는
 *    Server Component나 Route Handler에서만 주입하도록 리팩터링해야 함(클라이언트
 *    `TrendingRankSection` 은 빌드 시 번들에 포함된 env만 볼 수 있음).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

/** 파일에만 둘 때: 순위 + 틱톡 영상 페이지 URL ( /@…/video/숫자 형태 권장 ) */
export const FILE_RAW_MANUAL_TIKTOK_URLS: { id: number; originalUrl: string }[] =
  [
    // 예시 — 실제 URL로 교체하거나 빈 배열로 두세요.
    // { id: 1, originalUrl: "https://www.tiktok.com/@example/video/7123456789012345678" },
  ];

function buildItemsFromFileRaw(): TikTokManualRankItem[] {
  const out: TikTokManualRankItem[] = [];
  for (const row of FILE_RAW_MANUAL_TIKTOK_URLS) {
    try {
      const videoId = extractTikTokVideoIdFromUrl(row.originalUrl);
      out.push({
        id: row.id,
        originalUrl: row.originalUrl.trim(),
        videoId,
      });
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[tiktokData] URL 건너뜀:",
          row.originalUrl,
          e instanceof TikTokUrlParseError ? e.message : e,
        );
      }
    }
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
        typeof (row as { originalUrl?: unknown }).originalUrl !== "string"
      ) {
        continue;
      }
      const { id, originalUrl } = row as { id: number; originalUrl: string };
      const videoId = tryExtractTikTokVideoIdFromUrl(originalUrl);
      if (!videoId) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[tiktokData] env 항목 건너뜀 (video id 추출 실패):", originalUrl);
        }
        continue;
      }
      out.push({ id, originalUrl: originalUrl.trim(), videoId });
    }
    return out.length ? out.sort((a, b) => a.id - b.id) : null;
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.warn("[tiktokData] NEXT_PUBLIC_TRENDING_TIKTOK_URLS JSON 파싱 실패");
    }
    return null;
  }
}

/**
 * 최종 수동 랭킹 목록.
 * - `NEXT_PUBLIC_TRENDING_TIKTOK_URLS` 가 유효하면 그걸 우선.
 * - 아니면 `FILE_RAW_MANUAL_TIKTOK_URLS` 기준.
 */
export function getTikTokManualRanking(): TikTokManualRankItem[] {
  const fromEnv = parseRankingFromEnv();
  if (fromEnv?.length) return fromEnv;
  return buildItemsFromFileRaw();
}

/**
 * `TrendingRankSection` → `VideoCard`용 `FeedVideo[]`.
 * 틱톡 공식 임베드: `tiktokEmbedId` + `src` 는 embed URL (VideoCard가 iframe으로 재생).
 */
export function manualTikTokRankingToFeedVideos(
  items: TikTokManualRankItem[],
): FeedVideo[] {
  return items
    .slice()
    .sort((a, b) => a.id - b.id)
    .map((item) => ({
      id: `tiktok-rank-${item.id}-${item.videoId}`,
      title: `인기 ${item.id}위`,
      creator: "TikTok",
      src: `https://www.tiktok.com/embed/v2/${item.videoId}`,
      poster: "",
      orientation: "portrait" as const,
      tiktokEmbedId: item.videoId,
      priceWon: 900 + (item.id % 5) * 300,
    }));
}

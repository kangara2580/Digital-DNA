import { getMarketVideoById } from "@/data/videoCommerce";
import { resolveManualTikTokVideoForStudio } from "@/data/tiktokData";
import type { FeedVideo } from "@/data/videos";
import { VIDEO_TITLE_EN_BY_ID } from "@/data/videoTitlesEn";
import type { SiteLocale } from "@/lib/sitePreferences";

/** 최소 필드 — 알림 API 등 전체 `FeedVideo` 없이 제목만 있을 때 */
export type VideoTitleFields = Pick<FeedVideo, "id" | "title"> & {
  titleEn?: string;
};

const RANK_TITLE_KO = /^(\d+)위$/;

function isRankOnlyTitle(title: string): boolean {
  return RANK_TITLE_KO.test(title.trim());
}

/**
 * 저장된 제목이 `4위` 같은 순위 플레이스홀더일 때 — 카탈로그·외부 랭킹 풀의 실제 제목으로 바꿉니다.
 * (인기순위 UI에서 제목을 순위로 덮어쓰던 경우·구 장바구니 JSON 호환)
 */
export function unstubRankOnlyTitle(video: VideoTitleFields): VideoTitleFields {
  if (!isRankOnlyTitle(video.title)) return video;

  const catalog = getMarketVideoById(video.id);
  if (catalog?.title && !isRankOnlyTitle(catalog.title)) {
    return { ...video, title: catalog.title };
  }

  const manual = resolveManualTikTokVideoForStudio(video.id);
  if (manual?.title && !isRankOnlyTitle(manual.title)) {
    return { ...video, title: manual.title };
  }

  return video;
}

/** English UI에서 수동 랭킹 카드 등 `3위` 형식 제목 처리 */
function englishRankTitle(koTitle: string): string | null {
  const m = RANK_TITLE_KO.exec(koTitle.trim());
  return m ? `Rank ${m[1]}` : null;
}

/** 목록/상세에 표시할 영상 제목 (UI 언어 반영) */
export function videoDisplayTitle(video: VideoTitleFields, locale: SiteLocale): string {
  video = unstubRankOnlyTitle(video);
  if (locale !== "en") return video.title;

  const explicit = video.titleEn?.trim();
  if (explicit) return explicit;

  const mapped = VIDEO_TITLE_EN_BY_ID[video.id];
  if (mapped) return mapped;

  const rank = englishRankTitle(video.title);
  if (rank) return rank;

  return video.title;
}

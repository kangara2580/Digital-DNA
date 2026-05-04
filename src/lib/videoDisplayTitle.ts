import type { FeedVideo } from "@/data/videos";
import { VIDEO_TITLE_EN_BY_ID } from "@/data/videoTitlesEn";
import type { SiteLocale } from "@/lib/sitePreferences";

/** 최소 필드 — 알림 API 등 전체 `FeedVideo` 없이 제목만 있을 때 */
export type VideoTitleFields = Pick<FeedVideo, "id" | "title"> & {
  titleEn?: string;
};

const RANK_TITLE_KO = /^(\d+)위$/;

/** English UI에서 수동 랭킹 카드 등 `3위` 형식 제목 처리 */
function englishRankTitle(koTitle: string): string | null {
  const m = RANK_TITLE_KO.exec(koTitle.trim());
  return m ? `Rank ${m[1]}` : null;
}

/** 목록/상세에 표시할 영상 제목 (UI 언어 반영) */
export function videoDisplayTitle(video: VideoTitleFields, locale: SiteLocale): string {
  if (locale !== "en") return video.title;

  const explicit = video.titleEn?.trim();
  if (explicit) return explicit;

  const mapped = VIDEO_TITLE_EN_BY_ID[video.id];
  if (mapped) return mapped;

  const rank = englishRankTitle(video.title);
  if (rank) return rank;

  return video.title;
}

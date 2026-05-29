import { resolveStoredProfileColor } from "@/lib/profileColorSpectrum";

/** 클라이언트·서버 공용 — Prisma/DB import 금지 */
export type ReviewAuthorProfile = {
  userId: string;
  displayName: string;
  avatarKind: string | null;
  avatarSeed: string | null;
  avatarCustom: string | null;
  profileColor: string;
};

export function reviewAuthorFeedHref(userId: string): string {
  return `/seller/${encodeURIComponent(userId)}`;
}

/** API `author` 누락 시 — 영상 상세·리뷰 관리 동일 폴백 */
export function fallbackReviewAuthor(
  userId: string,
  nickname: string,
): ReviewAuthorProfile {
  const displayName = nickname.trim() || "guest";
  return {
    userId,
    displayName,
    avatarKind: null,
    avatarSeed: null,
    avatarCustom: null,
    profileColor: resolveStoredProfileColor(null, null, userId),
  };
}

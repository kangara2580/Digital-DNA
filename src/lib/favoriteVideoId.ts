/**
 * `favorites.video_id`는 Supabase에서 text UNIQUE — 저장·조회 대소문자가 다르면
 * likedByMe / 찜 상태가 순간 깨지거나 다른 행으로 취급될 수 있어 모든 경로에서 통일합니다.
 */
export function canonicalFavoriteVideoId(videoId: string): string {
  return videoId.trim().toLowerCase();
}

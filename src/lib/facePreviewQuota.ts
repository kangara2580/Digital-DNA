/**
 * AI 얼굴/배경 미리보기 공용 무료 체험 횟수.
 * 브라우저 localStorage 기준이며, 서버 비용 통제용 1차 필터입니다.
 */
const LS_KEY = "reels-market-ai-preview-remaining-v2";

export const FREE_LOCAL_FACE_PREVIEW_TRIES = 1;

export function getLocalFacePreviewRemaining(): number {
  if (typeof window === "undefined") return FREE_LOCAL_FACE_PREVIEW_TRIES;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (raw == null) return FREE_LOCAL_FACE_PREVIEW_TRIES;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return FREE_LOCAL_FACE_PREVIEW_TRIES;
    return Math.max(0, Math.min(n, FREE_LOCAL_FACE_PREVIEW_TRIES));
  } catch {
    return FREE_LOCAL_FACE_PREVIEW_TRIES;
  }
}

/** 성공한 미리보기 1회당 1 차감. 반환값: 남은 횟수 */
export function consumeLocalFacePreviewSuccess(): number {
  const next = Math.max(0, getLocalFacePreviewRemaining() - 1);
  try {
    window.localStorage.setItem(LS_KEY, String(next));
  } catch {
    /* noop */
  }
  return next;
}

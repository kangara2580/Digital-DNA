/** id마다 고정된 0~1 값 (같은 클립은 항상 같은 하이라이트 구간) */
export function hashVideoIdToUnit(videoId: string): number {
  let x = 2166136261;
  for (let i = 0; i < videoId.length; i++) {
    x ^= videoId.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return (Math.abs(x) % 100000) / 100000;
}

const PREVIEW_LEN_SEC = 2.85;

/**
 * 영상 길이와 id로 ‘하이라이트’ 시작 시각(초).
 * 앞·뒤 여유를 두어 호버 프리뷰 구간이 잘리지 않게 함.
 */
export function localHighlightStartSec(
  videoId: string,
  durationSec: number,
): number {
  if (!Number.isFinite(durationSec) || durationSec <= PREVIEW_LEN_SEC + 0.15) {
    return 0.05;
  }
  const u = hashVideoIdToUnit(videoId);
  const maxStart = Math.max(0.08, durationSec - PREVIEW_LEN_SEC - 0.12);
  return 0.08 + u * maxStart;
}

export function localPreviewSegmentSec(): number {
  return PREVIEW_LEN_SEC;
}

export function isLocalPublicVideo(src: string): boolean {
  return src.startsWith("/videos/") && src.endsWith(".mp4");
}

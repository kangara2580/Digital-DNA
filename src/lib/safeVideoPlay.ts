/**
 * HTMLMediaElement.play() — 일부 브라우저는 undefined 반환·동기 예외가 있고,
 * Promise reject 이유가 비표준인 경우가 있어 동영상 등에서 통일 처리합니다.
 */
export function safePlayVideo(
  el: HTMLVideoElement | HTMLAudioElement | null | undefined,
): void {
  if (!el) return;
  try {
    const ret = el.play();
    if (ret != null && typeof (ret as PromiseLike<void>).then === "function") {
      void (ret as Promise<void>).catch(() => {
        /* autoplay 정책·abort 등 무시 */
      });
    }
  } catch {
    /* 동기 DOMException 등 */
  }
}

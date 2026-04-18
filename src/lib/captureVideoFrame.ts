/**
 * 브라우저에서 `<video>`의 특정 시점 프레임을 이미지 Blob으로 캡처합니다.
 * 크로스 오리진 영상(예: 일부 외부 URL)은 캔버스가 오염되어 `null`을 반환할 수 있습니다.
 */
export async function captureFrameFromVideo(
  video: HTMLVideoElement,
  timeSec: number,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const done = (blob: Blob | null) => resolve(blob);

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          done(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          done(null);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob((b) => done(b), mimeType, quality);
      } catch {
        done(null);
      }
    };

    video.addEventListener("seeked", onSeeked);
    const dur = Number.isFinite(video.duration) ? video.duration : 0;
    const t = dur > 0 ? Math.min(Math.max(0, timeSec), Math.max(0, dur - 0.04)) : 0;
    video.currentTime = t;
  });
}

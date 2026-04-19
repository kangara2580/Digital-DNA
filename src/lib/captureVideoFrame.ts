/**
 * 브라우저에서 `<video>`의 특정 시점 프레임을 이미지 Blob으로 캡처합니다.
 * 크로스 오리진 영상(예: 일부 외부 URL)은 캔버스가 오염되어 `null`을 반환할 수 있습니다.
 */
/**
 * 원격 URL을 `fetch`→Blob URL로 띄운 뒤 프레임을 뽑습니다.
 * `<video crossOrigin>` 없이 재생할 때 캔버스가 오염되는 경우의 대안입니다(공개 URL·CORS 허용 전제).
 */
export async function captureFrameFromVideoSrc(
  src: string,
  timeSec: number,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92,
): Promise<Blob | null> {
  if (typeof document === "undefined" || !src.trim()) return null;
  try {
    const res = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      const to = window.setTimeout(() => reject(new Error("timeout")), 90000);
      const finish = (fn: () => void) => {
        window.clearTimeout(to);
        fn();
      };
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        finish(() => resolve());
        return;
      }
      video.onloadeddata = () => finish(() => resolve());
      video.onerror = () => finish(() => reject(new Error("video_load_error")));
    });
    const out = await captureFrameFromVideo(video, timeSec, mimeType, quality);
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
    return out;
  } catch {
    return null;
  }
}

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

/**
 * 로컬 파일(`File`)에서 미리보기 `<video>` 없이 직접 프레임을 뽑습니다.
 * 미리보기 요소가 아직 준비되지 않았거나 캡처가 실패할 때 제출 직전 폴백으로 사용합니다.
 */
export async function capturePosterFromFile(
  file: File,
  timeSec: number,
  mimeType: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.92,
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "auto";
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const to = window.setTimeout(() => reject(new Error("timeout")), 45000);
      const finish = (fn: () => void) => {
        window.clearTimeout(to);
        fn();
      };
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        finish(() => resolve());
        return;
      }
      video.onloadeddata = () => finish(() => resolve());
      video.onerror = () => finish(() => reject(new Error("video_load_error")));
    });

    return await captureFrameFromVideo(video, timeSec, mimeType, quality);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

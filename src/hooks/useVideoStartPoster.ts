import { useEffect, useState } from "react";

type Options = {
  /** 초 단위, 영상 앞부분이 완전히 검을 때를 피하기 위해 소량 오프셋 */
  timeSec?: number;
  maxWidth?: number;
};

/**
 * 단일 미리보기용: 영상 초반 프레임을 JPEG data URL로 한 번 뽑아 poster로 사용합니다.
 * (홈 카드처럼 다수 동시 실행에는 사용하지 마세요.)
 */
export function useVideoStartPoster(
  src: string | null | undefined,
  enabled: boolean,
  options?: Options,
): string | null {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const timeSec = options?.timeSec ?? 0.08;
  const maxWidth = options?.maxWidth ?? 720;

  useEffect(() => {
    if (!enabled || !src?.trim()) {
      setPosterUrl(null);
      return;
    }

    let cancelled = false;
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    /**
     * 동일 출처 상대 경로(`/videos/…`)에는 crossOrigin을 붙이지 않습니다.
     * 정적 MP4에 ACAO가 없을 때 anonymous 요청이 로드 실패를 유발할 수 있습니다.
     */
    if (typeof window !== "undefined") {
      try {
        const abs = new URL(src, window.location.href);
        if (abs.origin !== window.location.origin) {
          v.crossOrigin = "anonymous";
        }
      } catch {
        /* ignore */
      }
    }
    v.src = src;

    const cleanup = () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("error", onErr);
      v.removeAttribute("src");
      v.load();
    };

    const capture = () => {
      if (cancelled) return;
      try {
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return;
        const scale = Math.min(1, maxWidth / w);
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, cw, ch);
        const url = canvas.toDataURL("image/jpeg", 0.82);
        if (!cancelled) setPosterUrl(url);
      } catch {
        if (!cancelled) setPosterUrl(null);
      } finally {
        cleanup();
      }
    };

    const onSeeked = () => {
      capture();
    };

    const onMeta = () => {
      if (cancelled) return;
      const d = v.duration;
      const safe =
        Number.isFinite(d) && d > 0
          ? Math.min(timeSec, Math.max(0, d - 0.05))
          : timeSec;
      v.currentTime = safe;
    };

    const onErr = () => {
      if (!cancelled) setPosterUrl(null);
      cleanup();
    };

    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("error", onErr);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [src, enabled, timeSec, maxWidth]);

  return posterUrl;
}

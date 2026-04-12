"use client";

import { useEffect, useRef } from "react";

type VideoBackgroundCompositeProps = {
  foregroundSrc: string;
  backgroundSrc: string;
  onReady?: () => void;
  onError?: () => void;
};

/**
 * 녹색 스크린 전경(영상 매팅 결과) + 배경 영상을 캔버스에서 합성해 미리보기합니다.
 */
export function VideoBackgroundComposite({
  foregroundSrc,
  backgroundSrc,
  onReady,
  onError,
}: VideoBackgroundCompositeProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const fgRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tmpCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const bg = bgRef.current;
    const fg = fgRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !bg || !fg || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (!tmpCanvasRef.current) {
      tmpCanvasRef.current = document.createElement("canvas");
    }
    const tmp = tmpCanvasRef.current;
    const tmpCtx = tmp.getContext("2d", { willReadFrequently: true });
    if (!tmpCtx) return;

    let cancelled = false;

    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();

    bg.src = backgroundSrc;
    fg.src = foregroundSrc;
    bg.muted = true;
    fg.muted = true;
    bg.playsInline = true;
    fg.playsInline = true;
    bg.loop = true;
    fg.loop = true;

    const tryStart = () => {
      if (cancelled) return;
      if (bg.readyState < 2 || fg.readyState < 2) return;
      void bg.play().catch(() => {});
      void fg.play().catch(() => {});
      if (!readyRef.current) {
        readyRef.current = true;
        onReady?.();
      }
    };

    bg.addEventListener("loadeddata", tryStart);
    fg.addEventListener("loadeddata", tryStart);

    const tick = () => {
      if (cancelled) return;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 1 || h <= 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (Number.isFinite(bg.duration) && bg.duration > 0 && Number.isFinite(fg.duration) && fg.duration > 0) {
        const t = bg.currentTime % bg.duration;
        const target = t % fg.duration;
        if (Math.abs(fg.currentTime - target) > 0.08) {
          fg.currentTime = target;
        }
      }

      ctx.drawImage(bg, 0, 0, w, h);

      tmp.width = Math.floor(w);
      tmp.height = Math.floor(h);
      tmpCtx.drawImage(fg, 0, 0, w, h);
      const img = tmpCtx.getImageData(0, 0, tmp.width, tmp.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (g > 120 && g > r + 30 && g > b + 30 && r < 200 && b < 200) {
          d[i + 3] = 0;
        }
      }
      tmpCtx.putImageData(img, 0, 0);
      ctx.drawImage(tmp, 0, 0, w, h);

      rafRef.current = requestAnimationFrame(tick);
    };

    readyRef.current = false;
    rafRef.current = requestAnimationFrame(tick);

    const onVidErr = () => {
      if (!cancelled) onError?.();
    };
    bg.addEventListener("error", onVidErr);
    fg.addEventListener("error", onVidErr);

    return () => {
      cancelled = true;
      ro.disconnect();
      bg.removeEventListener("loadeddata", tryStart);
      fg.removeEventListener("loadeddata", tryStart);
      bg.removeEventListener("error", onVidErr);
      fg.removeEventListener("error", onVidErr);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      bg.pause();
      fg.pause();
      bg.removeAttribute("src");
      fg.removeAttribute("src");
      bg.load();
      fg.load();
    };
  }, [foregroundSrc, backgroundSrc, onReady, onError]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden bg-black">
      <video
        ref={bgRef}
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        aria-hidden
        playsInline
        muted
      />
      <video
        ref={fgRef}
        className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
        aria-hidden
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="block h-full w-full object-cover" />
    </div>
  );
}

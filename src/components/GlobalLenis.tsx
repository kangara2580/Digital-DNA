"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 문서 스크롤을 Lenis로 살짝만 완화 (기본보다 덜 끌리게: lerp·배율은 브라우저에 가깝게).
 * 탐색 시청 모드: 본문 스크롤이 내부 컨테이너로만 가므로 Lenis를 중지한다.
 */
type LenisInstance = import("lenis").default;

export function GlobalLenis() {
  const lenisRef = useRef<LenisInstance | null>(null);
  const rafRef = useRef<number>(0);
  const [exploreWatch, setExploreWatch] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const sync = () => {
      setExploreWatch(document.documentElement.dataset.exploreMode === "watch");
    };
    sync();
    window.addEventListener("reels:explore-mode", sync);
    return () => window.removeEventListener("reels:explore-mode", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || exploreWatch) {
      lenisRef.current?.destroy();
      lenisRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      return;
    }

    /** 모바일·탐색 시청: 네이티브 스크롤만 (Lenis 번들·rAF 부담 제거) */
    const mobileMq = window.matchMedia("(max-width: 767px)");
    if (mobileMq.matches) return;

    let cancelled = false;

    void (async () => {
      const [{ default: Lenis }] = await Promise.all([
        import("lenis"),
        import("lenis/dist/lenis.css"),
      ]);
      if (cancelled) return;

      const lenis = new Lenis({
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        lerp: 0.26,
      });
      lenisRef.current = lenis;

      const raf = (time: number) => {
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [exploreWatch, reduceMotion]);

  return null;
}

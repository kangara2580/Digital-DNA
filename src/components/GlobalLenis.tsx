"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect, useRef, useState } from "react";

/**
 * 문서 스크롤을 Lenis로 살짝만 완화 (기본보다 덜 끌리게: lerp·배율은 브라우저에 가깝게).
 * 탐색 시청 모드: 본문 스크롤이 내부 컨테이너로만 가므로 Lenis를 중지한다.
 */
export function GlobalLenis() {
  const lenisRef = useRef<Lenis | null>(null);
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

    const lenis = new Lenis({
      smoothWheel: true,
      /** 1에 가까울수록 휠·터치 거리가 네이티브에 가깝고 덜 “밀림” */
      wheelMultiplier: 1,
      touchMultiplier: 1,
      /** 높을수록 목표에 빠르게 붙음 — 0.09대는 끌리는 느낌이 큼 */
      lerp: 0.26,
    });
    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      lenis.destroy();
      if (lenisRef.current === lenis) lenisRef.current = null;
    };
  }, [exploreWatch, reduceMotion]);

  return null;
}

"use client";

import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_TOP_THRESHOLD = 80;

/** 맨 위로: 살짝만 비치게 하되 아이콘 대비 확보(전체 opacity 금지) */
const scrollTopShell =
  "border border-white/15 bg-reels-void/90 text-zinc-100 shadow-[0_10px_36px_-16px_rgba(255,255,255,0.14)] backdrop-blur-xl";

function getViewportScrollTop(): number {
  if (typeof document === "undefined") return 0;
  const root = document.scrollingElement ?? document.documentElement;
  return root.scrollTop;
}

export function FloatingHelp() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRafRef = useRef(0);
  const scrollTopAnimRafRef = useRef(0);
  const showMirrorRef = useRef(false);

  useEffect(() => {
    showMirrorRef.current = showScrollTop;
  }, [showScrollTop]);

  useEffect(() => {
    const apply = () => {
      scrollRafRef.current = 0;
      const y = getViewportScrollTop();
      const next = y > SCROLL_TOP_THRESHOLD;
      if (next !== showMirrorRef.current) {
        showMirrorRef.current = next;
        setShowScrollTop(next);
      }
    };

    const onScroll = () => {
      if (!scrollRafRef.current) {
        scrollRafRef.current = window.requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollRafRef.current) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTopAnimRafRef.current) {
        cancelAnimationFrame(scrollTopAnimRafRef.current);
        scrollTopAnimRafRef.current = 0;
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (scrollTopAnimRafRef.current) {
      cancelAnimationFrame(scrollTopAnimRafRef.current);
      scrollTopAnimRafRef.current = 0;
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.scrollingElement ?? document.documentElement;
    const startY = root.scrollTop;
    if (startY <= 0) return;

    if (reduce) {
      root.scrollTop = 0;
      return;
    }

    const durationMs = 420;
    let startTime: number | undefined;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

    const tick = (now: number) => {
      if (startTime === undefined) startTime = now;
      const t = Math.min(1, (now - startTime) / durationMs);
      root.scrollTop = startY * (1 - easeOutCubic(t));
      if (t < 1) {
        scrollTopAnimRafRef.current = requestAnimationFrame(tick);
      } else {
        root.scrollTop = 0;
        scrollTopAnimRafRef.current = 0;
      }
    };

    scrollTopAnimRafRef.current = requestAnimationFrame(tick);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-[100] flex flex-col items-end gap-2 sm:bottom-8 sm:right-6"
      style={{
        paddingBottom: "max(0px, env(safe-area-inset-bottom))",
        paddingRight: "max(0px, env(safe-area-inset-right))",
      }}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="맨 위로 가기"
        className={`flex h-11 w-11 items-center justify-center rounded-full ${scrollTopShell} scale-95 opacity-0 transition-[opacity,transform,box-shadow] duration-[400ms] ease-in-out hover:border-white/55 hover:bg-white/8 hover:shadow-[0_12px_36px_-14px_rgba(255,255,255,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 motion-reduce:transition-none ${
          showScrollTop
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none"
        }`}
      >
        <ChevronUp
          className="h-[18px] w-[18px] shrink-0 text-white"
          strokeWidth={2.25}
          aria-hidden
        />
      </button>

    </div>
  );
}

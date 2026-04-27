"use client";

import { ChevronUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_TOP_THRESHOLD = 80;

/** 맨 위로: 살짝만 비치게 하되 아이콘 대비 확보(전체 opacity 금지) */
const scrollTopShell =
  "border border-white/15 bg-reels-void/90 text-zinc-100 shadow-[0_10px_36px_-16px_rgba(255,255,255,0.14)] backdrop-blur-xl";

export function FloatingHelp() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRafRef = useRef(0);
  const showMirrorRef = useRef(false);

  useEffect(() => {
    showMirrorRef.current = showScrollTop;
  }, [showScrollTop]);

  useEffect(() => {
    const apply = () => {
      scrollRafRef.current = 0;
      const y =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
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

  const scrollToTop = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
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

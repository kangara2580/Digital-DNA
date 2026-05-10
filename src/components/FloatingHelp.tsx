"use client";

import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SCROLL_TOP_THRESHOLD = 80;

/** 홈 메인의 인기순위 블록 — `TrendingRankSection`과 id 일치 */
const HOME_TRENDING_SECTION_ID = "trending-rank";

function parseHeaderHeightPx(): number {
  if (typeof document === "undefined") return 72;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-height")
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 72;
}

/** `/`에서는 히어로 말고 인기순위 섹션 상단으로 스크롤 */
function getScrollTopTargetY(pathname: string): number {
  if (pathname !== "/") return 0;
  const el = document.getElementById(HOME_TRENDING_SECTION_ID);
  if (!el) return 0;
  const top = el.getBoundingClientRect().top + window.scrollY;
  const header = parseHeaderHeightPx();
  return Math.max(0, top - header - 8);
}

/** 맨 위로: 살짝만 비치게 하되 아이콘 대비 확보(전체 opacity 금지) */
const scrollTopShell =
  "border border-white/15 bg-reels-void/90 text-zinc-100 shadow-[0_10px_36px_-16px_rgba(255,255,255,0.14)] backdrop-blur-xl";

function getViewportScrollTop(): number {
  if (typeof document === "undefined") return 0;
  const root = document.scrollingElement ?? document.documentElement;
  return root.scrollTop;
}

export function FloatingHelp() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRafRef = useRef(0);
  const scrollTopAnimRafRef = useRef(0);
  /** pointerdown/키 입력 직전 뷰포트 스크롤 — 클릭 후 포커스·브라우저 기본 동작으로 밀린 값을 쓰지 않기 위함 */
  const scrollTopClickAnchorRef = useRef<number | null>(null);
  const showMirrorRef = useRef(false);

  useEffect(() => {
    showMirrorRef.current = showScrollTop;
  }, [showScrollTop]);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
    const startY = scrollTopClickAnchorRef.current ?? getViewportScrollTop();
    scrollTopClickAnchorRef.current = null;

    const targetY = getScrollTopTargetY(pathnameRef.current);
    if (Math.abs(startY - targetY) < 3) return;

    // 포커스 등으로 클릭 직전에 스크롤이 밀렸으면, 애니 시작 전에 원래 누른 위치로 즉시 복구
    root.scrollTop = startY;

    if (reduce) {
      root.scrollTop = targetY;
      return;
    }

    const durationMs = 420;
    let startTime: number | undefined;
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const delta = targetY - startY;

    const tick = (now: number) => {
      if (startTime === undefined) startTime = now;
      const t = Math.min(1, (now - startTime) / durationMs);
      root.scrollTop = startY + delta * easeOutCubic(t);
      if (t < 1) {
        scrollTopAnimRafRef.current = requestAnimationFrame(tick);
      } else {
        root.scrollTop = targetY;
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
        onPointerDown={(e) => {
          scrollTopClickAnchorRef.current = getViewportScrollTop();
          // 마우스/펜: 포커스 이동으로 문서가 아래로 밀리는 현상 방지 (터치는 클릭 합성에 영향을 줄 수 있어 제외)
          if (e.pointerType === "mouse" || e.pointerType === "pen") {
            e.preventDefault();
          }
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          scrollTopClickAnchorRef.current = getViewportScrollTop();
          if (e.key === " ") {
            e.preventDefault();
          }
        }}
        onClick={scrollToTop}
        aria-label={pathname === "/" ? "인기순위 섹션으로 이동" : "맨 위로 가기"}
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

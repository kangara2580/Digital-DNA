"use client";

import { type RefObject, useEffect } from "react";

/**
 * `overflow-x: auto` 가로 스트립 위에서 세로 휠이 가로 스크롤로 변환되는 경우가 있어
 * 페이지 세로 스크롤이 막힙니다. 세로 제스처(deltaY ≥ deltaX)일 때는 window로 넘기고,
 * 명확한 가로 제스처일 때만 브라우저 기본(스트립 가로 이동)을 유지합니다.
 *
 * 트랙패드 미세 delta가 매 이벤트마다 `scrollBy`를 때리면 메인 스레드와 싸우므로
 * delta를 한 프레임에 모아 한 번만 스크롤합니다.
 */
export function usePassVerticalWheelToPage(
  scrollRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let pendingY = 0;
    let rafId = 0;

    const flush = () => {
      rafId = 0;
      if (pendingY === 0) return;
      const dy = pendingY;
      pendingY = 0;
      window.scrollBy({
        top: dy,
        left: 0,
        behavior: "auto",
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      const max = el.scrollWidth - el.clientWidth;
      if (max <= 1) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      if (absX > absY) return;

      pendingY += e.deltaY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
      e.preventDefault();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (rafId) window.cancelAnimationFrame(rafId);
      pendingY = 0;
    };
  }, [scrollRef]);
}

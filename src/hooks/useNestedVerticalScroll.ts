"use client";

import { type RefObject, useEffect } from "react";

/**
 * overflow-y 영역 위에서 휠·트랙패드로 내부 스크롤이 되도록 합니다.
 * Lenis 등이 document wheel을 가로채는 경우에도 동작합니다.
 * 끝에 도달하면 이벤트를 페이지로 넘깁니다.
 */
export function useNestedVerticalScroll(
  scrollRef: RefObject<HTMLElement | null>,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;

      const max = el.scrollHeight - el.clientHeight;
      if (max <= 1) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      if (absY < absX) return;

      const top = el.scrollTop;
      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;
      const atTop = top <= 0;
      const atBottom = top >= max - 1;

      if ((goingDown && !atBottom) || (goingUp && !atTop)) {
        el.scrollTop += e.deltaY;
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [scrollRef, enabled]);
}

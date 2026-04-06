"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/** 플래시 세일 느낌 — 고정 길이(15분) 윈도우로 데모 카운트다운 */
export function FlashSaleCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    const WINDOW_MS = 15 * 60 * 1000;
    const tick = () => {
      const now = Date.now();
      const end = Math.ceil(now / WINDOW_MS) * WINDOW_MS;
      setLeft(Math.max(0, end - now));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const s = Math.floor(left / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  const cs = Math.floor((left % 1000) / 10);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-reels-crimson/35 bg-reels-crimson/10 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-reels-crimson shadow-reels-crimson/20"
      aria-live="polite"
      aria-label={`플래시 세일 남은 시간 ${mm}분 ${ss}초`}
    >
      <span
        className="relative flex h-2 w-2 shrink-0"
        aria-hidden
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-reels-crimson opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-reels-crimson" />
      </span>
      {pad(mm)}:{pad(ss)}.{pad(cs)}
    </span>
  );
}
